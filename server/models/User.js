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
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Applicant-specific fields
  profile: {
    summary: {
      type: String,
      maxlength: [1000, 'Summary cannot be more than 1000 characters']
    },
    resume: {
      fileName: String,
      fileUrl: String,
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
        default: 'USD'
      }
    }
  }
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
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