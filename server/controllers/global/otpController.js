const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const VerificationToken = require('../../models/VerificationToken');
const User = require('../../models/User');
const Company = require('../../models/Company');
const { sendOtpEmail } = require('../../services/emailService');

function otpConfig() {
  return {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSec: parseInt(process.env.OTP_RESEND_COOLDOWN_SEC || '60', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '5', 10),
  };
}

function generateCode() {
  const num = crypto.randomInt(0, 1000000); // 0 to 999999
  return num.toString().padStart(6, '0');
}

// POST /api/auth/otp/send
async function sendOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, userId } = req.body;
    const cfg = otpConfig();

    // Find user either by explicit userId or email
    let user = null;
    if (userId) user = await User.findById(userId);
    if (!user && email) user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Rate limit: resend cooldown and max resends in the last day
    const lastToken = await VerificationToken.findOne({ email: user.email, type: 'email_otp' }).sort({ createdAt: -1 });
    const now = Date.now();
    if (lastToken && lastToken.lastSentAt && (now - lastToken.lastSentAt.getTime()) < cfg.resendCooldownSec * 1000) {
      const waitSec = Math.ceil((cfg.resendCooldownSec * 1000 - (now - lastToken.lastSentAt.getTime())) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${waitSec}s before requesting another code.` });
    }

    // Optional: limit total resends per 24h
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const resendCount24h = await VerificationToken.countDocuments({ email: user.email, type: 'email_otp', createdAt: { $gte: since } });
    if (resendCount24h >= cfg.maxResends) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again later.' });
    }

    const code = generateCode();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(now + cfg.expiryMinutes * 60 * 1000);

    const tokenDoc = await VerificationToken.create({
      userId: user._id,
      email: user.email,
      type: 'email_otp',
      codeHash,
      expiresAt,
      attemptsRemaining: cfg.maxAttempts,
      resendCount: lastToken ? lastToken.resendCount + 1 : 0,
      lastSentAt: new Date(),
    });

    await sendOtpEmail(user.email, code);

    return res.json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        userId: user._id,
        email: user.email,
        expiresAt,
        resendCooldownSec: cfg.resendCooldownSec,
      },
    });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/auth/otp/verify
async function verifyOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, userId, code } = req.body;

    // Locate user
    let user = null;
    if (userId) user = await User.findById(userId);
    if (!user && email) user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find latest active token
    const token = await VerificationToken.findOne({ email: user.email, type: 'email_otp', usedAt: null }).sort({ createdAt: -1 });
    if (!token) {
      return res.status(400).json({ success: false, message: 'No active verification code. Please request a new code.' });
    }

    if (token.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (token.attemptsRemaining <= 0) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code.' });
    }

    const match = await bcrypt.compare(code, token.codeHash);
    if (!match) {
      token.attemptsRemaining = Math.max(0, token.attemptsRemaining - 1);
      await token.save();
      return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
    }

    // Mark token used
    token.usedAt = new Date();
    await token.save();

    // Activate user; for company admin also activate company
    user.accountStatus = 'active';
    user.emailVerifiedAt = new Date();
    await user.save();

    if (user.role !== 'applicant' && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (company) {
        company.status = 'active';
        if (company.verificationStatus) {
          company.verificationStatus.emailVerified = true;
          company.verificationStatus.verifiedAt = new Date();
        }
        await company.save();
      }
    }

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
};
