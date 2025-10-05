const mongoose = require('mongoose');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const User = require('../../models/User');

// Helper to generate last N months labels (YYYY-MM)
function getLastMonths(n) {
  const out = [];
  const d = new Date();
  d.setDate(1); // normalize
  for (let i = 0; i < n; i++) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    out.unshift(`${year}-${month}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

// GET /api/admin/dashboard/overview
// Query: months (default 6)
// Implements agreed definitions:
// - totalCandidates: distinct applicants who applied to this company's jobs
// - selectedCandidates: applications with status offer_accepted (definition C)
// - pendingApplications: statuses excluding rejected, withdrawn, offer_declined, offer_accepted
// - trend.selected: count of monthly apps whose status is in ['shortlisted','offer_extended','offer_accepted'] (agreed #6)
exports.getOverview = async (req, res) => {
  try {
    const companyId = req.user.companyId || (req.user.company?._id || req.user.company);
    if (!companyId) return res.status(400).json({ error: 'Company context missing' });

    const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 24);
    const monthKeys = getLastMonths(months); // ['2025-05', ...]
    const monthKeySet = new Set(monthKeys);

    // Fetch company job ids
    const jobs = await Job.find({ company: companyId }).select('_id createdAt status').lean();
    const jobIds = jobs.map(j => j._id);

    // Parallel aggregations
    const [applicationsAgg, usersAgg] = await Promise.all([
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        {
          $project: {
            job: 1,
            applicant: 1,
            status: 1,
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
          }
        },
        {
          $group: {
            _id: { month: '$month' },
            applications: { $sum: 1 },
            shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
            hired: { $sum: { $cond: [{ $eq: ['$status', 'offer_accepted'] }, 1, 0] } },
            selected: {
              $sum: {
                $cond: [{ $in: ['$status', ['shortlisted', 'offer_extended', 'offer_accepted']] }, 1, 0]
              }
            }
          }
        }
      ]),
      User.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Build role counts
    const roleCounts = usersAgg.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});

    // Distinct applicant count
    const distinctApplicants = await Application.distinct('applicant', { job: { $in: jobIds } });

    // Selected candidates count (offer_accepted)
    const selectedCandidates = await Application.countDocuments({ job: { $in: jobIds }, status: 'offer_accepted' });

    // Pending applications count
    const pendingStatuses = ['submitted','under_review','interview_scheduled','interviewed','offer_extended'];
    const pendingApplications = await Application.countDocuments({ job: { $in: jobIds }, status: { $in: pendingStatuses } });

    // Trend map with zero fill
  const trendMap = monthKeys.map(m => ({ month: m, applications: 0, shortlisted: 0, hired: 0, selected: 0 }));
    const indexByMonth = trendMap.reduce((acc, obj, idx) => { acc[obj.month] = idx; return acc; }, {});
    applicationsAgg.forEach(r => {
      const m = r._id.month;
      if (monthKeySet.has(m)) {
        const idx = indexByMonth[m];
        trendMap[idx].applications = r.applications;
        trendMap[idx].shortlisted = r.shortlisted || 0;
        trendMap[idx].hired = r.hired || 0;
        trendMap[idx].selected = r.selected;
      }
    });

    // Recent activity: combine latest items (limit 15 total)
    const [recentJobs, recentAppStatus, recentNewUsers] = await Promise.all([
      Job.find({ company: companyId }).sort({ createdAt: -1 }).limit(5).select('title createdAt').lean(),
      Application.find({ job: { $in: jobIds } }).sort({ updatedAt: -1 }).limit(5).select('status createdAt updatedAt').lean(),
      User.find({ companyId, role: { $in: ['hr','interviewer'] } }).sort({ createdAt: -1 }).limit(5).select('firstName lastName role createdAt').lean()
    ]);

    const recentActivity = [
      ...recentJobs.map(j => ({
        type: 'job_posted',
        message: `Job posted: "${j.title}"`,
        time: j.createdAt
      })),
      ...recentAppStatus.map(a => ({
        type: 'application_update',
        message: `Application status: ${a.status}`,
        time: a.updatedAt || a.createdAt
      })),
      ...recentNewUsers.map(u => ({
        type: u.role === 'hr' ? 'hr_added' : 'interviewer_added',
        message: `New ${u.role.toUpperCase()}: ${u.firstName} ${u.lastName}`.trim(),
        time: u.createdAt
      }))
    ].sort((a,b) => b.time - a.time).slice(0, 12);

    const shortlistedCandidates = await Application.countDocuments({ job: { $in: jobIds }, status: 'shortlisted' });

    res.json({
      stats: {
        totalJobs: jobs.length,
        totalCandidates: distinctApplicants.length,
        totalHRs: roleCounts.hr || 0,
        totalInterviewers: roleCounts.interviewer || 0,
        selectedCandidates, // hired
        shortlistedCandidates,
        pendingApplications
      },
      trend: trendMap,
      recentActivity: recentActivity.map(r => ({
        type: r.type,
        message: r.message,
        time: r.time
      }))
    });
  } catch (error) {
    console.error('Admin dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to load dashboard overview', details: error.message });
  }
};
