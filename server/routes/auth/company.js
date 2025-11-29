const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const Company = require('../../models/Company');
const PendingRegistration = require('../../models/PendingRegistration');
const { uploadCompanyLogo } = require('../../middleware/upload');
const router = express.Router();

// Helper: detect if current MongoDB deployment supports transactions (replica set or mongos)
async function supportsTransactions() {
  try {
    const admin = mongoose.connection.db.admin();
    // "hello" is preferred in modern servers; fallback to ismaster for compatibility
    let info;
    try {
      info = await admin.command({ hello: 1 });
    } catch (e) {
      info = await admin.command({ ismaster: 1 });
    }
    const isMongos = info?.msg === 'isdbgrid';
    const isReplicaSet = !!info?.setName;
    // logicalSessionTimeoutMinutes is required for transactions; standalone often lacks this
    const hasSessions = !!info?.logicalSessionTimeoutMinutes;
    return hasSessions && (isMongos || isReplicaSet);
  } catch (e) {
    return false;
  }
}

// @route   POST /api/auth/company/check-name
// @desc    Check if company name is available
// @access  Public
router.post('/check-name', async (req, res) => {
  try {
    const { companyName } = req.body;
    
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }
    
    // Check if company name already exists (case-insensitive)
    const existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') }
    });
    
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'A company with this name is already registered'
      });
    }
    
    return res.json({
      success: true,
      message: 'Company name is available'
    });
  } catch (error) {
    console.error('Check company name error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking company name'
    });
  }
});

