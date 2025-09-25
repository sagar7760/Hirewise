const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant ID is required']
  },
  status: {
    type: String,
    enum: [
      'submitted',           // Initial application
      'under_review',        // HR reviewing
      'shortlisted',         // Passed initial screening
      'interview_scheduled', // Interview scheduled
      'interviewed',         // Interview completed
      'offer_extended',      // Job offer made
      'offer_accepted',      // Candidate accepted offer
      'offer_declined',      // Candidate declined offer
      'rejected',            // Application rejected
      'withdrawn'            // Candidate withdrew
    ],
    default: 'submitted'
  },
  // Personal information from application form
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    }
  },
  // Resume handling - profile vs custom
  useProfileResume: {
    type: Boolean,
    default: true
  },
  profileResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  customResume: {
    fileName: String,
    fileUrl: String,
    fileData: Buffer,
    fileMimeType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileSize: Number
  },
  // Professional information
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    enum: ['fresher', 'mid-level', 'senior', 'expert']
  },
  expectedSalary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot be more than 2000 characters']
  },
  // AI Analysis results
  aiAnalysis: {
    resumeScore: {
      type: Number,
      min: 0,
      max: 100
    },
    skillsMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    experienceMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    keyStrengths: [String],
    potentialConcerns: [String],
    recommendedQuestions: [String],
    analysisDate: {
      type: Date,
      default: Date.now
    },
    // Parsed document information
    extractedInfo: {
      personalInfo: {
        name: String,
        title: String
      },
      contactInfo: {
        email: String,
        phone: String,
        linkedin: String,
        github: String
      },
      skills: [String],
      education: [{
        degree: String,
        institution: String,
        year: String
      }],
      workExperience: [{
        company: String,
        position: String,
        duration: String,
        achievements: [String]
      }],
      projects: [{
        name: String,
        description: String,
        technologies: [String]
      }],
      certifications: [String]
    },
    // Document parsing metadata
    documentMetadata: {
      fileSize: Number,
      fileName: String,
      fileType: String,
      extractedAt: Date,
      pages: Number,
      wordCount: Number,
      characterCount: Number
    },
    // Parsing validation results
    validation: {
      isValid: Boolean,
      warnings: [String],
      confidence: Number
    }
  },
  // Application timeline
  timeline: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // HR notes and comments
  notes: [{
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot be more than 1000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  // Interview information
  interviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  // Source tracking
  source: {
    type: String,
    enum: ['website', 'job_board', 'referral', 'social_media', 'recruiter', 'other'],
    default: 'website'
  },
  referralInfo: {
    referredBy: String,
    referralBonus: Number
  }
}, {
  timestamps: true
});

// Indexes for better performance
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'aiAnalysis.overallScore': -1 });

// Virtual for application age in days
applicationSchema.virtual('daysOld').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for applicant full name
applicationSchema.virtual('applicantFullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Pre-save middleware to update timeline
applicationSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      date: new Date()
    });
  }
  next();
});

// Ensure virtual fields are serialized
applicationSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Application', applicationSchema);