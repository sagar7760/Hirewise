const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // Basic Company Information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters'],
    unique: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
      'Information Technology',
      'Technology', // Added alias for backwards compatibility
      'Financial Services', 
      'Healthcare',
      'Manufacturing',
      'E-commerce',
      'Education',
      'Consulting',
      'Real Estate',
      'Media & Entertainment',
      'Automotive',
      'Retail',
      'Food & Beverage',
      'Telecommunications',
      'Energy',
      'Other'
    ]
  },
  size: {
    type: String,
    required: [true, 'Company size is required'],
    enum: [
      '1-10 employees',
      '11-50 employees', 
      '51-200 employees',
      '201-500 employees',
      '501-1000 employees',
      '1000+ employees',
      '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+' // Added short format aliases
    ]
  },
  headquarters: {
    type: String,
    required: [true, 'Headquarters location is required'],
    trim: true
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },

  // Contact & Web Presence
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL starting with http:// or https://'
    }
  },
  registrationNumber: {
    type: String,
    trim: true,
    sparse: true // Allows multiple documents with null/undefined values
  },

  // Company Profile
  description: {
    type: String,
    maxlength: [1000, 'Company description cannot be more than 1000 characters'],
    trim: true
  },
  logo: {
    type: String, // Simple string to store file path
    trim: true
  },

  // Address Information
  address: {
    street: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    zipCode: {
      type: String,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },

  // Contact Information
  contact: {
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // Social Media & Career Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?linkedin\.com\/company\/.+/.test(v);
        },
        message: 'LinkedIn URL must be a valid LinkedIn company page URL'
      }
    },
    careers: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Careers page must be a valid URL'
      }
    }
  },

  // Hiring Information
  hiringRegions: {
    type: [String], // Array of strings to support multiple regions
    default: []
  },
  remotePolicy: {
    type: String,
    enum: ['Fully Remote', 'Hybrid (Remote + Office)', 'On-site Only', 'Flexible', 'Hybrid', ''],
    default: ''
  },

  // Company Settings (managed by admin)
  settings: {
    autoApproveApplications: {
      type: Boolean,
      default: false
    },
    allowPublicJobPosting: {
      type: Boolean,
      default: true
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    requireInterviewFeedback: {
      type: Boolean,
      default: true
    },
    // Legacy fields for backwards compatibility
    emailNotifications: {
      type: Boolean,
      default: true
    },
    requireApprovalForJobs: {
      type: Boolean,
      default: false
    },
    allowPublicJobViewing: {
      type: Boolean,
      default: true
    },
    autoArchiveJobsAfterDays: {
      type: Number,
      default: 90
    }
  },

  // Admin Management
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Will be set after admin user creation
  },

  // Company Status & Verification
  status: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'inactive'],
    default: 'pending_verification'
  },
  verificationStatus: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    documentsVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Statistics & Metrics
  stats: {
    totalEmployees: {
      type: Number,
      default: 0
    },
    totalJobs: {
      type: Number,
      default: 0
    },
    totalApplications: {
      type: Number,
      default: 0
    },
    totalHires: {
      type: Number,
      default: 0
    }
  },

  // Subscription & Usage (for future)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    maxJobs: {
      type: Number,
      default: 5
    },
    maxUsers: {
      type: Number,
      default: 3
    },
    features: [{
      type: String
    }],
    expiresAt: Date
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ headquarters: 1 });
companySchema.index({ status: 1 });
companySchema.index({ adminUserId: 1 });
companySchema.index({ createdAt: -1 });

// Virtual for full location
companySchema.virtual('fullLocation').get(function() {
  return `${this.headquarters}, ${this.country}`;
});

// Virtual for employee count range
companySchema.virtual('employeeRange').get(function() {
  return this.size;
});

// Virtual to get total team members (HR + Interviewers)
companySchema.virtual('totalTeamMembers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'companyId',
  count: true
});

// Pre-save middleware
companySchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Ensure name is properly formatted
  if (this.name) {
    this.name = this.name.trim();
  }
  
  next();
});

// Static methods
companySchema.statics.findByAdmin = function(adminUserId) {
  return this.findOne({ adminUserId });
};

companySchema.statics.findActiveCompanies = function() {
  return this.find({ status: 'active' });
};

companySchema.statics.getCompanyStats = function(companyId) {
  return this.findById(companyId).select('stats');
};

// Instance methods
companySchema.methods.isActive = function() {
  return this.status === 'active';
};

companySchema.methods.isPending = function() {
  return this.status === 'pending_verification';
};

companySchema.methods.canPostJobs = function() {
  return this.isActive() && this.stats.totalJobs < this.subscription.maxJobs;
};

companySchema.methods.canAddUsers = function() {
  return this.isActive(); // Can be enhanced with subscription limits
};

companySchema.methods.updateStats = async function(statType, increment = 1) {
  this.stats[statType] += increment;
  await this.save();
};

// Error handling for unique constraint
companySchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Company name already exists'));
  } else {
    next(error);
  }
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;