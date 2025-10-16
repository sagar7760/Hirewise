const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendPasswordResetOtp, resetPasswordWithOtp } = require('../controllers/global/passwordResetController');

const router = express.Router();

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many password reset attempts from this IP, please try again later.'
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP to user's email
// @access  Public
router.post(
  '/forgot-password',
  passwordResetLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],
  sendPasswordResetOtp
);

// @route   POST /api/auth/reset-password
// @desc    Reset password using OTP
// @access  Public
router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  resetPasswordWithOtp
);

module.exports = router;
