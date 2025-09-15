const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Job description cannot be more than 5000 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  workType: {
    type: String,
    enum: ['remote', 'hybrid', 'on-site'],
    required: [true, 'Work type is required']
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: [true, 'Job type is required']
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead'],
    required: [true, 'Experience level is required']
  },
  salary: {
    min: {
      type: Number,
      required: [true, 'Minimum salary is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum salary is required']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  requirements: {
    type: [String],
    required: [true, 'Job requirements are required']
  },
  skills: {
    type: [String],
    required: [true, 'Required skills are required']
  },
  benefits: [String],
  department: {
    type: String,
    trim: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'on-hold'],
    default: 'draft'
  },
  applicationDeadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  isUrgent: {
    type: Boolean,
    default: false
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

// Indexes for better performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ workType: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ postedBy: 1 });

// Virtual for salary range display
jobSchema.virtual('salaryRange').get(function() {
  return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()}`;
});

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