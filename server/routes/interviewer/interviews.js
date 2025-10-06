const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const Interview = require('../../models/Interview');
const Application = require('../../models/Application');
const Job = require('../../models/Job');

const router = express.Router();

// All interviewer routes require auth & interviewer role
router.use(auth, authorize('interviewer'));

// GET /api/interviewer/interviews - list interviews assigned to interviewer
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['scheduled','confirmed','in_progress','completed','cancelled','rescheduled','no_show']),
  query('dateRange').optional().isIn(['today','upcoming','past'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success:false, message:'Validation failed', errors: errors.array() });
    }

    const { page = 1, limit = 20, status, dateRange } = req.query;
    const filter = { interviewer: req.user.id };

    if (status) filter.status = status;

    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 24*60*60*1000);
      filter.scheduledDate = { $gte: start, $lt: end };
    } else if (dateRange === 'upcoming') {
      filter.scheduledDate = { $gte: now };
    } else if (dateRange === 'past') {
      filter.scheduledDate = { $lt: now };
    }

    const skip = (page - 1) * limit;

    const interviews = await Interview.find(filter)
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'application',
        populate: [
          { path: 'applicant', select: 'firstName lastName email' },
          { path: 'job', select: 'title department location' }
        ]
      })
      .lean();

    const total = await Interview.countDocuments(filter);

    const formatted = interviews.map(i => ({
      id: i._id,
      candidate: i.application?.applicant ? `${i.application.applicant.firstName} ${i.application.applicant.lastName}` : 'Unknown',
      job: i.application?.job?.title || 'Unknown',
      jobDepartment: i.application?.job?.department || null,
      scheduledDate: i.scheduledDate,
      scheduledTime: i.scheduledTime,
      duration: i.duration,
      status: i.status,
      type: i.type,
      location: i.location || i.meetingDetails?.location || null,
      meetingLink: i.meetingLink || i.meetingDetails?.meetingLink || null,
      notes: i.notes || i.agenda || null,
      feedbackSubmitted: !!(i.feedback && i.feedback.submittedAt)
    }));

    res.json({
      success: true,
      data: {
        interviews: formatted,
        pagination: {
          currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
        }
      }
    });
  } catch (error) {
    console.error('Interviewer list interviews error:', error);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// GET /api/interviewer/interviews/:id - detail
router.get('/:id', [ param('id').isMongoId() ], async (req,res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message:'Validation failed', errors: errors.array() });

    const interview = await Interview.findOne({ _id: req.params.id, interviewer: req.user.id })
      .populate({
        path: 'application',
        populate: [
          { path: 'applicant', select: 'firstName lastName email phone' },
          { path: 'job', select: 'title department location experienceLevel' }
        ]
      })
      .populate('scheduledBy', 'firstName lastName email')
      .lean();

    if (!interview) return res.status(404).json({ success:false, message:'Interview not found' });

    res.json({ success:true, data: interview });
  } catch (error) {
    console.error('Interviewer get interview error:', error);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// POST /api/interviewer/interviews/:id/feedback - submit feedback
router.post('/:id/feedback', [
  param('id').isMongoId(),
  body('overallRating').isInt({ min:1, max:5 }),
  body('technicalSkills').optional().isInt({ min:1, max:5 }),
  body('communicationSkills').optional().isInt({ min:1, max:5 }),
  body('problemSolving').optional().isInt({ min:1, max:5 }),
  body('culturalFit').optional().isInt({ min:1, max:5 }),
  body('recommendation').isIn(['strongly_recommend','recommend','neutral','do_not_recommend','strongly_do_not_recommend']),
  body('strengths').optional().isArray(),
  body('weaknesses').optional().isArray(),
  body('additionalNotes').optional().isLength({ max:2000 })
], async (req,res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message:'Validation failed', errors: errors.array() });

    const interview = await Interview.findOne({ _id: req.params.id, interviewer: req.user.id });
    if (!interview) return res.status(404).json({ success:false, message:'Interview not found' });

    // Only allow feedback if interview is completed or scheduled/confirmed and within 24h after scheduled time
    const now = new Date();
    const scheduledEnd = new Date(interview.scheduledDate);
    if (interview.scheduledTime) {
      const [hh, mm] = interview.scheduledTime.split(':');
      scheduledEnd.setHours(parseInt(hh), parseInt(mm));
      scheduledEnd.setTime(scheduledEnd.getTime() + (interview.duration || 60) * 60000);
    }

    // Basic guard (could be expanded)
    if (now < interview.scheduledDate) {
      return res.status(400).json({ success:false, message:'Cannot submit feedback before interview takes place' });
    }

    const nowUtc = new Date();
    const existingSubmittedAt = interview.feedback?.submittedAt;
    if (existingSubmittedAt) {
      const hoursSince = (nowUtc.getTime() - new Date(existingSubmittedAt).getTime()) / 3600000;
      if (hoursSince > 48) {
        return res.status(400).json({ success:false, message:'Feedback edit window (48h) has expired' });
      }
    }

    interview.feedback = {
      overallRating: req.body.overallRating,
      technicalSkills: req.body.technicalSkills,
      communicationSkills: req.body.communicationSkills,
      problemSolving: req.body.problemSolving,
      culturalFit: req.body.culturalFit,
      strengths: req.body.strengths || [],
      weaknesses: req.body.weaknesses || [],
      recommendation: req.body.recommendation,
      additionalNotes: req.body.additionalNotes,
      submittedAt: existingSubmittedAt || nowUtc,
      updatedAt: existingSubmittedAt ? nowUtc : undefined
    };

    if (interview.status === 'scheduled' || interview.status === 'confirmed' || interview.status === 'in_progress') {
      interview.status = 'completed';
      interview.completedAt = new Date();
    }

    await interview.save();

    res.json({ success:true, message:'Feedback submitted', data:{ id: interview._id, status: interview.status } });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
