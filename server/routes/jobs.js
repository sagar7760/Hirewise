const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all published jobs with filters and search
// @access  Public
router.get('/', [
  query('search').optional().trim(),
  query('workType').optional().isIn(['remote', 'hybrid', 'on-site']),
  query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship']),
  query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead']),
  query('location').optional().trim(),
  query('country').optional().trim(),
  query('company').optional().trim(),
  query('minSalary').optional().isNumeric(),
  query('maxSalary').optional().isNumeric(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['createdAt', 'salary.min', 'salary.max', 'title', 'company']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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
      search,
      workType,
      jobType,
      experienceLevel,
      location,
      country,
      company,
      minSalary,
      maxSalary,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { status: 'published' };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (workType) query.workType = workType;
    if (jobType) query.jobType = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (location) query.location = new RegExp(location, 'i');
    if (country) query.country = new RegExp(country, 'i');
    if (company) query.company = new RegExp(company, 'i');

    // Salary range filter
    if (minSalary || maxSalary) {
      query.$and = [];
      if (minSalary) {
        query.$and.push({ 'salary.max': { $gte: parseInt(minSalary) } });
      }
      if (maxSalary) {
        query.$and.push({ 'salary.min': { $lte: parseInt(maxSalary) } });
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    let sortOptions = {};
    if (sortBy === 'createdAt') {
      sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy.includes('salary')) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query
    const jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName email')
      .populate('company', 'name logo website')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(query);
    const totalPages = Math.ceil(totalJobs / parseInt(limit));

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName email company')
      .populate('company', 'name logo website')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Only show published jobs to public
    if (job.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // If user is authenticated, check if they have applied
    let hasApplied = false;
    if (req.headers.authorization) {
      try {
        // Try to authenticate user but don't fail if token is invalid
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const application = await Application.findOne({
          job: req.params.id,
          applicant: decoded.id
        });
        hasApplied = !!application;
      } catch (error) {
        // Ignore authentication errors for public endpoint
      }
    }

    res.json({
      success: true,
      data: {
        job: {
          ...job,
          hasApplied
        }
      }
    });

  } catch (error) {
    console.error('Get job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job (HR/Admin only)
// @access  Private (HR, Admin)
router.post('/', auth, authorize('hr', 'admin'), [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('workType').isIn(['remote', 'hybrid', 'on-site']).withMessage('Invalid work type'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship']).withMessage('Invalid job type'),
  body('experienceLevel').isIn(['entry', 'mid', 'senior', 'lead']).withMessage('Invalid experience level'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number'),
  body('requirements').isArray().withMessage('Requirements must be an array'),
  body('skills').isArray().withMessage('Skills must be an array')
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

    const jobData = {
      ...req.body,
      postedBy: req.user.id
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/jobs/stats/overview
// @desc    Get job statistics (for dashboard)
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ status: 'published' });
    const jobsByType = await Job.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } }
    ]);
    const jobsByWorkType = await Job.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$workType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        jobsByType,
        jobsByWorkType
      }
    });

  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;