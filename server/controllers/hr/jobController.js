const Job = require('../../models/Job');
const User = require('../../models/User');
const Application = require('../../models/Application');
const mongoose = require('mongoose');
const { createAndEmit } = require('../../services/notificationService');

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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.id;
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
        const applicationsCount = await Application.countDocuments({ job: job._id });
        const recentApplications = await Application.countDocuments({
          job: job._id,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Check if this job was created by the current user
        const createdByMe = job.postedBy._id.toString() === userId.toString();

        // Format salary range if exists
        let salaryDisplay = 'Not specified';
        if (job.salaryRange && (job.salaryRange.min || job.salaryRange.max)) {
          const currency = job.salaryRange.currency || 'INR';
          const period = job.salaryRange.period || 'year';
          const format = job.salaryRange.format || 'absolute';
          
          // Always present salary in LPA on HR Jobs page.
          // Handles both storage formats:
          // 1) format === 'absolute'  -> values are in absolute INR (e.g., 500000), convert to LPA (5.0)
          // 2) format === 'lpa'       -> values are in LPA (e.g., 5). However, some legacy records saved
          //    converted absolute values (e.g., 500000) but kept format as 'lpa'. Detect and fix by magnitude.
          const formatSalaryValue = (value) => {
            if (!value && value !== 0) return null;
            const numValue = parseFloat(value);
            if (Number.isNaN(numValue)) return null;

            // If explicitly LPA but magnitude looks like absolute INR, normalize
            if (format === 'lpa') {
              // Heuristic: any value >= 1000 is very likely an absolute INR amount saved mistakenly
              if (numValue >= 1000) {
                const lakhs = numValue / 100000; // convert absolute to LPA
                // For large ranges like 5-50 LPA prefer one decimal up to <10
                const display = lakhs >= 10 ? lakhs.toFixed(0) : lakhs.toFixed(1);
                return `${display} LPA`;
              }
              // Proper LPA input
              return `${numValue} LPA`;
            }

            // Absolute format path
            if (currency === 'INR') {
              const lakhs = numValue / 100000;
              const display = lakhs >= 10 ? lakhs.toFixed(0) : lakhs.toFixed(1);
              return `${display} LPA`;
            }

            // Non-INR currencies: retain original currency formatting
            return `${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency}${numValue.toLocaleString()}`;
          };

          const minFormatted = formatSalaryValue(job.salaryRange.min);
          const maxFormatted = formatSalaryValue(job.salaryRange.max);
          
          if (minFormatted && maxFormatted) {
            salaryDisplay = `${minFormatted} - ${maxFormatted} per ${period}`;
          } else if (minFormatted) {
            salaryDisplay = `${minFormatted}+ per ${period}`;
          } else if (maxFormatted) {
            salaryDisplay = `Up to ${maxFormatted} per ${period}`;
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
    const totalClosed = await Job.countDocuments({ company: companyId, status: 'closed' });
    const totalInactive = await Job.countDocuments({ company: companyId, status: 'inactive' });
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
        totalClosed,
        totalInactive,
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get company ID from user data (already populated by auth middleware)
    const userId = req.user.id;
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

    // Send notification to Admin about new job posting
    try {
      const hrUser = await User.findById(userId).select('firstName lastName');
      
      if (hrUser) {
        await createAndEmit({
          toCompanyId: companyId,
          toRole: 'admin',
          type: 'job_created',
          title: 'New Job Posted',
          message: `${hrUser.firstName} ${hrUser.lastName} posted a new job: ${req.body.title}`,
          actionUrl: `/admin/jobs/${job._id}`,
          entity: { kind: 'Job', id: job._id },
          priority: 'low',
          metadata: {
            hrName: `${hrUser.firstName} ${hrUser.lastName}`,
            jobTitle: req.body.title,
            department: req.body.department
          },
          createdBy: userId
        });
      }
    } catch (notifError) {
      console.error('Failed to send job creation notification:', notifError);
      // Don't fail the job creation if notification fails
    }

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
    const applicationsCount = await Application.countDocuments({ job: job._id });
    const recentApplications = await Application.countDocuments({
      job: job._id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const jobWithStats = {
      ...job,
      id: job._id, // Transform _id to id for frontend compatibility
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

    // Transform _id to id for frontend compatibility
    const jobWithId = {
      ...job,
      id: job._id
    };

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: jobWithId
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

    // First find the job to check if it exists and belongs to the company
    const job = await Job.findOne({ 
      _id: req.params.id,
      company: companyId 
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

    // Now delete the job
    await Job.findByIdAndDelete(req.params.id);

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