const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const { 
  getAllInterviewers,
  createInterviewer,
  updateInterviewer,
  deleteInterviewer,
  toggleInterviewerStatus
} = require('../../controllers/admin/interviewerController');

const router = express.Router();

router.get('/', auth, authorize('admin'), getAllInterviewers);
router.post('/', auth, authorize('admin'), createInterviewer);
router.put('/:interviewerId', auth, authorize('admin'), updateInterviewer);
router.delete('/:interviewerId', auth, authorize('admin'), deleteInterviewer);
router.put('/:interviewerId/status', auth, authorize('admin'), toggleInterviewerStatus);

module.exports = router;