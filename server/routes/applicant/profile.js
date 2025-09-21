const express = require('express');
const { auth } = require('../../middleware/auth');
const {
  getProfile,
  updateProfile,
  downloadCurrentResume,
  deleteCurrentResume,
  validateProfileUpdate
} = require('../../controllers/applicant/profileController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', getProfile);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', validateProfileUpdate, updateProfile);

// @route   GET /api/profile/resume/download
// @desc    Download current resume
// @access  Private
router.get('/resume/download', downloadCurrentResume);

// @route   DELETE /api/profile/resume
// @desc    Delete current resume
// @access  Private
router.delete('/resume', deleteCurrentResume);

module.exports = router;