const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const controller = require('../../controllers/interviewer/dashboardController');

const router = express.Router();

router.use(auth, authorize('interviewer'));

// GET /api/interviewer/dashboard
router.get('/', controller.getDashboard);

module.exports = router;
