const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../../models/User');
const PendingRegistration = require('../../models/PendingRegistration');

// @desc    Register user
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      fullName, 
      email, 
      password, 
      phone, 
      currentLocation,
      educationEntries,
      currentStatus,
      primarySkills,
      workExperienceEntries,
      role = 'applicant' 
    } = req.body;

    // Check if user already exists (active account)
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if there's already a pending registration
    let pendingReg = await PendingRegistration.findOne({ email, type: 'applicant' });
    
    // Split fullName into firstName and lastName
    const nameParts = fullName ? fullName.trim().split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Parse arrays if they're strings (from FormData)
    let parsedEducationEntries = [];
    let parsedWorkExperienceEntries = [];
    let parsedPrimarySkills = [];

    try {
      parsedEducationEntries = typeof educationEntries === 'string' 
        ? JSON.parse(educationEntries) 
        : educationEntries || [];
      parsedWorkExperienceEntries = typeof workExperienceEntries === 'string' 
        ? JSON.parse(workExperienceEntries) 
        : workExperienceEntries || [];
      parsedPrimarySkills = typeof primarySkills === 'string' 
        ? JSON.parse(primarySkills) 
        : primarySkills || [];
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    const userData = {
      firstName,
      lastName,
      password: hashedPassword,
      phone,
      role,
      profile: {
        fullName,
        currentLocation,
        currentStatus,
        educationEntries: parsedEducationEntries,
        workExperienceEntries: parsedWorkExperienceEntries,
        primarySkills: parsedPrimarySkills
      }
    };

    // Handle resume file if provided
    let resumeData = null;
    if (req.file) {
      console.log('Resume file received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer
      });
      
      resumeData = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileData: req.file.buffer,
        fileSize: req.file.size
      };
    } else {
      console.log('No resume file in request');
    }

    // Store registration data temporarily (will be created after OTP verification)
    if (pendingReg) {
      // Update existing pending registration
      pendingReg.userData = userData;
      pendingReg.resumeData = resumeData;
      pendingReg.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset expiry
      await pendingReg.save();
    } else {
      // Create new pending registration
      pendingReg = new PendingRegistration({
        email,
        type: 'applicant',
        userData: userData,
        resumeData: resumeData
      });
      await pendingReg.save();
    }

    console.log('Pending registration saved with resume:', !!resumeData);

    // Return success - actual user will be created on OTP verification
    res.status(200).json({
      success: true,
      message: 'Registration initiated. Please verify your email with the OTP sent to your inbox.',
      data: {
        email: email,
        requiresVerification: true,
        resumeUploaded: !!resumeData
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Authenticate user & get token
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user and populate company information
    let user = await User.findOne({ email }).select('+password').populate('company');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If company wasn't populated but companyId exists, fetch it separately
    if (!user.company && user.companyId) {
      const Company = require('../../models/Company');
      user.company = await Company.findById(user.companyId);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Block login if account not verified
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email to continue.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
        data: { email: user.email }
      });
    }

    // Create JWT token with minimal payload to reduce size
    const payload = {
      id: user.id,
      role: user.role,
      companyId: user.company?._id || user.companyId,
      isCompanyAdmin: user.isCompanyAdmin
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Fetch complete user profile data including resume
    const Resume = require('../../models/Resume');
    let currentResume = null;
    if (user.profile?.currentResumeId || user.currentResumeId) {
      currentResume = await Resume.findOne({
        _id: user.profile?.currentResumeId || user.currentResumeId,
        userId: user._id,
        isActive: true
      }).select('-fileData');
    }

    // Determine company data - handle both company and companyId fields
    const companyData = user.company ? {
      id: user.company._id || user.company,
      name: user.company.name || 'Company',
      domain: user.company.domain || null
    } : (user.companyId ? {
      id: user.companyId,
      name: 'Company', // Fallback name if company not populated
      domain: null
    } : null);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isCompanyAdmin: user.isCompanyAdmin,
        profilePicture: user.profilePicture,
        avatar: user.avatar,
        companyId: user.company?._id || user.companyId, // Add companyId for reference
        // Include complete profile data for dashboard calculations
        profile: {
          currentLocation: user.profile?.currentLocation || user.location,
          summary: user.profile?.summary,
          primarySkills: user.profile?.primarySkills || user.skills || [],
          educationEntries: user.profile?.educationEntries || [],
          workExperienceEntries: user.profile?.workExperienceEntries || [],
          projects: user.profile?.projects || [],
          currentResumeId: currentResume?._id || user.profile?.currentResumeId || user.currentResumeId,
          resume: currentResume ? { fileName: currentResume.originalName } : null
        },
        // Add top-level references for easier access
        skills: user.profile?.primarySkills || user.skills || [],
        currentResumeId: currentResume?._id || user.profile?.currentResumeId || user.currentResumeId,
        resumeAvailable: !!currentResume,
        company: companyData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @access  Private
const getMe = async (req, res) => {
  try {
    // The auth middleware already loads the user, so we can use it directly
    // But let's refetch to ensure we have the latest data and populate company
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).populate('companyId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isCompanyAdmin: user.isCompanyAdmin,
        profilePicture: user.profilePicture,
        avatar: user.avatar,
        profile: user.profile, // Include the profile data we added
        company: user.companyId ? {
          id: user.companyId._id,
          name: user.companyId.name,
          domain: user.companyId.domain
        } : null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user (client-side token removal)
// @access  Private
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};