const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const { 
  getAllHRUsers, 
  createHRUser, 
  updateHRUser, 
  deleteHRUser, 
  toggleHRUserStatus 
} = require('../../controllers/admin/hrController');

const router = express.Router();

// GET all HR users
router.get('/', auth, authorize('admin'), getAllHRUsers);

// POST create new HR user
router.post('/', auth, authorize('admin'), createHRUser);

// PUT update HR user
router.put('/:hrId', auth, authorize('admin'), updateHRUser);

// DELETE remove HR user
router.delete('/:hrId', auth, authorize('admin'), deleteHRUser);

// PUT toggle HR user status (active/inactive)
router.put('/:hrId/status', auth, authorize('admin'), toggleHRUserStatus);

module.exports = router;