// @route   POST /api/auth/company/register
// @desc    Register a new company with admin user
// @access  Public
router.post('/register', uploadCompanyLogo.single('companyLogo'), [
  // Company information validation
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('industry')
    .notEmpty()
    .withMessage('Industry is required'),
  body('companySize')
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid company size'),
  body('headquarters')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Headquarters must be between 2 and 100 characters'),
  body('country')
    .notEmpty()
    .withMessage('Country is required'),
  
  // Admin information validation
  body('adminFullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('adminEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('adminPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Optional fields validation
  body('website')
    .optional()
    .isURL()
    .withMessage('Please enter a valid website URL'),
  body('linkedinUrl')
    .optional()
    .isURL()
    .withMessage('Please enter a valid LinkedIn URL'),
  body('careersPageUrl')
    .optional()
    .isURL()
    .withMessage('Please enter a valid careers page URL'),
  body('adminPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('registrationNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Registration number must be less than 50 characters'),
  body('companyDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Company description must be less than 1000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    const {
      // Organization Details
      companyName,
      industry,
      companySize,
      headquarters,
      country = 'India',
      website,
      registrationNumber,
      
      // Admin HR Details
      adminFullName,
      adminEmail,
      adminPassword,
      adminPhone,
      
      // Additional Info
      companyDescription,
      linkedinUrl,
      careersPageUrl,
      hiringRegions,
      remotePolicy
    } = req.body;

    // Validation
    const requiredFields = {
      companyName: 'Company name is required',
      industry: 'Industry is required',
      companySize: 'Company size is required',
      headquarters: 'Headquarters location is required',
      adminFullName: 'Admin full name is required',
      adminEmail: 'Admin email is required',
      adminPassword: 'Admin password is required'
    };

    const missingFields = [];
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field] || req.body[field].trim() === '') {
        missingFields.push({ field, message });
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: missingFields
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        field: 'adminEmail'
      });
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        field: 'adminPassword'
      });
    }

    // Validate full name has at least first and last name
    const nameParts = adminFullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name (first and last name)',
        field: 'adminFullName'
      });
    }
    if (nameParts[0].length < 2 || nameParts[nameParts.length - 1].length < 2) {
      return res.status(400).json({
        success: false,
        message: 'First and last name must be at least 2 characters each',
        field: 'adminFullName'
      });
    }

    // Check if email already exists in active users
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        field: 'adminEmail'
      });
    }

    // Check if company name already exists
    const existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(`^${companyName}$`, 'i') }
    });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'A company with this name is already registered',
        field: 'companyName'
      });
    }

    // Check for pending registration with same email
    let pendingReg = await PendingRegistration.findOne({ email: adminEmail.toLowerCase(), type: 'company' });

    // Split admin full name (already validated above)
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Store company registration data temporarily (will be created after OTP verification)
    const companyDataToStore = {
      companyName: companyName.trim(),
      industry,
      companySize,
      headquarters,
      country,
      website: website || undefined,
      registrationNumber: registrationNumber || undefined,
      description: companyDescription || undefined,
      logo: req.file ? `/uploads/company-logos/${req.file.filename}` : undefined,
      socialLinks: {
        linkedin: linkedinUrl || undefined,
        careers: careersPageUrl || undefined
      },
      hiringRegions: hiringRegions ? (Array.isArray(hiringRegions) ? hiringRegions : [hiringRegions]) : [],
      remotePolicy: remotePolicy || undefined,
      adminFirstName: firstName,
      adminLastName: lastName,
      adminPassword: hashedPassword,
      adminPhone: adminPhone || undefined
    };

    if (pendingReg) {
      // Update existing pending registration
      pendingReg.companyData = companyDataToStore;
      pendingReg.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset expiry
      await pendingReg.save();
    } else {
      // Create new pending registration
      pendingReg = new PendingRegistration({
        email: adminEmail.toLowerCase(),
        type: 'company',
        companyData: companyDataToStore
      });
      await pendingReg.save();
    }

    // Return success - actual company/user will be created on OTP verification
    return res.status(200).json({
      success: true,
      message: 'Company registration initiated. Please verify your email with the OTP sent to your inbox.',
      data: {
        email: adminEmail.toLowerCase(),
        companyName: companyName.trim(),
        requiresVerification: true
      }
    });

  } catch (error) {
    console.error('Company registration error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = [];
      for (const field in error.errors) {
        validationErrors.push({
          field,
          message: error.errors[field].message
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'This information is already in use';
      
      if (field === 'email') {
        message = 'An account with this email already exists';
      } else if (field.includes('companyInfo.name')) {
        message = 'A company with this name is already registered';
      }

      return res.status(400).json({
        success: false,
        message,
        field
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/company/verify
// @desc    Verify company admin email
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and user ID are required'
      });
    }

    // TODO: Implement email verification logic
    // For now, just activate the account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.accountStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Find associated company
    const company = await Company.findById(user.companyId);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Associated company not found'
      });
    }

    // Update user and company; use transaction if supported, otherwise sequential
    const canTransactVerify = await supportsTransactions();
    if (canTransactVerify) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        user.accountStatus = 'active';
        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        await user.save({ session });

        company.status = 'active';
        company.verifiedAt = new Date();
        await company.save({ session });

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        try { await session.abortTransaction(); } catch (_) {}
        session.endSession();
        throw error;
      }
    } else {
      user.accountStatus = 'active';
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      company.status = 'active';
      company.verifiedAt = new Date();
      await company.save();
    }

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login to your account.',
      data: {
        userId: user._id,
        email: user.email,
        companyName: company.name,
        companyId: company._id
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification. Please try again.'
    });
  }
});

// @route   GET /api/auth/company/check-availability
// @desc    Check if company name or email is available
// @access  Public
router.get('/check-availability', async (req, res) => {
  try {
    const { type, value } = req.query;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: 'Type and value parameters are required'
      });
    }

    let isAvailable = true;
    let message = '';

    if (type === 'email') {
      const existingUser = await User.findOne({ email: value.toLowerCase() });
      isAvailable = !existingUser;
      message = isAvailable 
        ? 'Email is available' 
        : 'Email is already registered';
    } else if (type === 'company') {
      const existingCompany = await Company.findOne({ 
        name: { $regex: new RegExp(`^${value}$`, 'i') } 
      });
      isAvailable = !existingCompany;
      message = isAvailable 
        ? 'Company name is available' 
        : 'Company name is already taken';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Use "email" or "company"'
      });
    }

    res.json({
      success: true,
      available: isAvailable,
      message: message
    });

  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during availability check'
    });
  }
});

module.exports = router;