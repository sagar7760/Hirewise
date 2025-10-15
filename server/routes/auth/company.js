const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const Company = require('../../models/Company');
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

    // Check if email already exists
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

    // Split admin full name
    const nameParts = adminFullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Use transaction when supported; otherwise fallback to non-transactional flow with manual rollback
    const canTransact = await supportsTransactions();
    if (canTransact) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const company = new Company({
          name: companyName.trim(),
          industry,
          size: companySize,
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
          status: 'pending_verification'
        });

        const savedCompany = await company.save({ session });

        const adminUser = new User({
          firstName,
          lastName,
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          phone: adminPhone || undefined,
          role: 'admin',
          location: `${headquarters}, ${country}`,
          companyId: savedCompany._id,
          isCompanyAdmin: true,
          accountStatus: 'pending_verification',
          preferences: { emailNotifications: true, pushNotifications: true },
          permissions: {
            canManageUsers: true,
            canManageJobs: true,
            canManageCompany: true,
            canViewReports: true,
            canManageInterviewers: true
          }
        });

        const savedAdmin = await adminUser.save({ session });

        savedCompany.adminUserId = savedAdmin._id;
        await savedCompany.save({ session });

        await session.commitTransaction();
        session.endSession();

        const adminResponse = savedAdmin.toObject();
        delete adminResponse.password;

        return res.status(201).json({
          success: true,
          message: 'Company registered successfully! Please check your email for verification.',
          data: {
            company: { id: savedCompany._id, name: savedCompany.name, industry: savedCompany.industry, location: savedCompany.fullLocation },
            admin: { id: savedAdmin._id, firstName: adminResponse.firstName, lastName: adminResponse.lastName, email: adminResponse.email, role: adminResponse.role, isCompanyAdmin: adminResponse.isCompanyAdmin },
            nextSteps: [
              'Check your email for verification link',
              'Complete email verification',
              'Login to your admin dashboard',
              'Add HR users and interviewers'
            ]
          }
        });
      } catch (error) {
        try { await session.abortTransaction(); } catch (_) {}
        session.endSession();
        throw error;
      }
    } else {
      // Fallback: sequential operations with manual rollback
      let savedCompany;
      try {
        const company = new Company({
          name: companyName.trim(),
          industry,
          size: companySize,
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
          status: 'pending_verification'
        });

        savedCompany = await company.save();

        const adminUser = new User({
          firstName,
          lastName,
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          phone: adminPhone || undefined,
          role: 'admin',
          location: `${headquarters}, ${country}`,
          companyId: savedCompany._id,
          isCompanyAdmin: true,
          accountStatus: 'pending_verification',
          preferences: { emailNotifications: true, pushNotifications: true },
          permissions: {
            canManageUsers: true,
            canManageJobs: true,
            canManageCompany: true,
            canViewReports: true,
            canManageInterviewers: true
          }
        });

        const savedAdmin = await adminUser.save();
        savedCompany.adminUserId = savedAdmin._id;
        await savedCompany.save();

        const adminResponse = savedAdmin.toObject();
        delete adminResponse.password;

        return res.status(201).json({
          success: true,
          message: 'Company registered successfully! Please check your email for verification.',
          data: {
            company: { id: savedCompany._id, name: savedCompany.name, industry: savedCompany.industry, location: savedCompany.fullLocation },
            admin: { id: savedAdmin._id, firstName: adminResponse.firstName, lastName: adminResponse.lastName, email: adminResponse.email, role: adminResponse.role, isCompanyAdmin: adminResponse.isCompanyAdmin },
            nextSteps: [
              'Check your email for verification link',
              'Complete email verification',
              'Login to your admin dashboard',
              'Add HR users and interviewers'
            ]
          }
        });
      } catch (error) {
        // Manual rollback: if admin creation failed, delete the created company
        if (savedCompany?._id) {
          try { await Company.findByIdAndDelete(savedCompany._id); } catch (_) {}
        }
        throw error;
      }
    }

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