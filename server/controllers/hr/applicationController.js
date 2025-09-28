const mongoose = require('mongoose');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');

// Calculate basic job matching score (before AI implementation)
const calculateJobMatchingScore = (application, job) => {
  let totalScore = 0;
  let maxScore = 0;

  // Skills matching (40% weight)
  const skillsWeight = 4;
  const candidateSkills = application.aiAnalysis?.extractedInfo?.skills || [];
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
  const candidateExp = application.aiAnalysis?.extractedInfo?.workExperience?.length || 0;
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
  const candidateEducation = application.aiAnalysis?.extractedInfo?.education || [];
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

// @desc    Get all applications for HR with filtering, sorting, and pagination
// @route   GET /api/hr/applications
// @access  Private (HR, Admin)
const getApplications = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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

    // Extract query parameters
    const {
      page = 1,
      limit = 20,
      job: jobFilter,
      status: statusFilter,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for jobs from the same company
    const companyJobs = await Job.find({ company: companyId }).select('_id');
    const jobIds = companyJobs.map(job => job._id);

    // Build application filter
    let filter = { job: { $in: jobIds } };

    // Add specific job filter
    if (jobFilter && jobFilter !== 'all') {
      filter.job = jobFilter;
    }

    // Add status filter  
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    // Add search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'personalInfo.email': searchRegex },
        { 'aiAnalysis.extractedInfo.skills': { $in: [searchRegex] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    let sortObj = {};
    switch (sortBy) {
      case 'resumeScore':
        sortObj = { 'aiAnalysis.overallScore': sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'appliedDate':
        sortObj = { createdAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'name':
        sortObj = { 'personalInfo.firstName': sortOrder === 'asc' ? 1 : -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Fetch applications with populated data
    const applications = await Application.find(filter)
      .populate({
        path: 'job',
        select: 'title department requiredSkills preferredSkills experienceLevel qualification',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate({
        path: 'applicant',
        select: 'firstName lastName email profilePicture'
      })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate total count for pagination
    const totalApplications = await Application.countDocuments(filter);
    const totalPages = Math.ceil(totalApplications / parseInt(limit));

    // Process applications and calculate scores if needed
    const processedApplications = applications.map(application => {
      // Calculate job matching score if not already present
      let resumeScore = application.aiAnalysis?.overallScore;
      if (!resumeScore && application.job) {
        resumeScore = calculateJobMatchingScore(application, application.job);
        // Note: In production, you might want to update the database with this score
      }

      // Format the application data
      return {
        id: application._id,
        candidate: {
          name: `${application.personalInfo.firstName} ${application.personalInfo.lastName}`,
          email: application.personalInfo.email,
          phone: application.personalInfo.phone,
          avatar: application.applicant?.profilePicture || null
        },
        job: {
          id: application.job._id,
          title: application.job.title,
          department: application.job.department
        },
        appliedDate: application.createdAt,
        resumeScore: resumeScore || 5.0,
        status: application.status,
        experience: application.aiAnalysis?.extractedInfo?.workExperience?.length 
          ? `${application.aiAnalysis.extractedInfo.workExperience.length} years` 
          : 'Not specified',
        skills: application.aiAnalysis?.extractedInfo?.skills || [],
        resumeUrl: application.resumeFile?.url || `/api/applications/${application._id}/resume`,
        aiAnalysis: {
          skillsMatch: application.aiAnalysis?.skillsMatch || 75,
          experienceMatch: application.aiAnalysis?.experienceMatch || 70,
          overallFit: Math.round((resumeScore || 5.0) * 10),
          strengths: application.aiAnalysis?.keyStrengths || ['Skills assessment pending'],
          concerns: application.aiAnalysis?.potentialConcerns || ['Detailed analysis pending']
        }
      };
    });

    res.json({
      success: true,
      data: processedApplications,
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
          status: statusFilter,
          search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching applications'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/hr/applications/:id/status
// @access  Private (HR, Admin)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      'submitted', 'under_review', 'shortlisted', 'interview_scheduled',
      'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined',
      'rejected', 'withdrawn'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    // Find and update application
    const application = await Application.findById(id)
      .populate('job', 'company');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify the application belongs to HR's company
    const userId = req.user.id;
    const user = await User.findById(userId);
    const companyId = user.company || user.companyId;

    if (application.job.company.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this application'
      });
    }

    // Update status
    application.status = status;
    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        id: application._id,
        status: application.status
      }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating application status'
    });
  }
};

// Get application resume for viewing
const getApplicationResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate application ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

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
        select: 'firstName lastName email profile',
        populate: {
          path: 'profile.currentResumeId',
          model: 'Resume'
        }
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

    // Check if application has resume data
    let resumeData = null;
    let resumeUrl = null;
    let resumeType = null;

    // Priority: Custom resume first, then profile resume
    if (application.customResume && application.customResume.fileUrl) {
      resumeUrl = application.customResume.fileUrl;
      resumeType = 'custom';
      resumeData = {
        fileName: application.customResume.fileName,
        fileUrl: application.customResume.fileUrl,
        mimeType: application.customResume.fileMimeType,
        uploadDate: application.customResume.uploadDate
      };
    } else if (application.applicant.profile?.currentResumeId) {
      const resume = application.applicant.profile.currentResumeId;
      resumeUrl = `/api/resumes/${resume._id}/download`;
      resumeType = 'profile';
      resumeData = {
        fileName: resume.fileName,
        fileUrl: resumeUrl,
        mimeType: resume.mimeType,
        uploadDate: resume.uploadDate
      };
    }

    if (!resumeData) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found for this application'
      });
    }

    // If it's a direct file URL, redirect to it
    if (resumeType === 'custom' && application.customResume.fileUrl.startsWith('http')) {
      return res.redirect(application.customResume.fileUrl);
    }

    // If it's a profile resume, redirect to the resume download endpoint
    if (resumeType === 'profile') {
      return res.redirect(resumeUrl);
    }

    // For stored file data, serve it directly
    if (application.customResume && application.customResume.fileData) {
      res.set({
        'Content-Type': application.customResume.fileMimeType || 'application/pdf',
        'Content-Length': application.customResume.fileSize,
        'Content-Disposition': `inline; filename="${application.customResume.fileName}"`
      });
      return res.send(application.customResume.fileData);
    }

    return res.status(404).json({
      success: false,
      message: 'Resume file not accessible'
    });

  } catch (error) {
    console.error('Get application resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching resume'
    });
  }
};

module.exports = {
  getApplications,
  updateApplicationStatus,
  getApplicationResume
};