const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { uploadResume } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// @route   POST /api/applications
// @desc    Submit a job application
// @access  Private (Applicant)
router.post('/', auth, authorize('applicant'), uploadResume.single('resume'), [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('Cover letter too long')
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

    const { jobId, firstName, lastName, email, phone, coverLetter } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available for applications'
      });
    }

    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Check if resume was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required'
      });
    }

    // Create application
    const applicationData = {
      job: jobId,
      applicant: req.user.id,
      personalInfo: {
        firstName,
        lastName,
        email,
        phone
      },
      resume: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/resumes/${req.file.filename}`,
        fileSize: req.file.size,
        uploadDate: new Date()
      },
      coverLetter,
      timeline: [{
        status: 'submitted',
        date: new Date(),
        note: 'Application submitted'
      }]
    };

    const application = new Application(applicationData);
    await application.save();

    // Update job applications count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    // Populate response data
    await application.populate([
      { path: 'job', select: 'title company location workType jobType' },
      { path: 'applicant', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications
// @access  Private (Applicant)
router.get('/my-applications', auth, authorize('applicant'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { applicant: req.user.id };
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get applications
    const applications = await Application.find(query)
      .populate('job', 'title company location workType jobType salary status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalApplications = await Application.countDocuments(query);
    const totalPages = Math.ceil(totalApplications / parseInt(limit));

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalApplications,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/applications/:id
// @desc    Get application details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company location workType jobType salary requirements skills')
      .populate('applicant', 'firstName lastName email phone profile')
      .populate('timeline.updatedBy', 'firstName lastName')
      .populate('notes.author', 'firstName lastName')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    if (req.user.role === 'applicant' && application.applicant._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Get application error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/applications/:id/withdraw
// @desc    Withdraw application
// @access  Private (Applicant)
router.put('/:id/withdraw', auth, authorize('applicant'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns this application
    if (application.applicant.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if application can be withdrawn
    if (['offer_accepted', 'withdrawn'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Application cannot be withdrawn at this stage'
      });
    }

    // Update application status
    application.status = 'withdrawn';
    application.timeline.push({
      status: 'withdrawn',
      date: new Date(),
      note: 'Application withdrawn by candidate'
    });

    await application.save();

    // Decrease job applications count
    await Job.findByIdAndUpdate(application.job, { $inc: { applicationsCount: -1 } });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: application
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/applications/stats/dashboard
// @desc    Get applicant dashboard stats
// @access  Private (Applicant)
router.get('/stats/dashboard', auth, authorize('applicant'), async (req, res) => {
  try {
    const applicantId = req.user.id;

    // Get application statistics
    const totalApplications = await Application.countDocuments({ applicant: applicantId });
    
    const statusStats = await Application.aggregate([
      { $match: { applicant: applicantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get recent applications
    const recentApplications = await Application.find({ applicant: applicantId })
      .populate('job', 'title company location salary workType')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Process status stats
    const stats = {
      totalApplications,
      submitted: 0,
      under_review: 0,
      shortlisted: 0,
      interview_scheduled: 0,
      interviewed: 0,
      offer_extended: 0,
      rejected: 0
    };

    statusStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        stats,
        recentApplications
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;