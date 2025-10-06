const mongoose = require('mongoose');
const Interview = require('../../models/Interview');

// IST offset in minutes (+5:30)
const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

function getISTBoundaries(nowUtc = new Date()) {
  const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MS);
  const istStartOfDayLocal = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
  const startOfTodayUTC = new Date(istStartOfDayLocal.getTime() - IST_OFFSET_MS);
  const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 24 * 3600000);

  // Start of (ISO week starting Monday) in IST
  const day = istNow.getDay(); // 0=Sun ... 6=Sat
  const diffToMonday = (day + 6) % 7; // days since Monday
  const istStartOfWeekLocal = new Date(istStartOfDayLocal.getTime() - diffToMonday * 24 * 3600000);
  const startOfWeekUTC = new Date(istStartOfWeekLocal.getTime() - IST_OFFSET_MS);
  const endOfWeekUTC = new Date(startOfWeekUTC.getTime() + 7 * 24 * 3600000);

  return { startOfTodayUTC, endOfTodayUTC, startOfWeekUTC, endOfWeekUTC };
}

// Compute average feedback turnaround (in hours, 1 decimal) from scheduledDate to feedback.submittedAt
function computeAvgTurnaround(interviews) {
  const diffs = [];
  for (const i of interviews) {
    if (i.feedback && i.feedback.submittedAt && i.scheduledDate) {
      const submitted = new Date(i.feedback.submittedAt).getTime();
      const scheduled = new Date(i.scheduledDate).getTime();
      if (submitted >= scheduled) {
        diffs.push((submitted - scheduled) / 3600000);
      }
    }
  }
  if (!diffs.length) return 0;
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Number(avg.toFixed(1));
}

