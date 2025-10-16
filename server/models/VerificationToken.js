const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email: { type: String, index: true },
  type: { type: String, enum: ['email_otp', 'password_reset'], default: 'email_otp' },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attemptsRemaining: { type: Number, default: 5 },
  resendCount: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

verificationTokenSchema.index({ email: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
