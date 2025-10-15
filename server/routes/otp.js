const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendOtp, verifyOtp } = require('../controllers/global/otpController');

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});

router.post(
  '/send',
  otpLimiter,
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('userId').optional().isString(),
  ],
  sendOtp
);

router.post(
  '/verify',
  otpLimiter,
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('userId').optional().isString(),
    body('code').isLength({ min: 4 }).withMessage('Code is required'),
  ],
  verifyOtp
);

module.exports = router;
