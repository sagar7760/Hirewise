const express = require('express');
const { query, validationResult } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const Interview = require('../../models/Interview');

const router = express.Router();

// Auth & role guard
router.use(auth, authorize('interviewer'));

// GET /api/interviewer/feedback/pending
// Returns interviews whose scheduled date/time has passed & no feedback submitted yet
router.get('/pending', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    const now = new Date();

    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 3600000);
    const filter = {
      interviewer: req.user.id,
      scheduledDate: { $lt: now },
      $or: [
        { 'feedback.submittedAt': { $exists: false } },
        { 'feedback.submittedAt': null },
        { 'feedback.submittedAt': { $gte: fortyEightHoursAgo } } // still editable window
      ]
    };

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

    const list = interviews.map(i => {
      const diffDays = Math.max(0, Math.floor((now.getTime() - new Date(i.scheduledDate).getTime()) / (24 * 60 * 60 * 1000)));
      let priority = 'low';
      if (diffDays >= 4) priority = 'high';
      else if (diffDays >= 2) priority = 'medium';
      const submittedAt = i.feedback?.submittedAt ? new Date(i.feedback.submittedAt) : null;
      const editable = submittedAt ? (now.getTime() - submittedAt.getTime()) / 3600000 <= 48 : false;
      const hoursRemaining = submittedAt ? Math.max(0, 48 - ((now.getTime() - submittedAt.getTime()) / 3600000)) : null;
      return {
        id: i._id,
        candidateName: i.application?.applicant ? `${i.application.applicant.firstName} ${i.application.applicant.lastName}` : 'Unknown',
        jobTitle: i.application?.job?.title || 'Unknown',
        interviewDate: i.scheduledDate,
        interviewTime: i.scheduledTime || null,
        duration: i.duration || 60,
        interviewType: i.type,
        department: i.application?.job?.department || null,
        daysPending: diffDays,
        priority,
        hasFeedback: !!submittedAt,
        editable,
        hoursRemaining: submittedAt ? Number(hoursRemaining.toFixed(1)) : null,
        existingFeedback: submittedAt && editable ? {
          overallRating: i.feedback?.overallRating || null,
          technicalSkills: i.feedback?.technicalSkills || null,
          communicationSkills: i.feedback?.communicationSkills || null,
            problemSolving: i.feedback?.problemSolving || null,
            culturalFit: i.feedback?.culturalFit || null,
            strengths: i.feedback?.strengths || [],
            weaknesses: i.feedback?.weaknesses || [],
            recommendation: i.feedback?.recommendation || null,
            additionalNotes: i.feedback?.additionalNotes || ''
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        interviews: list,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get pending feedback interviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
