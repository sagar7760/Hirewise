const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');
const Interview = require('../../models/Interview');
const { auth, authorize } = require('../../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/hr/applications
// @desc    Get all applications for HR's jobs with filtering and pagination
// @access  Private (HR, Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined']).withMessage('Invalid status'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  query('search').optional().isLength({ min: 1, max: 200 }).withMessage('Search term must be between 1 and 200 characters'),
  query('sortBy').optional().isIn(['createdAt', 'aiScore', 'status', 'applicantName']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'executive']).withMessage('Invalid experience level'),
  query('minScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Minimum score must be between 0 and 100'),
  query('maxScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Maximum score must be between 0 and 100')
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
      jobId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      experienceLevel,
      minScore,
      maxScore
    } = req.query;

    // Get HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    // Build filter query
    let filter = { job: { $in: hrJobIds } };

    if (status) filter.status = status;
    if (jobId) filter.job = jobId;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    // Score filtering
    if (minScore !== undefined || maxScore !== undefined) {
      filter['aiAnalysis.overallScore'] = {};
      if (minScore !== undefined) filter['aiAnalysis.overallScore'].$gte = parseFloat(minScore);
      if (maxScore !== undefined) filter['aiAnalysis.overallScore'].$lte = parseFloat(maxScore);
    }

    const skip = (page - 1) * limit;

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
      case 'aiScore':
        sortStage = { 'aiAnalysis.overallScore': sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'applicantName':
        sortStage = { 'applicantDetails.firstName': sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'status':
        sortStage = { status: sortOrder === 'asc' ? 1 : -1 };
        break;
      default:
        sortStage = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
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
        'applicantDetails._id': 1,
        'applicantDetails.firstName': 1,
        'applicantDetails.lastName': 1,
        'applicantDetails.email': 1,
        'applicantDetails.profilePicture': 1,
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

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalApplications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          status,
          jobId,
          search,
          experienceLevel,
          minScore,
          maxScore
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

// @route   PATCH /api/hr/applications/:id/status
// @desc    Update application status
// @access  Private (HR, Admin)
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('status')
    .isIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('feedback')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Feedback must be less than 2000 characters')
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

    const { status, notes, feedback } = req.body;

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

    // Add feedback if provided
    if (feedback) {
      application.feedback = {
        content: feedback,
        providedBy: req.user?.id || new mongoose.Types.ObjectId(),
        providedAt: new Date()
      };
    }

    await application.save();

    // Populate for response
    const updatedApplication = await Application.findById(application._id)
      .populate('applicant', 'firstName lastName email')
      .populate('job', 'title department')
      .lean();

    res.json({
      success: true,
      message: `Application status updated from ${oldStatus} to ${status}`,
      data: updatedApplication
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

module.exports = router;