const express = require('express');
const { auth } = require('../../middleware/auth');
const { body } = require('express-validator');
const {
  uploadResume,
  saveParsedResumeData,
  getUserResumes,
  getResume,
  deleteResume,
  upload
} = require('../../controllers/applicant/resumeController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/resumes/upload
// @desc    Upload resume file
// @access  Private
router.post('/upload', upload.single('resume'), uploadResume);

// @route   POST /api/resumes/parsed-data
// @desc    Save parsed resume data to user profile
// @access  Private
router.post('/parsed-data', [
  body('parsedData').isObject().withMessage('Parsed data must be an object')
], saveParsedResumeData);

// @route   GET /api/resumes
// @desc    Get user's resumes
// @access  Private
router.get('/', getUserResumes);

// @route   GET /api/resumes/:id
// @desc    Get specific resume
// @access  Private
router.get('/:id', getResume);

// @route   DELETE /api/resumes/:id
// @desc    Delete resume
// @access  Private
router.delete('/:id', deleteResume);

module.exports = router;