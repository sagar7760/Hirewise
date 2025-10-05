const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const { getOverview } = require('../../controllers/admin/dashboardController');

const router = express.Router();

router.get('/overview', auth, authorize('admin'), getOverview);

module.exports = router;
