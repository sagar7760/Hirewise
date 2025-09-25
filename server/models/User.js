const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['applicant', 'hr', 'interviewer', 'admin'],
    default: 'applicant'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.role === 'hr' || this.role === 'interviewer' || this.role === 'admin';
    }
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },

  // Additional profile fields
  dateOfBirth: {
    type: Date,
    default: null
  },
  jobTitle: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: null
  },
  reportingTo: {
    type: String,
    trim: true
  },
  workLocation: {
    type: String,
    trim: true
  },

  // Contact information
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },

  // Emergency contact
  emergencyContactName: {
    type: String,
    trim: true
  },
  emergencyContactRelationship: {
    type: String,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    trim: true
  },

  // Notification preferences
  notifications: {
    emailAlerts: {
      type: Boolean,
      default: true
    },
    interviewUpdates: {
      type: Boolean,
      default: true
    },
    applicationNotifications: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: false
    }
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  weeklyReports: {
    type: Boolean,
    default: true
  },

  // User preferences
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  language: {
    type: String,
    default: 'English'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },

  // Security settings
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  lastPasswordChange: {
    type: Date,
    default: null
  },
  loginHistory: [{
    date: String,
    time: String,
    location: String,
    device: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Company Association (for admin, hr, interviewer roles)
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
    required: function() {
      return ['admin', 'hr', 'interviewer'].includes(this.role);
    }
  },
  isCompanyAdmin: {
    type: Boolean,
    default: false,
    required: function() {
      return this.role === 'admin';
    }
  },

  // User Status & Verification
  accountStatus: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'inactive'],
    default: function() {
      return this.role === 'applicant' ? 'active' : 'pending_verification';
    }
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  
  // Admin/HR/Interviewer specific fields
  permissions: {
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageJobs: {
      type: Boolean,
      default: false
    },
    canManageCompany: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: false
    },
    canManageInterviewers: {
      type: Boolean,
      default: false
    }
  },

  // Interviewer specific fields
  assignedCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  interviewerProfile: {
    expertise: [String],
    experienceYears: Number,
    availability: {
      monday: { available: Boolean, timeSlots: [String] },
      tuesday: { available: Boolean, timeSlots: [String] },
      wednesday: { available: Boolean, timeSlots: [String] },
      thursday: { available: Boolean, timeSlots: [String] },
      friday: { available: Boolean, timeSlots: [String] },
      saturday: { available: Boolean, timeSlots: [String] },
      sunday: { available: Boolean, timeSlots: [String] }
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Applicant-specific fields
  profile: {
    // Enhanced signup fields
    fullName: {
      type: String,
      trim: true
    },
    currentLocation: {
      type: String,
      trim: true
    },
    currentStatus: {
      type: String,
      trim: true
    },
    
    // Education entries (multiple)
    educationEntries: [{
      qualification: String,
      fieldOfStudy: String,
      universityName: String,
      graduationYear: String,
      cgpaPercentage: String
    }],
    
    // Work experience entries (multiple)
    workExperienceEntries: [{
      company: String,
      position: String,
      startDate: String,
      endDate: String,
      isCurrentlyWorking: {
        type: Boolean,
        default: false
      },
      description: String,
      yearsOfExperience: String
    }],
    
    // Skills (multiple)
    primarySkills: [String],
    
    // Resume reference
    currentResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    
    // Original fields
    summary: {
      type: String,
      maxlength: [1000, 'Summary cannot be more than 1000 characters']
    },
    resume: {
      fileName: String,
      uploadDate: Date,
      fileSize: Number
    },
    education: [{
      institution: String,
      degree: String,
      graduationDate: String,
      description: String
    }],
    workExperience: [{
      company: String,
      position: String,
      duration: String,
      description: String,
      startDate: Date,
      endDate: Date,
      isCurrentJob: {
        type: Boolean,
        default: false
      }
    }],
    skills: [String],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      startDate: Date,
      endDate: Date
    }],
    preferredJobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship']
    },
    expectedSalary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    }
  },
  
  // Saved Jobs for Applicants
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  
  // Metadata for saved jobs (when they were saved)
  savedJobsMetadata: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ companyId: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ isCompanyAdmin: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if user is company-related
userSchema.virtual('isCompanyUser').get(function() {
  return ['admin', 'hr', 'interviewer'].includes(this.role);
});

// Static methods
userSchema.statics.findByCompany = function(companyId) {
  return this.find({ companyId });
};

userSchema.statics.findCompanyAdmin = function(companyId) {
  return this.findOne({ companyId, isCompanyAdmin: true });
};

userSchema.statics.findActiveUsers = function(role = null) {
  const query = { accountStatus: 'active' };
  if (role) query.role = role;
  return this.find(query);
};

// Instance methods
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

userSchema.methods.isHR = function() {
  return this.role === 'hr';
};

userSchema.methods.isInterviewer = function() {
  return this.role === 'interviewer';
};

userSchema.methods.isApplicant = function() {
  return this.role === 'applicant';
};

userSchema.methods.isVerified = function() {
  return this.accountStatus === 'active' && this.emailVerifiedAt !== null;
};

userSchema.methods.canManageCompany = function() {
  return this.isCompanyAdmin && this.permissions.canManageCompany;
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Set admin permissions for company admin
  if (this.role === 'admin' && this.isCompanyAdmin) {
    this.permissions = {
      canManageUsers: true,
      canManageJobs: true,
      canManageCompany: true,
      canViewReports: true,
      canManageInterviewers: true
    };
  }
  
  // Set default HR permissions
  if (this.role === 'hr' && !this.permissions.canManageJobs) {
    this.permissions.canManageJobs = true;
  }
  
  next();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);