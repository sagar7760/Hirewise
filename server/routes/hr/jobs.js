const express = require('express');
const mongoose = require('mongoose');
const { query, body, param, validationResult } = require('express-validator');
const { auth, authorize, requireCompany } = require('../../middleware/auth');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const {
  getJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob
} = require('../../controllers/hr/jobController');

const router = express.Router();

// @route   GET /api/hr/jobs
// @desc    Get all jobs posted by HR with pagination, filtering, and search
// @access  Private (HR, Admin)
router.get('/', auth, authorize('hr', 'admin'), requireCompany, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().isLength({ min: 1, max: 200 }).withMessage('Search term must be between 1 and 200 characters'),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'closed']).withMessage('Invalid status'),
  query('department').optional().isLength({ min: 1, max: 100 }).withMessage('Department must be between 1 and 100 characters'),
  query('employmentType').optional().isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship']).withMessage('Invalid employment type'),
  query('sortBy').optional().isIn(['createdAt', 'title', 'department', 'applicants']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], getJobs);

// @route   POST /api/hr/jobs
// @desc    Create a new job posting
// @access  Private (HR, Admin)
router.post('/', auth, authorize('hr', 'admin'), requireCompany, [
  body('title')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Job title must be between 3 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Job description must be between 10 and 5000 characters'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('jobType')
    .isIn(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'])
    .withMessage('Invalid job type'),
  body('locationType')
    .optional()
    .isIn(['onsite', 'remote', 'hybrid'])
    .withMessage('Invalid location type'),
  body('qualification')
    .notEmpty()
    .withMessage('Required qualification is required'),
  body('experienceLevel')
    .notEmpty()
    .withMessage('Experience level is required'),
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  body('maxApplicants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max applicants must be a positive integer'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('preferredSkills')
    .optional()
    .isArray()
    .withMessage('Preferred skills must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'active'])
    .withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  createJob(req, res);
});

// @route   GET /api/hr/jobs/:id
// @desc    Get a specific job by ID
// @access  Private (HR, Admin)
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid job ID')
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

    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user?.id || new mongoose.Types.ObjectId() // Ensure HR can only access their jobs
    }).populate('postedBy', 'firstName lastName').lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Add statistics
    const applicantCount = await Application.countDocuments({ job: job._id });
    const applicationsByStatus = await Application.aggregate([
      { $match: { job: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const recentApplications = await Application.countDocuments({ 
      job: job._id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        ...job,
        applicants: applicantCount,
        applicationsByStatus,
        recentApplications
      }
    });

  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/hr/jobs/:id
// @desc    Update a job posting
// @access  Private (HR, Admin)
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Job title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  body('department')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('location')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  body('employmentType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship'])
    .withMessage('Invalid employment type'),
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage('Invalid experience level'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft', 'closed'])
    .withMessage('Invalid status'),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
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

    // Check if job exists and belongs to HR
    const existingJob = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user?.id || new mongoose.Types.ObjectId()
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Validate salary range if provided
    if (req.body.salaryRange && req.body.salaryRange.min && req.body.salaryRange.max) {
      if (req.body.salaryRange.min >= req.body.salaryRange.max) {
        return res.status(400).json({
          success: false,
          message: 'Minimum salary must be less than maximum salary'
        });
      }
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('postedBy', 'firstName lastName').lean();

    // Add statistics
    const applicantCount = await Application.countDocuments({ job: updatedJob._id });
    updatedJob.applicants = applicantCount;

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });

  } catch (error) {
    console.error('Update job error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/hr/jobs/:id
// @desc    Delete a job posting
// @access  Private (HR, Admin)
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid job ID')
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

    // Check if job exists and belongs to HR
    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user?.id || new mongoose.Types.ObjectId()
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if there are any applications
    const applicationCount = await Application.countDocuments({ job: req.params.id });
    
    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job with existing applications. Consider closing it instead.'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/hr/jobs/:id/status
// @desc    Update job status (activate, deactivate, close)
// @access  Private (HR, Admin)
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('status')
    .isIn(['active', 'inactive', 'closed'])
    .withMessage('Status must be active, inactive, or closed')
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

    const { status } = req.body;

    // Check if job exists and belongs to HR
    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user?.id || new mongoose.Types.ObjectId()
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update status
    job.status = status;
    job.updatedAt = new Date();

    if (status === 'closed') {
      job.closedAt = new Date();
    }

    await job.save();

    res.json({
      success: true,
      message: `Job ${status} successfully`,
      data: { id: job._id, status: job.status }
    });

  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/jobs/:id/applications
// @desc    Get all applications for a specific job
// @access  Private (HR, Admin)
router.get('/:id/applications', [
  param('id').isMongoId().withMessage('Invalid job ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'interviewed', 'offer_extended', 'offer_accepted', 'offer_declined']).withMessage('Invalid status')
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

    const { page = 1, limit = 20, status } = req.query;

    // Check if job exists and belongs to HR
    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user?.id || new mongoose.Types.ObjectId()
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Build filter
    let filter = { job: req.params.id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    // Get applications
    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('applicant', 'firstName lastName email profilePicture')
      .populate('job', 'title department')
      .lean();

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
        }
      }
    });

  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;