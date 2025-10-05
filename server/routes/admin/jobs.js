const express = require('express');
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');
const { getAllJobs, updateJobStatus, getJobDetail, bulkUpdateStatus } = require('../../controllers/admin/jobsController');

const router = express.Router();

// List jobs
router.get('/', auth, authorize('admin'), getAllJobs);

// Bulk route MUST come before parameterized /:jobId routes to avoid Express treating 'bulk' as :jobId
router.put('/bulk/status', auth, authorize('admin'), bulkUpdateStatus);

// Validate jobId param to avoid invalid ObjectId CastErrors early
router.param('jobId', (req, res, next, id) => {
	if (!mongoose.isValidObjectId(id)) {
		return res.status(400).json({ error: 'Invalid jobId format' });
	}
	next();
});

// Single job operations
router.put('/:jobId/status', auth, authorize('admin'), updateJobStatus);
router.get('/:jobId', auth, authorize('admin'), getJobDetail);

module.exports = router;