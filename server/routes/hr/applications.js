const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');
const Interview = require('../../models/Interview');
const { auth, authorize } = require('../../middleware/auth');
const mongoose = require('mongoose');
const { createAndEmit } = require('../../services/notificationService');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const geminiService = require('../../services/geminiService');

const router = express.Router();

// @route   GET /api/hr/applications
// @desc    Get all applications for HR's jobs with filtering and pagination
// @access  Private (HR, Admin)
router.get('/', auth, authorize('hr', 'admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined', 'interview_scheduled']).withMessage('Invalid status'),
  query('job').optional().isMongoId().withMessage('Invalid job ID'),
  query('search').optional().isLength({ min: 1, max: 200 }).withMessage('Search term must be between 1 and 200 characters'),
  query('sortBy').optional().isIn(['appliedDate', 'resumeScore', 'name', 'createdAt', 'aiScore', 'status', 'applicantName']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      job: jobFilter,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Get user's company
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const companyId = user.company || user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company association required'
      });
    }

    // Get company's jobs
    const companyJobs = await Job.find({ company: companyId }).select('_id title department requiredSkills preferredSkills experienceLevel qualification');
    const jobIds = companyJobs.map(job => job._id);

    // Build filter query
    let filter = { job: { $in: jobIds } };

    if (status && status !== 'all') filter.status = status;
    if (jobFilter && jobFilter !== 'all') {
      // Ensure the job filter is within company's jobs
      if (jobIds.some(id => id.toString() === jobFilter)) {
        // Convert string to ObjectId for proper MongoDB querying
        filter.job = new mongoose.Types.ObjectId(jobFilter);
      }
    }

    const skip = (page - 1) * limit;

    // Debug the final filter
    console.log('Final filter query:', JSON.stringify(filter, null, 2));

    // Build aggregation pipeline for search and sorting
    let pipeline = [
      { $match: filter }
    ];

    // Lookup applicant and job details
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'applicantDetails'
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      {
        $unwind: '$applicantDetails'
      },
      {
        $unwind: '$jobDetails'
      },
      // Lookup resume data for profile resumes
      {
        $lookup: {
          from: 'resumes',
          localField: 'profileResumeId',
          foreignField: '_id',
          as: 'profileResumeData'
        }
      }
    );

    // Add search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'applicantDetails.firstName': { $regex: search, $options: 'i' } },
            { 'applicantDetails.lastName': { $regex: search, $options: 'i' } },
            { 'applicantDetails.email': { $regex: search, $options: 'i' } },
            { 'jobDetails.title': { $regex: search, $options: 'i' } },
            { 'jobDetails.department': { $regex: search, $options: 'i' } },
            { 'parsedResume.skills': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting
    let sortStage = {};
    switch (sortBy) {
      case 'resumeScore':
      case 'aiScore':
        sortStage = { 'aiAnalysis.overallScore': sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'name':
      case 'applicantName':
        sortStage = { 'applicantDetails.firstName': sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'appliedDate':
        sortStage = { createdAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'status':
        sortStage = { status: sortOrder === 'asc' ? 1 : -1 };
        break;
      default:
        sortStage = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    }
    pipeline.push({ $sort: sortStage });

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    // Project fields
    pipeline.push({
      $project: {
        _id: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        resumeUrl: 1,
        coverLetter: 1,
        aiAnalysis: 1,
        parsedResume: 1,
        timeline: 1,
        notes: 1,
        // Application specific fields
        personalInfo: 1,
        skills: 1,
        experience: 1,
        // Resume fields (minimal for URL generation only)
        useProfileResume: 1,
        profileResumeId: 1,
        'customResume.fileName': 1,
        'customResume.fileUrl': 1,
        'customResume.uploadDate': 1,
        'applicantDetails._id': 1,
        'applicantDetails.firstName': 1,
        'applicantDetails.lastName': 1,
        'applicantDetails.email': 1,
        'applicantDetails.profile.experience': 1,
        'applicantDetails.profile.skills': 1,
        'jobDetails._id': 1,
        'jobDetails.title': 1,
        'jobDetails.department': 1,
        'jobDetails.employmentType': 1
      }
    });

    const applications = await Application.aggregate(pipeline);

    // Get total count for pagination
    const totalApplications = await Application.countDocuments(filter);
    const totalPages = Math.ceil(totalApplications / limit);

    // Calculate basic job matching score for applications without AI analysis
    const calculateJobMatchingScore = (app, jobsData) => {
      const job = jobsData.find(j => j._id.toString() === app.jobDetails._id.toString());
      if (!job) return 5.0;

      let totalScore = 0;
      let maxScore = 0;

      // Skills matching (40% weight)
      const skillsWeight = 4;
      const candidateSkills = app.aiAnalysis?.extractedInfo?.skills || app.parsedResume?.skills || [];
      const requiredSkills = job.requiredSkills || [];
      const preferredSkills = job.preferredSkills || [];
      
      if (requiredSkills.length > 0 || preferredSkills.length > 0) {
        const allJobSkills = [...requiredSkills, ...preferredSkills];
        const matchingSkills = candidateSkills.filter(skill => 
          allJobSkills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        const skillsScore = allJobSkills.length > 0 ? (matchingSkills.length / allJobSkills.length) * 10 : 5;
        totalScore += skillsScore * skillsWeight;
        maxScore += 10 * skillsWeight;
      }

      // Experience matching (35% weight)
      const expWeight = 3.5;
      const candidateExp = app.applicantDetails?.profile?.experience?.length || 0;
      const requiredExpLevel = job.experienceLevel || 'entry';
      
      let expScore = 5; // Default score
      if (requiredExpLevel === 'entry' && candidateExp >= 0) expScore = 8;
      else if (requiredExpLevel === 'mid' && candidateExp >= 2) expScore = 8;
      else if (requiredExpLevel === 'senior' && candidateExp >= 4) expScore = 9;
      else if (requiredExpLevel === 'lead' && candidateExp >= 6) expScore = 9;
      
      totalScore += expScore * expWeight;
      maxScore += 10 * expWeight;

      // Education matching (25% weight)
      const eduWeight = 2.5;
      const candidateEducation = app.aiAnalysis?.extractedInfo?.education || app.parsedResume?.education || [];
      const requiredQualification = job.qualification || '';
      
      let eduScore = 5; // Default score
      if (candidateEducation.length > 0) {
        const hasRelevantEducation = candidateEducation.some(edu => 
          requiredQualification.toLowerCase().includes(edu.degree?.toLowerCase() || '') ||
          edu.degree?.toLowerCase().includes(requiredQualification.toLowerCase()) ||
          (requiredQualification.toLowerCase().includes('bachelor') && edu.degree?.toLowerCase().includes('bachelor')) ||
          (requiredQualification.toLowerCase().includes('master') && edu.degree?.toLowerCase().includes('master'))
        );
        eduScore = hasRelevantEducation ? 8 : 6;
      }
      
      totalScore += eduScore * eduWeight;
      maxScore += 10 * eduWeight;

      // Calculate final score out of 10
      const finalScore = maxScore > 0 ? (totalScore / maxScore) * 10 : 5;
      return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
    };

    // Format applications for frontend
    const formattedApplications = applications.map(app => {
      const resumeScore = app.aiAnalysis?.overallScore || calculateJobMatchingScore(app, companyJobs);
      

      return {
        id: app._id,
        candidate: {
          name: `${app.applicantDetails.firstName} ${app.applicantDetails.lastName}`,
          email: app.applicantDetails.email,
          phone: app.personalInfo?.phone || 'Not provided'
        },
        job: {
          id: app.jobDetails._id,
          title: app.jobDetails.title,
          department: app.jobDetails.department
        },
        appliedDate: app.createdAt,
        resumeScore: resumeScore,
        status: app.status,
        experience: app.experience === 'fresher' ? 'Fresher' : app.experience || 'Not specified',
        skills: app.skills || [],
        resumeUrl: app.resumeUrl || `/api/hr/applications/${app._id}/resume`,
        // Resume-related fields (minimal for functionality)
        useProfileResume: app.useProfileResume,
        profileResumeId: app.profileResumeId,
        aiAnalysis: {
          skillsMatch: app.aiAnalysis?.skillsMatch || Math.round(resumeScore * 7.5),
          experienceMatch: app.aiAnalysis?.experienceMatch || Math.round(resumeScore * 7),
          overallFit: Math.round(resumeScore * 10),
          strengths: app.aiAnalysis?.keyStrengths || ['Skills assessment pending'],
          concerns: app.aiAnalysis?.potentialConcerns || ['Detailed analysis pending']
        }
      };
    });

    res.json({
      success: true,
      data: formattedApplications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalApplications,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      filters: {
        applied: {
          job: jobFilter,
          status,
          search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get HR applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/applications/:id
// @desc    Get a specific application with full details
// @access  Private (HR, Admin)
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid application ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get HR's jobs to verify access
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const application = await Application.findOne({
      _id: req.params.id,
      job: { $in: hrJobIds }
    })
    .populate('applicant', 'firstName lastName email phone profilePicture profile')
    .populate('job', 'title department location employmentType requirements responsibilities skills')
    .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get interview details if any
    const interviews = await Interview.find({ application: application._id })
      .populate('interviewer', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...application,
        interviews
      }
    });

  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/hr/applications/:id/status
// @desc    Update application status
// @access  Private (HR, Admin)
router.put('/:id/status', auth, authorize('hr', 'admin'), [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('status')
    .isIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined', 'interview_scheduled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, notes } = req.body;

    // Get user's company jobs to verify access
    const userId = req.user.id;
    const user = await User.findById(userId);
    const companyId = user.company || user.companyId;
    
    const companyJobs = await Job.find({ company: companyId }).select('_id');
    const jobIds = companyJobs.map(job => job._id);

    const application = await Application.findOne({
      _id: req.params.id,
      job: { $in: jobIds }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const oldStatus = application.status;

    // Update application
    application.status = status;
    application.updatedAt = new Date();

    // Add timeline entry
    application.timeline.push({
      status,
      date: new Date(),
      notes,
      updatedBy: req.user?.id || new mongoose.Types.ObjectId()
    });

    // Add notes if provided
    if (notes) {
      application.notes.push({
        content: notes,
        addedBy: req.user?.id || new mongoose.Types.ObjectId(),
        addedAt: new Date()
      });
    }

    await application.save();

    // Send notification to applicant about status change
    try {
      const applicant = await User.findById(application.applicant).select('firstName lastName');
      const job = await Job.findById(application.job).select('title');
      
      if (applicant && job) {
        const statusMessages = {
          under_review: 'Your application is now under review',
          shortlisted: 'Congratulations! You have been shortlisted',
          rejected: 'Your application status has been updated',
          interviewed: 'Your interview has been completed',
          offer_extended: 'Congratulations! You have received a job offer',
          offer_accepted: 'Your offer acceptance has been confirmed',
          offer_declined: 'Your offer declination has been recorded',
          interview_scheduled: 'Your interview has been scheduled'
        };

        await createAndEmit({
          toUserId: application.applicant,
          toRole: 'applicant',
          type: 'application_status_changed',
          title: 'Application Status Updated',
          message: statusMessages[status] || `Your application status has been updated to ${status}`,
          actionUrl: `/applicant/applications/${application._id}`,
          entity: { kind: 'Application', id: application._id },
          priority: status === 'offer_extended' || status === 'shortlisted' ? 'high' : 'medium',
          metadata: {
            applicantName: `${applicant.firstName} ${applicant.lastName}`,
            jobTitle: job.title,
            oldStatus,
            newStatus: status
          },
          createdBy: req.user?.id
        });
      }
    } catch (notifError) {
      console.error('Failed to send status change notification:', notifError);
      // Don't fail the status update if notification fails
    }

    res.json({
      success: true,
      message: `Application status updated from ${oldStatus} to ${status}`,
      data: {
        id: application._id,
        status: application.status
      }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/hr/applications/:id/notes
// @desc    Add a note to an application
// @access  Private (HR, Admin)
router.post('/:id/notes', [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get HR's jobs to verify access
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const application = await Application.findOne({
      _id: req.params.id,
      job: { $in: hrJobIds }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Add note
    const newNote = {
      content: req.body.content,
      addedBy: req.user?.id || new mongoose.Types.ObjectId(),
      addedAt: new Date()
    };

    application.notes.push(newNote);
    application.updatedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: newNote
    });

  } catch (error) {
    console.error('Add application note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/applications/bulk/export
// @desc    Export applications data (for HR dashboard)
// @access  Private (HR, Admin)
router.get('/bulk/export', [
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  query('status').optional().isIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined']).withMessage('Invalid status'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { format = 'json', status, jobId, startDate, endDate } = req.query;

    // Get HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    // Build filter
    let filter = { job: { $in: hrJobIds } };
    if (status) filter.status = status;
    if (jobId) filter.job = jobId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get applications data
    const applications = await Application.find(filter)
      .populate('applicant', 'firstName lastName email phone')
      .populate('job', 'title department employmentType')
      .sort({ createdAt: -1 })
      .lean();

    // Format data for export
    const exportData = applications.map(app => ({
      applicationId: app._id,
      applicantName: `${app.applicant.firstName} ${app.applicant.lastName}`,
      applicantEmail: app.applicant.email,
      applicantPhone: app.applicant.phone,
      jobTitle: app.job.title,
      department: app.job.department,
      employmentType: app.job.employmentType,
      status: app.status,
      aiScore: app.aiAnalysis?.overallScore,
      appliedDate: app.createdAt,
      lastUpdated: app.updatedAt,
      skills: app.parsedResume?.skills?.join(', '),
      experience: app.parsedResume?.experience?.length || 0,
      education: app.parsedResume?.education?.length || 0
    }));

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=applications-export.csv');
      return res.send(csvContent);
    }

    res.json({
      success: true,
      data: exportData,
      summary: {
        totalApplications: exportData.length,
        filters: { status, jobId, startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Export applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/hr/applications/bulk/status
// @desc    Update status of multiple applications
// @access  Private (HR, Admin)
router.patch('/bulk/status', [
  body('applicationIds')
    .isArray({ min: 1 })
    .withMessage('Application IDs must be a non-empty array'),
  body('applicationIds.*')
    .isMongoId()
    .withMessage('Each application ID must be valid'),
  body('status')
    .isIn(['under_review', 'shortlisted', 'rejected'])
    .withMessage('Invalid bulk status operation'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { applicationIds, status, notes } = req.body;

    // Get HR's jobs to verify access
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    // Verify all applications belong to HR's jobs
    const applications = await Application.find({
      _id: { $in: applicationIds },
      job: { $in: hrJobIds }
    });

    if (applications.length !== applicationIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some applications were not found or do not belong to you'
      });
    }

    // Update applications
    const updatePromises = applications.map(async (app) => {
      app.status = status;
      app.updatedAt = new Date();
      
      // Add timeline entry
      app.timeline.push({
        status,
        date: new Date(),
        notes: notes || `Bulk status update to ${status}`,
        updatedBy: req.user?.id || new mongoose.Types.ObjectId()
      });

      // Add note if provided
      if (notes) {
        app.notes.push({
          content: notes,
          addedBy: req.user?.id || new mongoose.Types.ObjectId(),
          addedAt: new Date()
        });
      }

      return app.save();
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Successfully updated ${applications.length} applications to ${status}`,
      data: {
        updatedCount: applications.length,
        status
      }
    });

  } catch (error) {
    console.error('Bulk update applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/applications/:id/resume
// @desc    Get application resume for viewing
// @access  Private (HR, Admin)
router.get('/:id/resume', auth, authorize('hr', 'admin'), [
  param('id').isMongoId().withMessage('Invalid application ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Get user's company
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the application and populate related data
    const application = await Application.findById(id)
      .populate({
        path: 'job',
        select: 'title company postedBy',
        match: { company: user.company }
      })
      .populate({
        path: 'applicant',
        select: 'firstName lastName email profile'
      })
      .populate({
        path: 'profileResumeId',
        model: 'Resume',
        select: 'fileName originalName fileSize mimeType uploadDate'
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if this application belongs to a job from the HR's company
    if (!application.job) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This application does not belong to your company.'
      });
    }

    // Serve resume data based on useProfileResume flag
    if (application.useProfileResume) {
      // Using profile resume - get from Resume collection
      if (application.profileResumeId) {
        const Resume = require('../../models/Resume');
        const resume = await Resume.findById(application.profileResumeId);
        
        if (!resume) {
          return res.status(404).json({
            success: false,
            message: 'Profile resume not found'
          });
        }

        // Convert Base64 back to buffer and serve
        const fileBuffer = Buffer.from(resume.fileData, 'base64');
        
        // Ensure proper content type for browser viewing
        const contentType = resume.mimeType || 'application/pdf';
        const isViewableInBrowser = contentType.includes('pdf') || contentType.includes('image/');
        
        res.set({
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length,
          'Content-Disposition': isViewableInBrowser ? 'inline' : 'attachment',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        });
        return res.send(fileBuffer);
      } else {
        return res.status(404).json({
          success: false,
          message: 'Profile resume not found for this application'
        });
      }
    } else {
      // Using custom resume - get from Application collection
      if (application.customResume) {
        if (application.customResume.fileData) {
          // If it's binary data, serve it directly
          const fileBuffer = Buffer.isBuffer(application.customResume.fileData) 
            ? application.customResume.fileData 
            : Buffer.from(application.customResume.fileData, 'base64');
            
          // Ensure proper content type for browser viewing
          const contentType = application.customResume.fileMimeType || 'application/pdf';
          const isViewableInBrowser = contentType.includes('pdf') || contentType.includes('image/');
          
          res.set({
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length,
            'Content-Disposition': isViewableInBrowser ? 'inline' : 'attachment',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
          });
          return res.send(fileBuffer);
        } else if (application.customResume.fileUrl) {
          // If it's a stored URL, we need to fetch and serve the file
          // For now, return an error as this case needs more implementation
          return res.status(501).json({
            success: false,
            message: 'Resume stored as URL not yet supported for viewing'
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Custom resume not found for this application'
      });
    }

  } catch (error) {
    console.error('Get application resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching resume'
    });
  }
});

// @route   POST /api/hr/applications/:id/ai-feedback-analysis
// @desc    Generate on-demand AI sentiment/summary from interview feedback, cached by content hash
// @access  Private (HR, Admin)
const aiAnalysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req /*, res*/) => `${req.user?.id || 'anon'}:${req.params?.id || 'app'}`,
  handler: (req, res /*, next, options */) => {
    res.status(429).json({ success: false, message: 'AI analysis rate-limited. Please wait ~1 minute.' });
  }
});

router.post('/:id/ai-feedback-analysis', auth, authorize('hr','admin'), aiAnalysisLimiter, [
  param('id').isMongoId().withMessage('Invalid application ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    // Verify the application belongs to HR's company/jobs
    const user = await User.findById(req.user.id).select('company companyId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const companyId = user.company || user.companyId;
    const companyJobs = await Job.find({ company: companyId }).select('_id title');
    const jobIds = companyJobs.map(j => j._id);

    const application = await Application.findOne({ _id: id, job: { $in: jobIds } })
      .populate('job', 'title description requiredSkills preferredSkills')
      .lean();
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Gather interviews with submitted feedback or completed status
    const interviews = await Interview.find({ application: id, $or: [
      { 'feedback.submittedAt': { $ne: null } },
      { status: 'completed' }
    ]}).sort({ scheduledDate: 1 }).lean();

    // Build aggregated feedback text
    const parts = [];
    if (!interviews.length) {
      parts.push('No interview feedback available.');
    } else {
      interviews.forEach((iv, idx) => {
        const fb = iv.feedback || {};
        const seg = [
          `Interview #${idx + 1} (${iv.type || 'n/a'} round ${iv.round || 1})`,
          fb.overallRating ? `Overall rating: ${fb.overallRating}/5` : null,
          fb.technicalSkills ? `Technical: ${fb.technicalSkills}/5` : null,
          fb.communicationSkills ? `Communication: ${fb.communicationSkills}/5` : null,
          fb.problemSolving ? `Problem Solving: ${fb.problemSolving}/5` : null,
          fb.culturalFit ? `Cultural Fit: ${fb.culturalFit}/5` : null,
          Array.isArray(fb.strengths) && fb.strengths.length ? `Strengths: ${fb.strengths.join('; ')}` : null,
          Array.isArray(fb.weaknesses) && fb.weaknesses.length ? `Concerns: ${fb.weaknesses.join('; ')}` : null,
          fb.recommendation ? `Recommendation: ${fb.recommendation}` : null,
          fb.additionalNotes ? `Notes: ${fb.additionalNotes}` : null
        ].filter(Boolean).join('\n');
        parts.push(seg);
      });
    }

    // Include HR notes (if any) for extra context
    if (Array.isArray(application.notes) && application.notes.length) {
      const noteTexts = application.notes.map(n => n.text || n.content).filter(Boolean);
      if (noteTexts.length) {
        parts.push('HR Notes:');
        parts.push(noteTexts.join('\n'));
      }
    }

    const aggregated = parts.join('\n\n');
    const contentHash = crypto.createHash('sha256').update(aggregated).digest('hex');

    // Check cache
    // Cache temporarily disabled during testing: always run fresh analysis

    // Run AI analysis
    const aiResult = await geminiService.analyzeInterviewFeedback({
      feedbackText: aggregated,
      candidateName: application.personalInfo?.firstName ? `${application.personalInfo.firstName} ${application.personalInfo.lastName || ''}`.trim() : undefined,
      jobTitle: application.job?.title,
      jobDescription: application.job?.description,
      applicationId: application._id?.toString?.() || id,
      jobId: application.job?._id?.toString?.(),
      skills: Array.from(new Set([
        ...(Array.isArray(application.skills) ? application.skills : []),
        ...(application.aiAnalysis?.extractedInfo?.skills || []),
        ...(application.job?.requiredSkills || [])
      ])),
      status: application.status
    });

    // Normalize result
    const normalized = {
      sentiment: aiResult.sentiment || 'neutral',
      confidence: typeof aiResult.confidence === 'number' ? Math.max(0, Math.min(1, aiResult.confidence)) : 0.5,
      summary: aiResult.summary || 'No summary produced',
      strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths : [],
      concerns: Array.isArray(aiResult.concerns) ? aiResult.concerns : [],
      flags: Array.isArray(aiResult.flags) ? aiResult.flags : [],
      suggestedDecisionNote: aiResult.suggestedDecisionNote || '',
      generatedAt: new Date(),
      interviewsConsidered: interviews.map(iv => iv._id),
      contentHash,
      model: geminiService.modelId
    };

    // Save to application
    await Application.findByIdAndUpdate(id, { $set: { aiFeedback: normalized } });

    return res.json({ success: true, cached: false, data: normalized });
  } catch (error) {
    console.error('AI feedback analysis error:', error);
    return res.status(500).json({ success: false, message: 'Failed to analyze interview feedback' });
  }
});

module.exports = router;