exports.getDashboard = async (req, res) => {
  try {
    const interviewerId = req.user.id;
    const nowUtc = new Date();
    const { startOfTodayUTC, endOfTodayUTC, startOfWeekUTC, endOfWeekUTC } = getISTBoundaries(nowUtc);
    const startPrevWeekUTC = new Date(startOfWeekUTC.getTime() - 7 * 24 * 3600000);
    const endPrevWeekUTC = startOfWeekUTC; // previous week ends where current starts
    const fortyEightHoursAgo = new Date(nowUtc.getTime() - 48 * 3600000);
    const excludeStatuses = ['cancelled', 'no_show'];

    const interviewerObjectId = new mongoose.Types.ObjectId(interviewerId);

    const pipeline = [
      { $match: { interviewer: interviewerObjectId } },
      { $facet: {
        today: [
          { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $gte: startOfTodayUTC, $lt: endOfTodayUTC } } },
          { $sort: { scheduledDate: 1 } },
          { $lookup: { from: 'applications', localField: 'application', foreignField: '_id', as: 'application' } },
          { $unwind: { path: '$application', preserveNullAndEmptyArrays: true } },
          { $lookup: { from: 'users', localField: 'application.applicant', foreignField: '_id', as: 'applicant' } },
          { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
          { $lookup: { from: 'jobs', localField: 'application.job', foreignField: '_id', as: 'job' } },
          { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
          { $project: {
              _id: 1,
              candidateName: { $cond: [ { $and: ['$applicant.firstName', '$applicant.lastName'] }, { $concat: ['$applicant.firstName', ' ', '$applicant.lastName'] }, 'Unknown' ] },
              jobTitle: '$job.title',
              scheduledTime: '$scheduledTime',
              duration: { $ifNull: ['$duration', 60] },
              status: 1
          } }
        ],
        total: [ { $match: { status: { $nin: excludeStatuses } } }, { $count: 'value' } ],
        upcoming: [ { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $gt: nowUtc } } }, { $count: 'value' } ],
        completedThisWeek: [ { $match: { status: 'completed', completedAt: { $gte: startOfWeekUTC } } }, { $count: 'value' } ],
        thisWeek: [ { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $gte: startOfWeekUTC, $lt: endOfWeekUTC } } }, { $count: 'value' } ],
        lastWeek: [ { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $gte: startPrevWeekUTC, $lt: endPrevWeekUTC } } }, { $count: 'value' } ],
        pending_unsubmitted: [ { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $lt: nowUtc }, $or: [ { feedback: { $exists: false } }, { 'feedback.submittedAt': { $exists: false } }, { 'feedback.submittedAt': null } ] } }, { $count: 'value' } ],
        pending_editable_submitted: [ { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $lt: nowUtc }, 'feedback.submittedAt': { $gte: fortyEightHoursAgo } } }, { $count: 'value' } ],
        overdue_unsubmitted: [ { $match: { status: { $nin: excludeStatuses }, scheduledDate: { $lt: fortyEightHoursAgo }, $or: [ { feedback: { $exists: false } }, { 'feedback.submittedAt': { $exists: false } }, { 'feedback.submittedAt': null } ] } }, { $count: 'value' } ],
        turnaround: [
          { $match: { status: { $nin: excludeStatuses }, 'feedback.submittedAt': { $exists: true }, scheduledDate: { $exists: true } } },
          { $project: { diffHours: { $divide: [ { $subtract: ['$feedback.submittedAt', '$scheduledDate'] }, 3600000 ] } } },
          { $group: { _id: null,
              lt6h: { $sum: { $cond: [ { $lt: ['$diffHours', 6] }, 1, 0 ] } },
              h6_24: { $sum: { $cond: [ { $and: [ { $gte: ['$diffHours', 6] }, { $lt: ['$diffHours', 24] } ] }, 1, 0 ] } },
              h24_48: { $sum: { $cond: [ { $and: [ { $gte: ['$diffHours', 24] }, { $lt: ['$diffHours', 48] } ] }, 1, 0 ] } },
              gt48h: { $sum: { $cond: [ { $gte: ['$diffHours', 48] }, 1, 0 ] } },
              total: { $sum: 1 },
              avg: { $avg: '$diffHours' }
          } },
          { $project: { _id: 0, lt6h: 1, h6_24: 1, h24_48: 1, gt48h: 1, total: 1, avg: { $round: ['$avg', 1] } } }
        ]
      } }
    ];

    const aggResultArr = await Interview.aggregate(pipeline).allowDiskUse(true);
    const agg = aggResultArr[0] || {};

    const pickCount = name => (agg[name] && agg[name][0] && agg[name][0].value) || 0;

    const todaysInterviews = (agg.today || []).map(i => ({
      id: i._id,
      candidateName: i.candidateName || 'Unknown',
      jobTitle: i.jobTitle || 'Unknown',
      time: i.scheduledTime || null,
      duration: i.duration || 60,
      status: i.status
    }));

    const pending_unsubmitted = pickCount('pending_unsubmitted');
    const pending_editable_submitted = pickCount('pending_editable_submitted');
    const overdue_unsubmitted = pickCount('overdue_unsubmitted');
    const pendingFeedbackTotal = pending_unsubmitted + pending_editable_submitted; // keep behavior from earlier

    const turnaround = (agg.turnaround && agg.turnaround[0]) || { lt6h:0,h6_24:0,h24_48:0,gt48h:0,total:0,avg:0 };

    // Build recent activities separately (not part of facet to keep pipeline simpler & limit lookups)
    const activitySource = await Interview.find({ interviewer: interviewerId })
      .sort({ updatedAt: -1 })
      .limit(120)
      .populate({
        path: 'application',
        populate: [
          { path: 'applicant', select: 'firstName lastName' },
          { path: 'job', select: 'title' }
        ]
      })
      .lean();

    const activities = [];
    for (const i of activitySource) {
      const candidateName = i.application?.applicant ? `${i.application.applicant.firstName} ${i.application.applicant.lastName}` : 'Unknown';
      const jobTitle = i.application?.job?.title || 'Unknown';
      if (i.createdAt) activities.push({ id: `${i._id}-scheduled`, type: 'scheduled', message: `Interview with ${candidateName} scheduled (${jobTitle})`, timestamp: i.createdAt });
      if (i.rescheduleHistory && i.rescheduleHistory.length) {
        const last = i.rescheduleHistory[i.rescheduleHistory.length - 1];
        if (last.rescheduledAt) activities.push({ id: `${i._id}-rescheduled-${activities.length}`, type: 'rescheduled', message: `Interview with ${candidateName} rescheduled (${jobTitle})`, timestamp: last.rescheduledAt });
      }
      if (i.completedAt) activities.push({ id: `${i._id}-completed`, type: 'completed', message: `Interview with ${candidateName} completed (${jobTitle})`, timestamp: i.completedAt });
      if (i.feedback && i.feedback.submittedAt) activities.push({ id: `${i._id}-feedback`, type: 'feedback_submitted', message: `Feedback submitted for ${candidateName} (${jobTitle})`, timestamp: i.feedback.submittedAt });
    }
    const recentActivities = activities
      .filter(a => ['scheduled', 'rescheduled', 'completed', 'feedback_submitted'].includes(a.type))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(a => ({ ...a, timestamp: new Date(a.timestamp).toISOString() }));

    res.json({
      success: true,
      data: {
        summary: {
          totalInterviews: pickCount('total'),
          upcomingInterviews: pickCount('upcoming'),
          todaysInterviews: todaysInterviews.length,
          pendingFeedback: pendingFeedbackTotal
        },
        todaysInterviews,
        metrics: {
          completedThisWeek: pickCount('completedThisWeek'),
          avgFeedbackTurnaroundHours: turnaround.avg
        },
        weekComparison: {
          thisWeek: pickCount('thisWeek'),
          lastWeek: pickCount('lastWeek')
        },
        feedbackTurnaroundBuckets: {
          lt6h: turnaround.lt6h,
          h6_24: turnaround.h6_24,
          h24_48: turnaround.h24_48,
          gt48h: turnaround.gt48h,
          total: turnaround.total
        },
        pendingSegments: {
          unsubmitted: pending_unsubmitted,
          editableSubmitted: pending_editable_submitted,
          overdueUnsubmitted: overdue_unsubmitted
        },
        recentActivities
      }
    });
  } catch (error) {
    console.error('Interviewer dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
