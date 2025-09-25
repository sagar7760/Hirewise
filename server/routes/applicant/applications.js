const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');

// Configure multer for file uploads - use memory storage to save files in database
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Test route to verify router works
router.get('/test', (req, res) => {
  res.json({ message: 'Applications route is working!' });
});

// @route   POST /api/applicant/applications
// @desc    Submit job application
// @access  Private (Applicant)
router.post('/', auth, upload.single('customResume'), async (req, res) => {
  try {
    console.log('Request headers:', req.headers); // Debug headers
    console.log('Authorization header:', req.headers.authorization); // Debug auth header
    console.log('Request user:', req.user); // Debug user object
    console.log('Request body:', req.body); // Debug request data
    
    const applicantId = req.user?.id;
    const {
      jobId,
      firstName,
      lastName,
      email,
      phone,
      location,
      skills,
      experience,
      expectedSalaryMin,
      expectedSalaryMax,
      coverLetter,
      useProfileResume
    } = req.body;

    console.log('Extracted data:', { applicantId, jobId, experience }); // Debug extracted data

    // Validate required fields
    if (!applicantId) {
      return res.status(400).json({ message: 'User authentication required' });
    }

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Validate experience field
    const validExperienceLevels = ['fresher', 'mid-level', 'senior', 'expert'];
    const normalizedExperience = experience && experience.trim() !== '' ? experience : 'fresher';
    
    if (!validExperienceLevels.includes(normalizedExperience)) {
      return res.status(400).json({ 
        message: 'Invalid experience level. Must be one of: fresher, mid-level, senior, expert' 
      });
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ message: 'Job is no longer accepting applications' });
    }

    // Check if user already applied for this job
    const existingApplication = await Application.findOne({
      applicant: applicantId,
      job: jobId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Get applicant profile for auto-population with resume reference
    const applicant = await User.findById(applicantId)
      .populate('profile.currentResumeId', 'fileName originalName fileSize mimeType uploadDate parsedData');

    // Create application object
    const applicationData = {
      applicant: applicantId,
      job: jobId,
      personalInfo: {
        firstName: firstName || applicant.firstName,
        lastName: lastName || applicant.lastName,
        email: email || applicant.email,
        phone: phone || applicant.phone
      },
      skills: skills ? skills.split(',').map(skill => skill.trim()) : applicant.skills || [],
      experience: normalizedExperience,
      expectedSalary: {
        min: expectedSalaryMin ? parseInt(expectedSalaryMin) : null,
        max: expectedSalaryMax ? parseInt(expectedSalaryMax) : null,
        currency: 'USD'
      },
      coverLetter,
      useProfileResume: useProfileResume === 'true',
      profileResumeId: useProfileResume === 'true' ? applicant.profile?.currentResumeId?._id : null,
      status: 'submitted'
    };

    // Handle custom resume upload - store file data in database
    if (req.file && useProfileResume === 'false') {
      applicationData.customResume = {
        fileName: req.file.originalname,
        fileData: req.file.buffer, // Use buffer from memory storage
        fileMimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadDate: new Date()
      };
    }

    // Create the application
    const application = new Application(applicationData);
    await application.save();

    // Populate the application with job and company details
    await application.populate([
      { path: 'job', select: 'title location type salaryRange company' },
      { path: 'job.company', select: 'name logo' }
    ]);

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ 
      message: 'Error submitting application',
      error: error.message 
    });
  }
});

// @route   GET /api/applicant/applications
// @desc    Get user's applications
// @access  Private (Applicant)
router.get('/', auth, async (req, res) => {
  try {
    const applicantId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ applicant: applicantId })
      .populate([
        { 
          path: 'job', 
          select: 'title location jobType salaryRange company status',
          populate: {
            path: 'company',
            select: 'name logo'
          }
        },
        {
          path: 'profileResumeId',
          select: 'fileName originalName fileSize mimeType uploadDate parsedData'
        }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments({ applicant: applicantId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      applications,
      pagination: {
        currentPage: page,
        totalPages,
        totalApplications: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ 
      message: 'Error fetching applications',
      error: error.message 
    });
  }
});

// @route   GET /api/applicant/applications/:id
// @desc    Get specific application
// @access  Private (Applicant)
router.get('/:id', auth, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const applicantId = req.user.id;

    const application = await Application.findOne({
      _id: applicationId,
      applicant: applicantId
    }).populate([
      { 
        path: 'job', 
        select: 'title description location type salaryRange company requirements',
        populate: {
          path: 'company',
          select: 'name logo description'
        }
      }
    ]);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ 
      message: 'Error fetching application',
      error: error.message 
    });
  }
});

// @route   DELETE /api/applicant/applications/:id
// @desc    Withdraw application (if allowed)
// @access  Private (Applicant)
router.delete('/:id', auth, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const applicantId = req.user.id;

    const application = await Application.findOne({
      _id: applicationId,
      applicant: applicantId
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if application can be withdrawn
    if (['interviewed', 'offered', 'hired', 'withdrawn'].includes(application.status)) {
      return res.status(400).json({ 
        message: 'Application cannot be withdrawn at this stage' 
      });
    }

    application.status = 'withdrawn';
    await application.save();

    res.json({ 
      message: 'Application withdrawn successfully',
      application 
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ 
      message: 'Error withdrawing application',
      error: error.message 
    });
  }
});

// @route   GET /api/applicant/applications/check/:jobId
// @desc    Check if user has already applied for a job
// @access  Private (Applicant)
router.get('/check/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const applicantId = req.user.id;

    const existingApplication = await Application.findOne({
      applicant: applicantId,
      job: jobId
    });

    res.json({ 
      hasApplied: !!existingApplication,
      application: existingApplication ? {
        id: existingApplication._id,
        status: existingApplication.status,
        appliedAt: existingApplication.createdAt
      } : null
    });

  } catch (error) {
    console.error('Check application error:', error);
    res.status(500).json({ 
      message: 'Error checking application status',
      error: error.message 
    });
  }
});

// @route   GET /api/applicant/applications/:id/resume
// @desc    Download resume from application
// @access  Private (Applicant)
router.get('/:id/resume', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.id;

    const application = await Application.findOne({
      _id: id,
      applicant: applicantId
    }).populate('profileResumeId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    let resumeData = null;
    let fileName = '';
    let mimeType = '';

    if (application.useProfileResume && application.profileResumeId) {
      // Use profile resume
      const resume = application.profileResumeId;
      resumeData = Buffer.from(resume.fileData, 'base64');
      fileName = resume.originalName || resume.fileName;
      mimeType = resume.mimeType;
    } else if (application.customResume && application.customResume.fileData) {
      // Use custom resume
      resumeData = application.customResume.fileData;
      fileName = application.customResume.fileName;
      mimeType = application.customResume.fileMimeType;
    }

    if (!resumeData) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': resumeData.length
    });

    res.send(resumeData);

  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({ 
      message: 'Error downloading resume',
      error: error.message 
    });
  }
});

module.exports = router;