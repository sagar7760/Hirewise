const Job = require('../../models/Job');
const Application = require('../../models/Application');
const User = require('../../models/User');

// Format a job into admin list representation
const formatJob = (job, metrics = {}) => {
  const postedBy = job.postedByObj ? `${job.postedByObj.firstName} ${job.postedByObj.lastName}`.trim() : 'Unknown';
  const salaryMin = job.salaryRange?.min; const salaryMax = job.salaryRange?.max; const currency = job.salaryRange?.currency || 'INR';
  let salary = 'N/A';
  if (salaryMin && salaryMax) salary = `${salaryMin} - ${salaryMax} ${currency}`; else if (salaryMin) salary = `${salaryMin} ${currency}+`;
  return {
    id: job._id,
    title: job.title,
    department: job.department,
    location: job.location || 'N/A',
    type: job.jobType,
    status: job.status,
    applications: metrics.applications || 0,
    shortlisted: metrics.shortlisted || 0,
    hired: metrics.hired || 0,
    postedBy,
    postedDate: (job.publishedAt || job.createdAt),
    salary
  };
};

// GET /api/admin/jobs
// Supports query params: status, search, page, limit, department, jobType, fromDate, toDate, sortBy, sortOrder
const getAllJobs = async (req, res) => {
  try {
    const companyId = req.user.companyId || (req.user.company?._id || req.user.company);
    if (!companyId) return res.status(400).json({ error: 'Company context missing' });

    const { status, search, page = 1, limit = 10, department, jobType, fromDate, toDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const numericPage = Math.max(parseInt(page) || 1, 1);
    const numericLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const filter = { company: companyId };
    if (status && ['active','closed','draft','inactive'].includes(status)) filter.status = status;
    if (department && department !== 'all') filter.department = department;
    if (jobType && jobType !== 'all') filter.jobType = jobType;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const d = new Date(toDate);
        d.setHours(23,59,59,999);
        filter.createdAt.$lte = d;
      }
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [ { title: regex }, { department: regex }, { location: regex } ];
    }

    const sortFieldsMap = {
      createdAt: 'createdAt',
      title: 'title',
      applications: 'applicationsCount', // pre-computed field in Job
      status: 'status'
    };
    const resolvedSort = sortFieldsMap[sortBy] || 'createdAt';
    const sortObj = { [resolvedSort]: sortOrder === 'asc' ? 1 : -1 };

    const totalItems = await Job.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / numericLimit) || 1;
    const skip = (numericPage - 1) * numericLimit;

    const jobs = await Job.find(filter)
      .populate({ path: 'postedBy', select: 'firstName lastName', model: User })
      .sort(sortObj)
      .skip(skip)
      .limit(numericLimit)
      .lean();

    const jobIds = jobs.map(j => j._id);
    const appsAgg = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: { job: '$job', status: '$status' }, count: { $sum: 1 } } }
    ]);
    const metricsMap = {};
    appsAgg.forEach(r => {
      const jobId = r._id.job.toString();
      metricsMap[jobId] = metricsMap[jobId] || { applications: 0, shortlisted: 0, hired: 0 };
      metricsMap[jobId].applications += r.count;
      if (r._id.status === 'shortlisted') metricsMap[jobId].shortlisted += r.count;
      if (r._id.status === 'offer_accepted') metricsMap[jobId].hired += r.count;
    });

    const formatted = jobs.map(j => formatJob({ ...j, postedByObj: j.postedBy }, metricsMap[j._id.toString()]));

    // Distinct lists
    const postedByList = [...new Set(formatted.map(f => f.postedBy).filter(Boolean))];
    const departmentList = await Job.distinct('department', { company: companyId });
    const jobTypes = await Job.distinct('jobType', { company: companyId });

    res.json({
      jobs: formatted,
      postedBy: postedByList,
      departments: departmentList,
      jobTypes,
      totals: {
        totalJobs: totalItems,
        activeJobs: await Job.countDocuments({ ...filter, status: 'active' }),
        totalApplications: formatted.reduce((s,j)=>s+j.applications,0),
        totalHired: formatted.reduce((s,j)=>s+j.hired,0)
      },
      pagination: {
        page: numericPage,
        limit: numericLimit,
        totalPages,
        totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
  }
};

// PUT /api/admin/jobs/:jobId/status { status }
const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const allowed = ['active','closed','inactive','draft'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
    const companyId = req.user.companyId || (req.user.company?._id || req.user.company);
    const job = await Job.findOneAndUpdate({ _id: jobId, company: companyId }, { status }, { new: true })
      .populate({ path: 'postedBy', select: 'firstName lastName', model: User });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // recompute metrics for this job only
    const appsAgg = await Application.aggregate([
      { $match: { job: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const metrics = { applications: 0, shortlisted: 0, hired: 0 };
    appsAgg.forEach(r => { metrics.applications += r.count; if (r._id==='shortlisted') metrics.shortlisted = r.count; if (r._id==='offer_accepted') metrics.hired = r.count; });

    res.json({ job: formatJob({ ...job.toObject(), postedByObj: job.postedBy }, metrics) });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status', details: error.message });
  }
};

module.exports = { getAllJobs, updateJobStatus };
// GET /api/admin/jobs/:jobId
const getJobDetail = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user.companyId || (req.user.company?._id || req.user.company);
    const job = await Job.findOne({ _id: jobId, company: companyId })
      .populate({ path: 'postedBy', select: 'firstName lastName email', model: User })
      .lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const apps = await Application.find({ job: job._id }).select('status createdAt');
    const statusCounts = apps.reduce((acc,a)=>{ acc[a.status]=(acc[a.status]||0)+1; return acc; },{});
    res.json({
      job: {
        ...job,
        postedBy: job.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName}`.trim() : 'Unknown',
        applicationStats: {
          total: apps.length,
          shortlisted: statusCounts.shortlisted || 0,
          hired: statusCounts.offer_accepted || 0,
          byStatus: statusCounts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job detail:', error);
    res.status(500).json({ error: 'Failed to fetch job detail', details: error.message });
  }
};

// PUT /api/admin/jobs/bulk-status { jobIds:[], status }
const bulkUpdateStatus = async (req, res) => {
  try {
    const { jobIds = [], status } = req.body;
    if (!Array.isArray(jobIds) || jobIds.length === 0) return res.status(400).json({ error: 'jobIds array required' });
    const allowed = ['active','closed','inactive','draft'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
    const companyId = req.user.companyId || (req.user.company?._id || req.user.company);
    const result = await Job.updateMany({ _id: { $in: jobIds }, company: companyId }, { status });
    res.json({ message: 'Statuses updated', matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) {
    console.error('Error bulk updating job status:', error);
    res.status(500).json({ error: 'Failed bulk status update', details: error.message });
  }
};

module.exports = { getAllJobs, updateJobStatus, getJobDetail, bulkUpdateStatus };