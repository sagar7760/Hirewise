const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { 
  register, 
  login, 
  getMe, 
  logout
} = require('../controllers/global/authController');

const router = express.Router();

// @route   GET /api/auth/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Import company registration routes
const companyRoutes = require('./auth/company');
router.use('/company', companyRoutes);

// @route   POST /api/auth/register
// @desc    Register user with enhanced profile data
// @access  Public
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('currentLocation').optional().trim(),
  body('currentStatus').optional().trim(),
  body('role').optional().isIn(['applicant', 'hr', 'interviewer', 'admin']).withMessage('Invalid role')
], register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, logout);

module.exports = router;