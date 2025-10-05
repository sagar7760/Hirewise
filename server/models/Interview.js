const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application ID is required']
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Interviewer ID is required']
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Scheduler ID is required']
  },
  type: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'technical', 'behavioral', 'panel'],
    required: [true, 'Interview type is required']
  },
  // Time component (HH:mm) stored separately for easier queries and UI formatting
  scheduledTime: {
    type: String,
    required: false // validated at route level
  },
  round: {
    type: Number,
    default: 1,
    min: [1, 'Round must be at least 1']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Interview date is required']
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled'
  },
  // Simple top-level fields for common UI access (parallel to meetingDetails / agenda)
  location: String,
  meetingLink: String,
  notes: {
    type: String,
    maxlength: 1000
  },
  meetingDetails: {
    location: String,           // For in-person interviews
    meetingLink: String,        // For video interviews
    dialInNumber: String,       // For phone interviews
    meetingId: String,
    passcode: String
  },
  agenda: {
    type: String,
    maxlength: [1000, 'Agenda cannot be more than 1000 characters']
  },
  questions: [{
    question: String,
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'situational', 'cultural']
    },
    answer: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  }],
  feedback: {
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    technicalSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    communicationSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    problemSolving: {
      type: Number,
      min: 1,
      max: 5
    },
    culturalFit: {
      type: Number,
      min: 1,
      max: 5
    },
    strengths: [String],
    weaknesses: [String],
    recommendation: {
      type: String,
      enum: ['strongly_recommend', 'recommend', 'neutral', 'do_not_recommend', 'strongly_do_not_recommend']
    },
    additionalNotes: {
      type: String,
      maxlength: [2000, 'Additional notes cannot be more than 2000 characters']
    },
    submittedAt: Date
  },
  // Reschedule history
  rescheduleHistory: [{
    oldDate: Date,
    oldTime: String,
    newDate: Date,
    newTime: String,
    rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rescheduledAt: Date,
    reason: String
  }],
  cancellationReason: String,
  cancelledAt: Date,
  completedAt: Date,
  // Reminders and notifications
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'in_app']
    },
    recipient: {
      type: String,
      enum: ['interviewer', 'candidate', 'both']
    },
    scheduledTime: Date,
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  // Candidate preparation materials
  preparationMaterials: [{
    title: String,
    description: String,
    fileUrl: String,
    isVisible: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
interviewSchema.index({ application: 1 });
interviewSchema.index({ interviewer: 1 });
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ scheduledDate: 1, interviewer: 1 });

// Virtual for interview duration in hours
interviewSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual to check if interview is upcoming
interviewSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDate > new Date() && this.status === 'scheduled';
});

// Virtual to check if interview is today
interviewSchema.virtual('isToday').get(function() {
  const today = new Date();
  const interviewDate = new Date(this.scheduledDate);
  return today.toDateString() === interviewDate.toDateString();
});

// Ensure virtual fields are serialized
interviewSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Interview', interviewSchema);