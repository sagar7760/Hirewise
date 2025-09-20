const Job = require('../../models/Job');
const User = require('../../models/User');
const Application = require('../../models/Application');
const mongoose = require('mongoose');

// @desc    Get all jobs posted by HR with pagination, filtering, and search
// @route   GET /api/hr/jobs
// @access  Private (HR, Admin)
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      department = '',
      jobType = '',
      filter = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user._id;
    const companyId = req.user.company?._id || req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Build base query for company
    let query = { company: companyId };

    // Apply "My Jobs" filter
    if (filter === 'my-jobs') {
      query.postedBy = userId;
    }

    // Apply status filter
    if (status) {
      query.status = status.toLowerCase();
    }

    // Apply department filter
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    // Apply job type filter
    if (jobType) {
      query.jobType = jobType;
    }

    // Apply search functionality (title and department)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName')
      .populate('company', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(query);

    // Get application counts for each job and enhance data
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const applicationsCount = await Application.countDocuments({ jobId: job._id });
        const recentApplications = await Application.countDocuments({
          jobId: job._id,
          appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Check if this job was created by the current user
        const createdByMe = job.postedBy._id.toString() === userId.toString();

        // Format salary range if exists
        let salaryDisplay = 'Not specified';
        if (job.salaryRange && (job.salaryRange.min || job.salaryRange.max)) {
          const currency = job.salaryRange.currency || 'USD';
          const period = job.salaryRange.period || 'year';
          if (job.salaryRange.min && job.salaryRange.max) {
            salaryDisplay = `${currency} ${job.salaryRange.min} - ${job.salaryRange.max} per ${period}`;
          } else if (job.salaryRange.min) {
            salaryDisplay = `${currency} ${job.salaryRange.min}+ per ${period}`;
          } else if (job.salaryRange.max) {
            salaryDisplay = `Up to ${currency} ${job.salaryRange.max} per ${period}`;
          }
        }

        return {
          id: job._id,
          title: job.title,
          description: job.description,
          department: job.department,
          jobType: job.jobType,
          location: job.location,
          locationType: job.locationType,
          status: job.status.charAt(0).toUpperCase() + job.status.slice(1), // Capitalize first letter
          applicants: applicationsCount,
          recentApplications,
          postedDate: job.createdAt,
          deadline: job.applicationDeadline,
          createdBy: createdByMe ? 'me' : 'other',
          postedByName: `${job.postedBy.firstName} ${job.postedBy.lastName}`,
          salary: salaryDisplay,
          requirements: [
            ...(job.requiredSkills || []),
            job.qualification,
            job.experienceLevel
          ].filter(Boolean),
          companyName: job.company?.name || 'Unknown Company',
          views: job.views || 0,
          // Additional fields for frontend compatibility
          salaryRange: job.salaryRange,
          requiredSkills: job.requiredSkills || [],
          preferredSkills: job.preferredSkills || [],
          qualification: job.qualification,
          experienceLevel: job.experienceLevel,
          maxApplicants: job.maxApplicants,
          resumeRequired: job.resumeRequired,
          allowMultipleApplications: job.allowMultipleApplications
        };
      })
    );

    // Summary statistics
    const totalActive = await Job.countDocuments({ company: companyId, status: 'active' });
    const totalDraft = await Job.countDocuments({ company: companyId, status: 'draft' });
    const totalArchived = await Job.countDocuments({ company: companyId, status: 'archived' });
    const myJobs = await Job.countDocuments({ company: companyId, postedBy: userId });

    // Set headers to prevent caching and 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: jobsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJobs / limitNum),
        totalJobs,
        hasNextPage: skip + limitNum < totalJobs,
        hasPrevPage: page > 1,
        limit: limitNum
      },
      summary: {
        totalJobs,
        totalActive,
        totalDraft,
        totalArchived,
        myJobs,
        totalApplicants: jobsWithStats.reduce((sum, job) => sum + job.applicants, 0)
      },
      filters: {
        applied: {
          search,
          status,
          department,
          jobType,
          filter
        }
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching jobs'
    });
  }
};

// @desc    Create a new job posting
// @route   POST /api/hr/jobs
// @access  Private (HR, Admin)
const createJob = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get company ID from user data (already populated by auth middleware)
    const userId = req.user._id;
    const companyId = req.user.company?._id || req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company to create jobs'
      });
    }

    const jobData = {
      ...req.body,
      company: companyId,
      postedBy: userId,
      status: req.body.status || 'draft'
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('postedBy', 'firstName lastName')
      .populate('company', 'name')
      .lean();

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
      message: 'Server error occurred while creating job'
    });
  }
};

// @desc    Get a specific job by ID
// @route   GET /api/hr/jobs/:id
// @access  Private (HR, Admin)
const getJobById = async (req, res) => {
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

    const job = await Job.findOne({ 
      _id: req.params.id,
      company: companyId 
    })
      .populate('postedBy', 'firstName lastName')
      .populate('company', 'name')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get application statistics
    const applicationsCount = await Application.countDocuments({ jobId: job._id });
    const recentApplications = await Application.countDocuments({
      jobId: job._id,
      appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const jobWithStats = {
      ...job,
      applicants: applicationsCount,
      recentApplications
    };

    res.json({
      success: true,
      data: jobWithStats
    });

  } catch (error) {
    console.error('Get job by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching job'
    });
  }
};

// @desc    Update a job posting
// @route   PUT /api/hr/jobs/:id
// @access  Private (HR, Admin)
const updateJob = async (req, res) => {
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

    const job = await Job.findOneAndUpdate(
      { 
        _id: req.params.id,
        company: companyId 
      },
      { ...req.body },
      { 
        new: true, 
        runValidators: true 
      }
    )
      .populate('postedBy', 'firstName lastName')
      .populate('company', 'name')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
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

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating job'
    });
  }
};

// @desc    Delete a job posting
// @route   DELETE /api/hr/jobs/:id
// @access  Private (HR, Admin)
const deleteJob = async (req, res) => {
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

    const job = await Job.findOneAndDelete({ 
      _id: req.params.id,
      company: companyId 
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting job'
    });
  }
};

module.exports = {
  getJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob
};