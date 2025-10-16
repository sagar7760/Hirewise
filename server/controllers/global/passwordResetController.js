const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const VerificationToken = require('../../models/VerificationToken');
const User = require('../../models/User');
const { sendEmail } = require('../../services/emailService');

function otpConfig() {
  return {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSec: parseInt(process.env.OTP_RESEND_COOLDOWN_SEC || '60', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '10', 10),
  };
}

function generateCode() {
  const num = crypto.randomInt(0, 1000000); // 0 to 999999
  return num.toString().padStart(6, '0');
}

async function sendPasswordResetEmail(to, code) {
  const appName = process.env.APP_NAME || 'HireWise';
  const expiryMins = Math.floor(parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10));
  const subject = `${appName} - Password Reset Code`;
  const text = `Your password reset code is ${code}. It expires in ${expiryMins} minutes. If you didn't request this, please ignore this email.`;
  const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd;">
    <h2 style="color:#333;">${appName} Password Reset</h2>
    <p>You requested to reset your password. Use the code below to proceed:</p>
    <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background:#f4f4f4; padding:15px; text-align:center; margin:20px 0;">${code}</div>
    <p>This code will expire in <strong>${expiryMins} minutes</strong>.</p>
    <p style="color:#666; font-size:14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
    <p style="font-size:12px; color:#999;">This is an automated message from ${appName}. Please do not reply.</p>
  </div>`;
  return sendEmail({ to, subject, text, html });
}

// POST /api/auth/forgot-password
async function sendPasswordResetOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;
    const cfg = otpConfig();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security: don't reveal if email exists; return success anyway
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.',
        data: { email }
      });
    }

    // Rate limit: resend cooldown
    const lastToken = await VerificationToken.findOne({ email: user.email, type: 'password_reset' }).sort({ createdAt: -1 });
    const now = Date.now();
    if (lastToken && lastToken.lastSentAt && (now - lastToken.lastSentAt.getTime()) < cfg.resendCooldownSec * 1000) {
      const waitSec = Math.ceil((cfg.resendCooldownSec * 1000 - (now - lastToken.lastSentAt.getTime())) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${waitSec}s before requesting another code.` });
    }

    // Optional: limit total requests per 24h
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const resendCount24h = await VerificationToken.countDocuments({ email: user.email, type: 'password_reset', createdAt: { $gte: since } });
    if (resendCount24h >= cfg.maxResends) {
      return res.status(429).json({ success: false, message: 'Too many password reset requests. Try again later.' });
    }

    const code = generateCode();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(now + cfg.expiryMinutes * 60 * 1000);

    await VerificationToken.create({
      userId: user._id,
      email: user.email,
      type: 'password_reset',
      codeHash,
      expiresAt,
      attemptsRemaining: cfg.maxAttempts,
      resendCount: lastToken ? lastToken.resendCount + 1 : 0,
      lastSentAt: new Date(),
    });

    await sendPasswordResetEmail(user.email, code);

    return res.json({
      success: true,
      message: 'Password reset code sent to your email',
      data: {
        email: user.email,
        expiresAt,
        resendCooldownSec: cfg.resendCooldownSec,
      },
    });
  } catch (error) {
    console.error('sendPasswordResetOtp error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /api/auth/reset-password
async function resetPasswordWithOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, code, newPassword } = req.body;

    // Locate user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find latest active token
    const token = await VerificationToken.findOne({ email: user.email, type: 'password_reset', usedAt: null }).sort({ createdAt: -1 });
    if (!token) {
      return res.status(400).json({ success: false, message: 'No active reset code. Please request a new code.' });
    }

    if (token.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new code.' });
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

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.lastPasswordChange = new Date();
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('resetPasswordWithOtp error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  sendPasswordResetOtp,
  resetPasswordWithOtp,
};
