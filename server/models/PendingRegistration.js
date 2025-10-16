const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['applicant', 'company'], 
    required: true 
  },
  // For applicant registration
  userData: {
    firstName: String,
    lastName: String,
    password: String, // Already hashed
    phone: String,
    role: String,
    profile: {
      fullName: String,
      currentLocation: String,
      currentStatus: String,
      educationEntries: [Object],
      workExperienceEntries: [Object],
      primarySkills: [String]
    }
  },
  // For company registration
  companyData: {
    companyName: String,
    industry: String,
    companySize: String,
    headquarters: String,
    country: String,
    website: String,
    registrationNumber: String,
    description: String,
    logo: String,
    socialLinks: {
      linkedin: String,
      careers: String
    },
    hiringRegions: [String],
    remotePolicy: String,
    // Admin user data
    adminFirstName: String,
    adminLastName: String,
    adminPassword: String, // Already hashed
    adminPhone: String
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, { 
  timestamps: true 
});

// Auto-delete expired pending registrations
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
