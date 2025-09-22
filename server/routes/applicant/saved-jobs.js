const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const Job = require('../../models/Job');
const User = require('../../models/User');

// All routes require authentication and applicant role
router.use(auth);

// @route   GET /api/applicant/saved-jobs
// @desc    Get all saved jobs for the authenticated user
// @access  Private (Applicant only)
router.get('/', async (req, res) => {
  try {
    // Verify user is applicant
    if (req.user.role !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Applicant role required.'
      });
    }

    // Get user with populated saved jobs
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedJobs',
        populate: [
          {
            path: 'company',
            select: 'name logo'
          }
        ]
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format the saved jobs data
    const savedJobsData = user.savedJobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company?.name || 'Company Name',
      location: job.location,
      workType: job.workType,
      jobType: job.jobType,
      experience: job.experience,
      salary: job.salary,
      postedDate: job.createdAt,
      savedAt: user.savedJobsMetadata?.find(meta => 
        meta.jobId?.toString() === job._id.toString()
      )?.savedAt || job.createdAt,
      status: job.status,
      applicationDeadline: job.applicationDeadline
    }));

    // Sort by savedAt date (most recent first)
    savedJobsData.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.json({
      success: true,
      message: 'Saved jobs retrieved successfully',
      data: savedJobsData
    });

  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/applicant/saved-jobs/:jobId
// @desc    Save a job for later
// @access  Private (Applicant only)
router.post('/:jobId', async (req, res) => {
  try {
    // Verify user is applicant
    if (req.user.role !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Applicant role required.'
      });
    }

    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is active
    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save inactive job'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if job is already saved
    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job is already saved'
      });
    }

    // Add job to saved jobs
    user.savedJobs.push(jobId);

    // Initialize savedJobsMetadata if it doesn't exist
    if (!user.savedJobsMetadata) {
      user.savedJobsMetadata = [];
    }

    // Add metadata for when the job was saved
    user.savedJobsMetadata.push({
      jobId: jobId,
      savedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Job saved successfully'
    });

  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/applicant/saved-jobs/:jobId
// @desc    Remove a job from saved jobs
// @access  Private (Applicant only)
router.delete('/:jobId', async (req, res) => {
  try {
    // Verify user is applicant
    if (req.user.role !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Applicant role required.'
      });
    }

    const { jobId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if job is in saved jobs
    if (!user.savedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job is not in saved jobs'
      });
    }

    // Remove job from saved jobs
    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);

    // Remove metadata as well
    if (user.savedJobsMetadata) {
      user.savedJobsMetadata = user.savedJobsMetadata.filter(
        meta => meta.jobId?.toString() !== jobId
      );
    }

    await user.save();

    res.json({
      success: true,
      message: 'Job removed from saved jobs successfully'
    });

  } catch (error) {
    console.error('Error removing saved job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;