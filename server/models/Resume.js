const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // File information
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  },
  
  // Parsed data from resume
  parsedData: {
    // Basic info
    fullName: String,
    email: String,
    phone: String,
    currentLocation: String,
    
    // Skills
    primarySkills: [String],
    
    // Education entries
    educationEntries: [{
      qualification: String,
      fieldOfStudy: String,
      universityName: String,
      graduationYear: String,
      cgpaPercentage: String
    }],
    
    // Work experience entries
    workExperienceEntries: [{
      company: String,
      position: String,
      startDate: String,
      endDate: String,
      isCurrentlyWorking: Boolean,
      description: String,
      yearsOfExperience: String
    }],
    
    // Raw extracted text
    rawText: String
  },
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Processing metadata
  processingErrors: [String],
  processingCompletedAt: Date,
  
  // Version tracking
  version: {
    type: Number,
    default: 1
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
resumeSchema.index({ userId: 1, isActive: 1 });
resumeSchema.index({ processingStatus: 1 });
resumeSchema.index({ createdAt: -1 });

// Virtual for file path
resumeSchema.virtual('filePath').get(function() {
  return this.fileUrl;
});

// Static methods
resumeSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

resumeSchema.statics.findLatestByUser = function(userId) {
  return this.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
};

resumeSchema.statics.findPendingProcessing = function() {
  return this.find({ processingStatus: 'pending' });
};

// Instance methods
resumeSchema.methods.markAsProcessing = function() {
  this.processingStatus = 'processing';
  return this.save();
};

resumeSchema.methods.markAsCompleted = function(parsedData) {
  this.processingStatus = 'completed';
  this.parsedData = parsedData;
  this.processingCompletedAt = new Date();
  return this.save();
};

resumeSchema.methods.markAsFailed = function(errors) {
  this.processingStatus = 'failed';
  this.processingErrors = Array.isArray(errors) ? errors : [errors];
  return this.save();
};

resumeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Pre-save middleware
resumeSchema.pre('save', function(next) {
  // Increment version if parsedData is modified
  if (this.isModified('parsedData') && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Ensure virtual fields are serialized
resumeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Resume', resumeSchema);