const express = require('express');
const { query, body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/hr/dashboard/stats
// @desc    Get HR dashboard statistics
// @access  Private (HR, Admin)
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get total jobs posted by HR
    const totalJobs = await Job.countDocuments({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() // Mock for now
    });

    // Get total applications across all HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const totalApplicants = await Application.countDocuments({
      job: { $in: hrJobIds }
    });

    const candidatesShortlisted = await Application.countDocuments({
      job: { $in: hrJobIds },
      status: 'shortlisted'
    });

    const interviewsScheduled = await Interview.countDocuments({
      application: { 
        $in: await Application.find({ job: { $in: hrJobIds } }).distinct('_id')
      },
      status: 'scheduled'
    });

    // Application status breakdown
    const applicationsByStatus = await Application.aggregate([
      { $match: { job: { $in: hrJobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Jobs by status
    const jobsByStatus = await Job.aggregate([
      { $match: { postedBy: req.user?.id || new mongoose.Types.ObjectId() } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplications = await Application.countDocuments({
      job: { $in: hrJobIds },
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalJobs,
        totalApplicants,
        candidatesShortlisted,
        interviewsScheduled,
        applicationsByStatus,
        jobsByStatus,
        recentApplications,
        period: 'last_30_days'
      }
    });

  } catch (error) {
    console.error('Get HR dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/dashboard/recent-jobs
// @desc    Get recent jobs posted by HR
// @access  Private (HR, Admin)
router.get('/dashboard/recent-jobs', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
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

    const limit = parseInt(req.query.limit) || 5;

    const recentJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('postedBy', 'firstName lastName')
    .lean();

    // Add applicant count for each job
    const jobsWithStats = await Promise.all(recentJobs.map(async (job) => {
      const applicantCount = await Application.countDocuments({ job: job._id });
      return {
        ...job,
        applicants: applicantCount
      };
    }));

    res.json({
      success: true,
      data: jobsWithStats
    });

  } catch (error) {
    console.error('Get recent jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/dashboard/upcoming-interviews
// @desc    Get upcoming interviews for HR's jobs
// @access  Private (HR, Admin)
router.get('/dashboard/upcoming-interviews', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
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

    const limit = parseInt(req.query.limit) || 10;

    // Get HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    // Get applications for HR's jobs
    const applications = await Application.find({
      job: { $in: hrJobIds }
    }).select('_id');
    const applicationIds = applications.map(app => app._id);

    // Get upcoming interviews
    const upcomingInterviews = await Interview.find({
      application: { $in: applicationIds },
      scheduledDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .limit(limit)
    .populate({
      path: 'application',
      populate: [
        { path: 'applicant', select: 'firstName lastName email' },
        { path: 'job', select: 'title department' }
      ]
    })
    .populate('interviewer', 'firstName lastName')
    .lean();

    res.json({
      success: true,
      data: upcomingInterviews
    });

  } catch (error) {
    console.error('Get upcoming interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/dashboard/recent-applications
// @desc    Get recent applications for HR's jobs
// @access  Private (HR, Admin)
router.get('/dashboard/recent-applications', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
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

    const limit = parseInt(req.query.limit) || 10;

    // Get HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const recentApplications = await Application.find({
      job: { $in: hrJobIds }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title department')
    .lean();

    res.json({
      success: true,
      data: recentApplications
    });

  } catch (error) {
    console.error('Get recent applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/analytics/job-performance
// @desc    Get job performance analytics
// @access  Private (HR, Admin)
router.get('/analytics/job-performance', [
  query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid time range'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID')
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

    const { timeRange = '30d', jobId } = req.query;

    // Calculate date range
    const now = new Date();
    const dateRanges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };
    const startDate = dateRanges[timeRange];

    // Build job filter
    let jobFilter = { 
      postedBy: req.user?.id || new mongoose.Types.ObjectId(),
      createdAt: { $gte: startDate }
    };
    
    if (jobId) {
      jobFilter._id = jobId;
    }

    // Get jobs in date range
    const jobs = await Job.find(jobFilter).select('_id title');
    const jobIds = jobs.map(job => job._id);

    // Get application metrics
    const applicationMetrics = await Application.aggregate([
      { $match: { job: { $in: jobIds }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$job',
          totalApplications: { $sum: 1 },
          averageScore: { $avg: '$aiAnalysis.overallScore' },
          statusBreakdown: {
            $push: '$status'
          }
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'jobDetails'
        }
      }
    ]);

    // Calculate conversion rates
    const conversionData = await Application.aggregate([
      { $match: { job: { $in: jobIds }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$job',
          applied: { $sum: 1 },
          reviewed: { $sum: { $cond: [{ $ne: ['$status', 'submitted'] }, 1, 0] } },
          shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
          interviewed: { $sum: { $cond: [{ $eq: ['$status', 'interviewed'] }, 1, 0] } },
          hired: { $sum: { $cond: [{ $eq: ['$status', 'offer_accepted'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        timeRange,
        jobPerformance: applicationMetrics,
        conversionRates: conversionData,
        summary: {
          totalJobs: jobs.length,
          totalApplications: await Application.countDocuments({
            job: { $in: jobIds },
            createdAt: { $gte: startDate }
          })
        }
      }
    });

  } catch (error) {
    console.error('Get job performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;