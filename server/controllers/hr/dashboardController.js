const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Interview = require('../../models/Interview');
const User = require('../../models/User');
const mongoose = require('mongoose');
exports.getRecentJobs = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.companyId;
    const jobs = await Job.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('postedBy', 'firstName lastName')
      .lean();

    // For each job compute applicants count (lean approach)
    const jobIds = jobs.map(j => j._id);
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc, c) => { acc[c._id.toString()] = c.count; return acc; }, {});

    const formatted = jobs.map(j => ({
      id: j._id,
      title: j.title,
      department: j.department,
      status: j.status.charAt(0).toUpperCase() + j.status.slice(1),
      applicants: countMap[j._id.toString()] || 0,
      postedDate: j.publishedAt || (j.status === 'active' ? j.updatedAt : j.createdAt),
      createdBy: j.postedBy?._id.toString() === req.user.id ? 'me' : 'other'
    }));

    res.json({ success: true, recentJobs: formatted });
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent jobs', details: error.message });
  }
};

exports.getRecentApplications = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.companyId;
    const myJobIds = await Job.find({ postedBy: req.user.id, company: companyId }).distinct('_id');

    const apps = await Application.find({ job: { $in: myJobIds } })
      .populate('applicant', 'firstName lastName')
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const formatted = apps.map(a => ({
      id: a._id,
      candidate: `${a.applicant.firstName} ${a.applicant.lastName}`,
      job: a.job?.title || 'Unknown',
      appliedDate: a.createdAt,
      resumeScore: typeof a.aiAnalysis?.overallScore === 'number' ? (a.aiAnalysis.overallScore / 10).toFixed(1) : null,
      status: a.status
    }));

    res.json({ success: true, recentApplications: formatted });
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent applications', details: error.message });
  }
};

exports.getUpcomingInterviews = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.companyId;
    const myJobIds = await Job.find({ postedBy: req.user.id, company: companyId }).distinct('_id');
    const applicationIds = await Application.find({ job: { $in: myJobIds } }).distinct('_id');

    const now = new Date();
    const interviews = await Interview.find({
      application: { $in: applicationIds },
      status: 'scheduled',
      scheduledDate: { $gt: now }
    })
      .populate({
        path: 'application',
        populate: [
          { path: 'applicant', select: 'firstName lastName' },
          { path: 'job', select: 'title' }
        ]
      })
      .populate('interviewer', 'firstName lastName')
      .sort({ scheduledDate: 1 })
      .limit(5)
      .lean();

    const formatted = interviews.map(i => ({
      id: i._id,
      candidate: `${i.application.applicant.firstName} ${i.application.applicant.lastName}`,
      job: i.application.job?.title || 'Unknown',
      date: i.scheduledDate,
      interviewer: i.interviewer ? `${i.interviewer.firstName} ${i.interviewer.lastName}` : 'TBD',
      status: i.status
    }));

    res.json({ success: true, upcomingInterviews: formatted });
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming interviews', details: error.message });
  }
};
console.log('HR Dashboard controller module loaded');

// Get HR dashboard statistics
exports.getStats = async (req, res) => {
  try {
    // Get total jobs posted by this HR in their company
    const companyId = req.user.company?._id || req.user.companyId;
    const totalJobs = await Job.countDocuments({ 
      postedBy: req.user.id,
      company: companyId
    });

    // Get total applications across all HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user.id,
      company: companyId
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

    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentApplications = await Application.countDocuments({
      job: { $in: hrJobIds },
      createdAt: { $gte: sevenDaysAgo }
    });

    // Job posting trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const jobsPostedLastMonth = await Job.countDocuments({
      postedBy: req.user.id,
      company: companyId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalJobs,
        totalApplicants,
        candidatesShortlisted,
        interviewsScheduled,
        recentApplications,
        jobsPostedLastMonth,
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching HR dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: error.message
    });
  }
};

// Get recent activities for HR dashboard
exports.getRecentActivities = async (req, res) => {
  try {
    // Get HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user.id,
      companyId: req.user.companyId
    }).select('_id title');

    const hrJobIds = hrJobs.map(job => job._id);
    const hrJobsMap = hrJobs.reduce((acc, job) => {
      acc[job._id] = job.title;
      return acc;
    }, {});

    // Get recent applications
    const recentApplications = await Application.find({
      job: { $in: hrJobIds }
    })
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get recent interviews
    const recentInterviews = await Interview.find({
      application: { 
        $in: await Application.find({ job: { $in: hrJobIds } }).distinct('_id')
      }
    })
    .populate({
      path: 'application',
      populate: [
        { path: 'applicant', select: 'firstName lastName email' },
        { path: 'job', select: 'title' }
      ]
    })
    .populate('interviewer', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Format activities
    const activities = [];

    recentApplications.forEach(app => {
      activities.push({
        type: 'application',
        title: `New application received`,
        description: `${app.applicant.firstName} ${app.applicant.lastName} applied for ${app.job.title}`,
        timestamp: app.createdAt,
        data: {
          applicantName: `${app.applicant.firstName} ${app.applicant.lastName}`,
          jobTitle: app.job.title,
          status: app.status
        }
      });
    });

    recentInterviews.forEach(interview => {
      activities.push({
        type: 'interview',
        title: `Interview ${interview.status}`,
        description: `Interview with ${interview.application.applicant.firstName} ${interview.application.applicant.lastName} for ${interview.application.job.title}`,
        timestamp: interview.createdAt,
        data: {
          applicantName: `${interview.application.applicant.firstName} ${interview.application.applicant.lastName}`,
          jobTitle: interview.application.job.title,
          status: interview.status,
          scheduledDate: interview.scheduledDate
        }
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      activities: activities.slice(0, 15) // Return top 15 recent activities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities',
      details: error.message
    });
  }
};

// Get application trends data
exports.getApplicationTrends = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get HR's jobs
    const hrJobs = await Job.find({ 
      postedBy: req.user.id,
      companyId: req.user.companyId
    }).select('_id');
    const hrJobIds = hrJobs.map(job => job._id);

    // Aggregate applications by day
    const trends = await Application.aggregate([
      {
        $match: {
          job: { $in: hrJobIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          applications: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      trends
    });

  } catch (error) {
    console.error('Error fetching application trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application trends',
      details: error.message
    });
  }
};

// Get top performing jobs
exports.getTopJobs = async (req, res) => {
  try {
    // Get top jobs by application count
    const topJobs = await Job.aggregate([
      {
        $match: {
          postedBy: mongoose.Types.ObjectId(req.user.id),
          companyId: mongoose.Types.ObjectId(req.user.companyId)
        }
      },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $addFields: {
          applicationCount: { $size: '$applications' },
          shortlistedCount: {
            $size: {
              $filter: {
                input: '$applications',
                cond: { $eq: ['$$this.status', 'shortlisted'] }
              }
            }
          }
        }
      },
      {
        $project: {
          title: 1,
          location: 1,
          jobType: 1,
          status: 1,
          createdAt: 1,
          applicationCount: 1,
          shortlistedCount: 1
        }
      },
      {
        $sort: { applicationCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      topJobs
    });

  } catch (error) {
    console.error('Error fetching top jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top jobs',
      details: error.message
    });
  }
};