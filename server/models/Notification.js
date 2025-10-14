const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // recipient
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    role: { type: String, enum: ['admin', 'hr', 'interviewer', 'applicant'], index: true },
    type: {
      type: String,
      enum: [
        'application',
        'application_submitted',
        'application_status_changed',
        'interview',
        'interview_scheduled',
        'interview_rescheduled',
        'interview_cancelled',
        'feedback',
        'feedback_submitted',
        'deadline',
        'job',
        'job_created',
        'account_created',
        'system'
      ],
      required: true,
      default: 'system',
      index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionUrl: { type: String },
    entity: {
      kind: { type: String, enum: ['Application', 'Interview', 'Job', 'User', 'application', 'interview', 'job', 'user', 'other'], default: 'other' },
      id: { type: mongoose.Schema.Types.ObjectId },
      extra: { type: Object }
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    metadata: { type: Object },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ company: 1, role: 1, createdAt: -1 });

// Auto-delete read notifications after 30 days using TTL on readAt
// TTL applies only to documents where readAt exists (unread won't have readAt)
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Notification', notificationSchema);
