const express = require('express');
const { query, validationResult } = require('express-validator');
const { auth, authorize, requireCompany } = require('../../middleware/auth');
const dashboardController = require('../../controllers/hr/dashboardController');

const router = express.Router();

console.log('HR Dashboard routes module loaded');

// @route   GET /api/hr/dashboard/stats
// @desc    Get HR dashboard statistics
// @access  Private (HR, Admin)
router.get('/stats', auth, authorize('hr', 'admin'), requireCompany, dashboardController.getStats);

// @route   GET /api/hr/dashboard/recent-activities
// @desc    Get recent activities for dashboard
// @access  Private (HR, Admin)
router.get('/recent-activities', auth, authorize('hr', 'admin'), requireCompany, dashboardController.getRecentActivities);

// @route   GET /api/hr/dashboard/trends
// @desc    Get application trends data
// @access  Private (HR, Admin)
router.get('/trends', 
  auth, 
  authorize('hr', 'admin'), 
  requireCompany,
  [
    query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  },
  dashboardController.getApplicationTrends
);

// @route   GET /api/hr/dashboard/top-jobs
// @desc    Get top performing jobs
// @access  Private (HR, Admin)
router.get('/top-jobs', auth, authorize('hr', 'admin'), requireCompany, dashboardController.getTopJobs);

module.exports = router;