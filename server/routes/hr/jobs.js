const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/hr/jobs
// @desc    Get all jobs posted by HR with pagination, filtering, and search
// @access  Private (HR, Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().isLength({ min: 1, max: 200 }).withMessage('Search term must be between 1 and 200 characters'),
  query('status').optional().isIn(['active', 'inactive', 'draft', 'closed']).withMessage('Invalid status'),
  query('department').optional().isLength({ min: 1, max: 100 }).withMessage('Department must be between 1 and 100 characters'),
  query('employmentType').optional().isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship']).withMessage('Invalid employment type'),
  query('sortBy').optional().isIn(['createdAt', 'title', 'department', 'applicants']).withMessage('Invalid sort field'),
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
      limit = 10,
      search,
      status,
      department,
      employmentType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    let filter = { 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() // Mock for now
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;
    if (department) filter.department = new RegExp(department, 'i');
    if (employmentType) filter.employmentType = employmentType;

    // Build sort query
    let sort = {};
    if (sortBy === 'applicants') {
      // Special handling for applicants count - will be added after aggregation
      sort = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    // Get jobs with pagination
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('postedBy', 'firstName lastName')
      .lean();

    // Add applicant count for each job
    const jobsWithStats = await Promise.all(jobs.map(async (job) => {
      const applicantCount = await Application.countDocuments({ job: job._id });
      const recentApplications = await Application.countDocuments({ 
        job: job._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });
      
      return {
        ...job,
        applicants: applicantCount,
        recentApplications
      };
    }));

    // Sort by applicants if requested
    if (sortBy === 'applicants') {
      jobsWithStats.sort((a, b) => {
        return sortOrder === 'asc' ? 
          a.applicants - b.applicants : 
          b.applicants - a.applicants;
      });
    }

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limit);

    res.json({
      success: true,
      data: {
        jobs: jobsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get HR jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/hr/jobs
// @desc    Create a new job posting
// @access  Private (HR, Admin)
router.post('/', [
  body('title')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Job title must be between 3 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  body('employmentType')
    .isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship'])
    .withMessage('Invalid employment type'),
  body('experienceLevel')
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage('Invalid experience level'),
  body('salaryRange.min')
    .optional()
    .isNumeric()
    .withMessage('Minimum salary must be a number'),
  body('salaryRange.max')
    .optional()
    .isNumeric()
    .withMessage('Maximum salary must be a number'),
  body('requirements')
    .isArray({ min: 1 })
    .withMessage('Requirements must be a non-empty array'),
  body('requirements.*')
    .isLength({ min: 5, max: 500 })
    .withMessage('Each requirement must be between 5 and 500 characters'),
  body('responsibilities')
    .isArray({ min: 1 })
    .withMessage('Responsibilities must be a non-empty array'),
  body('responsibilities.*')
    .isLength({ min: 5, max: 500 })
    .withMessage('Each responsibility must be between 5 and 500 characters'),
  body('skills')
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Invalid status')
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

    // Validate salary range
    if (req.body.salaryRange && req.body.salaryRange.min && req.body.salaryRange.max) {
      if (req.body.salaryRange.min >= req.body.salaryRange.max) {
        return res.status(400).json({
          success: false,
          message: 'Minimum salary must be less than maximum salary'
        });
      }
    }

    const jobData = {
      ...req.body,
      postedBy: req.user?.id || new mongoose.Types.ObjectId(), // Mock for now
      status: req.body.status || 'active'
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('postedBy', 'firstName lastName')
      .lean();

    // Add initial stats
    populatedJob.applicants = 0;
    populatedJob.recentApplications = 0;

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: populatedJob
    });

  } catch (error) {
    console.error('Create job error:', error);
    
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