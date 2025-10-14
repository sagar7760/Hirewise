const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const Interview = require('../../models/Interview');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');
const { auth, authorize } = require('../../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();
const { createAndEmit } = require('../../services/notificationService');

// All HR interview routes require authentication & HR/Admin role
router.use(auth, authorize('hr','admin'));

// @route   GET /api/hr/interviews
// @desc    Get all interviews for HR's jobs with filtering and pagination
// @access  Private (HR, Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
  query('type').optional().isIn(['phone', 'video', 'in-person', 'panel']).withMessage('Invalid interview type'),
  query('interviewerId').optional().isMongoId().withMessage('Invalid interviewer ID'),
  query('jobId').optional().isMongoId().withMessage('Invalid job ID'),
  query('dateRange').optional().isIn(['today', 'tomorrow', 'this_week', 'next_week', 'this_month', 'custom']).withMessage('Invalid date range'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('sortBy').optional().isIn(['scheduledDate', 'createdAt', 'status', 'type']).withMessage('Invalid sort field'),
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
      limit = 20,
      status,
      type,
      interviewerId,
      jobId,
      dateRange,
      startDate,
      endDate,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    // Get HR's jobs (must be authenticated due to router.use)
    const hrJobs = await Job.find({ postedBy: req.user.id }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    // Get applications for HR's jobs
    const applications = await Application.find({
      job: { $in: hrJobIds }
    }).select('_id');
    const applicationIds = applications.map(app => app._id);

    // Build filter query
    let filter = { application: { $in: applicationIds } };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (interviewerId) filter.interviewer = interviewerId;
    if (jobId) {
      const jobApplications = await Application.find({ job: jobId }).select('_id');
      const jobApplicationIds = jobApplications.map(app => app._id);
      filter.application = { $in: jobApplicationIds };
    }

    // Date filtering
    const now = new Date();
    let dateFilter = {};

    switch (dateRange) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        dateFilter = { $gte: todayStart, $lt: todayEnd };
        break;
      case 'tomorrow':
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);
        dateFilter = { $gte: tomorrowStart, $lt: tomorrowEnd };
        break;
      case 'this_week':
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: weekStart, $lt: weekEnd };
        break;
      case 'next_week':
        const nextWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7);
        const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: nextWeekStart, $lt: nextWeekEnd };
        break;
      case 'this_month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        dateFilter = { $gte: monthStart, $lt: monthEnd };
        break;
      case 'custom':
        if (startDate || endDate) {
          if (startDate) dateFilter.$gte = new Date(startDate);
          if (endDate) dateFilter.$lte = new Date(endDate);
        }
        break;
    }

    if (Object.keys(dateFilter).length > 0) {
      filter.scheduledDate = dateFilter;
    }

    const skip = (page - 1) * limit;

    // Build sort query
    let sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get interviews with population
    const interviews = await Interview.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'application',
        populate: [
          { 
            path: 'applicant', 
            select: 'firstName lastName email phone profilePicture' 
          },
          { 
            path: 'job', 
            select: 'title department employmentType' 
          }
        ]
      })
      .populate('interviewer', 'firstName lastName email')
      .lean();

    // Get total count for pagination
    const totalInterviews = await Interview.countDocuments(filter);
    const totalPages = Math.ceil(totalInterviews / limit);

    // Get summary statistics
    const todayInterviews = await Interview.countDocuments({
      ...filter,
      scheduledDate: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });

    const upcomingInterviews = await Interview.countDocuments({
      ...filter,
      scheduledDate: { $gte: now },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalInterviews,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        summary: {
          todayInterviews,
          upcomingInterviews
        },
        filters: {
          status,
          type,
          interviewerId,
          jobId,
          dateRange
        }
      }
    });

  } catch (error) {
    console.error('Get HR interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/hr/interviews
// @desc    Schedule a new interview
// @access  Private (HR, Admin)
router.post('/', [
  body('applicationId')
    .isMongoId()
    .withMessage('Valid application ID is required'),
  body('interviewerId')
    .isMongoId()
    .withMessage('Valid interviewer ID is required'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  body('scheduledTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Scheduled time must be in HH:mm format'),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('type')
    .isIn(['phone', 'video', 'in-person', 'panel'])
    .withMessage('Invalid interview type'),
  body('location')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Location must be between 1 and 500 characters'),
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('interviewQuestions')
    .optional()
    .isArray()
    .withMessage('Interview questions must be an array')
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
      applicationId,
      interviewerId,
      scheduledDate,
      scheduledTime,
      duration,
      type,
      location,
      meetingLink,
      notes,
      interviewQuestions
    } = req.body;

    // Verify application exists and belongs to HR's job
    const hrJobs = await Job.find({ postedBy: req.user.id }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const application = await Application.findOne({
      _id: applicationId,
      job: { $in: hrJobIds }
    }).populate('job', 'title').populate('applicant', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or does not belong to your jobs'
      });
    }

    // Verify interviewer exists
    const interviewer = await User.findOne({
      _id: interviewerId,
      role: 'interviewer'
    });

    if (!interviewer) {
      return res.status(404).json({
        success: false,
        message: 'Interviewer not found'
      });
    }

    // Check for interviewer availability (simple overlap detection)
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const endDateTime = new Date(scheduledDateTime.getTime() + duration * 60000);

    // Fetch same-day interviews for that interviewer to test overlap in JS (simpler & avoids $concat on date)
    const sameDayInterviews = await Interview.find({
      interviewer: interviewerId,
      status: { $in: ['scheduled', 'confirmed'] },
      scheduledDate
    }).lean();

    const conflictingInterview = sameDayInterviews.find(iv => {
      if (!iv.scheduledTime) return false;
      const ivStart = new Date(`${iv.scheduledDate}T${iv.scheduledTime}`);
      const ivEnd = new Date(ivStart.getTime() + (iv.duration || 60) * 60000);
      return (scheduledDateTime < ivEnd) && (endDateTime > ivStart); // overlap condition
    });

    if (conflictingInterview) {
      return res.status(400).json({
        success: false,
        message: 'Interviewer is not available at the scheduled time'
      });
    }

    // Create interview
    const interview = new Interview({
      application: applicationId,
      interviewer: interviewerId,
      scheduledDate,
      scheduledTime,
      duration,
      type,
      location,
      meetingLink,
      notes,
      interviewQuestions,
      status: 'scheduled',
      scheduledBy: req.user?.id || new mongoose.Types.ObjectId()
    });

    await interview.save();

    // Update application status if needed
    if (application.status === 'submitted' || application.status === 'under_review') {
      application.status = 'shortlisted';
      application.timeline.push({
        status: 'shortlisted',
        date: new Date(),
        notes: 'Interview scheduled',
        updatedBy: req.user?.id || new mongoose.Types.ObjectId()
      });
      await application.save();
    }

    // Populate interview for response
    const populatedInterview = await Interview.findById(interview._id)
      .populate({
        path: 'application',
        populate: [
          { path: 'applicant', select: 'firstName lastName email' },
          { path: 'job', select: 'title department' }
        ]
      })
      .populate('interviewer', 'firstName lastName email')
      .lean();

    // Create notifications
    try {
      // To interviewer
      await createAndEmit({
        toUserId: interviewerId,
        toCompanyId: req.user.company?._id || req.user.companyId,
        toRole: 'interviewer',
        type: 'interview',
        title: 'Interview Scheduled',
        message: `Interview scheduled on ${scheduledDate} at ${scheduledTime} for ${populatedInterview?.application?.job?.title || 'a job'}`,
        actionUrl: `/interviewer/interviews`,
        entity: { kind: 'interview', id: interview._id },
        priority: 'medium',
        metadata: {
          scheduledDate,
          scheduledTime,
          duration,
          candidate: populatedInterview?.application?.applicant,
          job: populatedInterview?.application?.job
        },
        createdBy: req.user?.id
      });
      // To applicant
      const applicantId = application.applicant?._id || application.applicant;
      if (applicantId) {
        await createAndEmit({
          toUserId: applicantId,
          toCompanyId: req.user.company?._id || req.user.companyId,
          toRole: 'applicant',
          type: 'interview',
          title: 'Interview Scheduled',
          message: `Your interview for ${application?.job?.title || 'a job'} is scheduled on ${scheduledDate} at ${scheduledTime}`,
          actionUrl: `/applicant/applications`,
          entity: { kind: 'interview', id: interview._id },
          priority: 'medium',
          metadata: { scheduledDate, scheduledTime, duration },
          createdBy: req.user?.id
        });
      }
    } catch (e) {
      console.warn('Failed creating notifications (schedule):', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: populatedInterview
    });

  } catch (error) {
    console.error('Schedule interview error:', error);
    
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

// @route   GET /api/hr/interviews/:id
// @desc    Get a specific interview with full details
// @access  Private (HR, Admin)
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid interview ID')
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

    // Get HR's jobs to verify access
    const hrJobs = await Job.find({ postedBy: req.user.id }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const applications = await Application.find({
      job: { $in: hrJobIds }
    }).select('_id');
    const applicationIds = applications.map(app => app._id);

    const interview = await Interview.findOne({
      _id: req.params.id,
      application: { $in: applicationIds }
    })
    .populate({
      path: 'application',
      populate: [
        { 
          path: 'applicant', 
          select: 'firstName lastName email phone profilePicture profile' 
        },
        { 
          path: 'job', 
          select: 'title department location employmentType requirements skills' 
        }
      ]
    })
    .populate('interviewer', 'firstName lastName email phone')
    .populate('scheduledBy', 'firstName lastName')
    .lean();

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.json({
      success: true,
      data: interview
    });

  } catch (error) {
    console.error('Get interview by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/hr/interviews/:id
// @desc    Update/reschedule an interview
// @access  Private (HR, Admin)
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid interview ID'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  body('scheduledTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Scheduled time must be in HH:mm format'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('type')
    .optional()
    .isIn(['phone', 'video', 'in-person', 'panel'])
    .withMessage('Invalid interview type'),
  body('location')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Location must be between 1 and 500 characters'),
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
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

    // Get HR's jobs to verify access
    const hrJobs = await Job.find({ postedBy: req.user.id }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const applications = await Application.find({
      job: { $in: hrJobIds }
    }).select('_id');
    const applicationIds = applications.map(app => app._id);

    const interview = await Interview.findOne({
      _id: req.params.id,
      application: { $in: applicationIds }
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    const oldDate = interview.scheduledDate;
    const oldTime = interview.scheduledTime;

    // Update interview
    Object.keys(req.body).forEach(key => {
      interview[key] = req.body[key];
    });

    interview.updatedAt = new Date();

    // If rescheduled, update status and add history
    if (req.body.scheduledDate || req.body.scheduledTime) {
      if (interview.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot reschedule a completed interview'
        });
      }

      interview.status = 'rescheduled';
      interview.rescheduleHistory = interview.rescheduleHistory || [];
      interview.rescheduleHistory.push({
        oldDate,
        oldTime,
        newDate: interview.scheduledDate,
        newTime: interview.scheduledTime,
        rescheduledBy: req.user?.id || new mongoose.Types.ObjectId(),
        rescheduledAt: new Date(),
        reason: req.body.rescheduleReason || 'HR reschedule'
      });
    }

    await interview.save();

    // Populate for response
    const updatedInterview = await Interview.findById(interview._id)
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
      message: 'Interview updated successfully',
      data: updatedInterview
    });

    // Emit reschedule notifications (best-effort)
    try {
      await createAndEmit({
        toUserId: updatedInterview?.interviewer?._id || updatedInterview?.interviewer,
        toCompanyId: req.user.company?._id || req.user.companyId,
        toRole: 'interviewer',
        type: 'interview',
        title: 'Interview Rescheduled',
        message: `Interview rescheduled to ${updatedInterview?.scheduledDate?.toISOString?.() || updatedInterview?.scheduledDate} at ${updatedInterview?.scheduledTime}`,
        actionUrl: `/interviewer/interviews`,
        entity: { kind: 'interview', id: interview._id },
        priority: 'low',
        metadata: { scheduledDate: updatedInterview?.scheduledDate, scheduledTime: updatedInterview?.scheduledTime },
        createdBy: req.user?.id
      });
    } catch (e) {
      console.warn('Failed creating notifications (reschedule):', e.message);
    }

  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/hr/interviews/:id/status
// @desc    Update interview status
// @access  Private (HR, Admin)
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid interview ID'),
  body('status')
    .isIn(['confirmed', 'completed', 'cancelled', 'no_show'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('cancellationReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must be less than 500 characters')
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

    const { status, notes, cancellationReason } = req.body;

    // Get HR's jobs to verify access
    const hrJobs = await Job.find({ 
      postedBy: req.user?.id || new mongoose.Types.ObjectId() 
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    const applications = await Application.find({
      job: { $in: hrJobIds }
    }).select('_id');
    const applicationIds = applications.map(app => app._id);

    const interview = await Interview.findOne({
      _id: req.params.id,
      application: { $in: applicationIds }
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    const oldStatus = interview.status;

    // Update interview status
    interview.status = status;
    interview.updatedAt = new Date();

    if (notes) {
      interview.notes = notes;
    }

    if (status === 'cancelled' && cancellationReason) {
      interview.cancellationReason = cancellationReason;
      interview.cancelledAt = new Date();
    }

    if (status === 'completed') {
      interview.completedAt = new Date();
    }

    await interview.save();

    // Update application status if interview is completed
    if (status === 'completed') {
      const application = await Application.findById(interview.application);
      if (application && application.status === 'shortlisted') {
        application.status = 'interviewed';
        application.timeline.push({
          status: 'interviewed',
          date: new Date(),
          notes: 'Interview completed',
          updatedBy: req.user?.id || new mongoose.Types.ObjectId()
        });
        await application.save();
      }
    }

    res.json({
      success: true,
      message: `Interview status updated from ${oldStatus} to ${status}`,
      data: {
        id: interview._id,
        status: interview.status,
        updatedAt: interview.updatedAt
      }
    });

  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/hr/interviews/available-slots
// @desc    Get available interview slots for an interviewer
// @access  Private (HR, Admin)
router.get('/available-slots/:interviewerId', [
  param('interviewerId').isMongoId().withMessage('Invalid interviewer ID'),
  query('date').isISO8601().withMessage('Date must be a valid date'),
  query('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes')
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

    const { interviewerId } = req.params;
    const { date, duration = 60 } = req.query;

    // Verify interviewer exists
    const interviewer = await User.findOne({
      _id: interviewerId,
      role: 'interviewer'
    });

    if (!interviewer) {
      return res.status(404).json({
        success: false,
        message: 'Interviewer not found'
      });
    }

    // Get existing interviews for the date
    const existingInterviews = await Interview.find({
      interviewer: interviewerId,
      scheduledDate: date,
      status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ scheduledTime: 1 });

    // Generate available slots (9 AM to 5 PM, assuming 30-minute intervals)
    const workingHours = {
      start: '09:00',
      end: '17:00'
    };

    const slots = [];
    let currentTime = workingHours.start;

    while (currentTime < workingHours.end) {
      const currentDateTime = new Date(date + 'T' + currentTime);
      const slotEndTime = new Date(currentDateTime.getTime() + parseInt(duration) * 60000);
      
      // Check if slot conflicts with existing interviews
      const hasConflict = existingInterviews.some(interview => {
        const interviewStart = new Date(interview.scheduledDate + 'T' + interview.scheduledTime);
        const interviewEnd = new Date(interviewStart.getTime() + interview.duration * 60000);
        
        return (currentDateTime >= interviewStart && currentDateTime < interviewEnd) ||
               (slotEndTime > interviewStart && slotEndTime <= interviewEnd) ||
               (currentDateTime <= interviewStart && slotEndTime >= interviewEnd);
      });

      if (!hasConflict && slotEndTime.getHours() < 17) {
        slots.push({
          startTime: currentTime,
          endTime: slotEndTime.toTimeString().slice(0, 5),
          available: true
        });
      }

      // Increment by 30 minutes
      const nextTime = new Date(currentDateTime.getTime() + 30 * 60000);
      currentTime = nextTime.toTimeString().slice(0, 5);
    }

    res.json({
      success: true,
      data: {
        date,
        duration,
        interviewerId,
        availableSlots: slots,
        existingInterviews: existingInterviews.length
      }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;