const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Job description cannot be more than 5000 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'],
    required: [true, 'Job type is required']
  },
  location: {
    type: String,
    trim: true
  },
  locationType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite'
  },
  salaryRange: {
    min: {
      type: String
    },
    max: {
      type: String
    },
    currency: {
      type: String,
      default: 'INR'
    },
    period: {
      type: String,
      enum: ['year', 'month', 'hour'],
      default: 'year'
    },
    format: {
      type: String,
      enum: ['absolute', 'lpa'], // absolute = actual amount (e.g., 500000), lpa = lakhs per annum (e.g., 5)
      default: 'absolute'
    }
  },
  qualification: {
    type: [String],
    required: [true, 'Required qualification is required']
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required']
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  preferredSkills: {
    type: [String],
    default: []
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  maxApplicants: {
    type: Number
  },
  resumeRequired: {
    type: Boolean,
    default: true
  },
  allowMultipleApplications: {
    type: Boolean,
    default: false
  },
  defaultInterviewRounds: {
    type: [String],
    default: []
  },
  defaultInterviewer: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'closed'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  applicationsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Track when a draft becomes publicly active
jobSchema.add({
  publishedAt: { type: Date }
});

// Indexes for better performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ locationType: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ department: 1 });

// Virtual for days since posted
jobSchema.virtual('daysSincePosted').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtual fields are serialized
jobSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Job', jobSchema);