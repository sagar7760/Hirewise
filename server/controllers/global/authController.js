const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../../models/User');

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

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

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

    // Create user with enhanced profile data
    user = new User({
      firstName,
      lastName,
      email,
      password,
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
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT token
    const payload = {
      id: user.id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.profile.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: {
          currentLocation: user.profile.currentLocation,
          currentStatus: user.profile.currentStatus,
          educationEntries: user.profile.educationEntries,
          workExperienceEntries: user.profile.workExperienceEntries,
          primarySkills: user.profile.primarySkills
        },
        profilePicture: user.profilePicture,
        avatar: user.avatar
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
    const user = await User.findOne({ email }).select('+password').populate('company');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token with minimal payload to reduce size
    const payload = {
      id: user.id,
      role: user.role,
      companyId: user.company?._id,
      isCompanyAdmin: user.isCompanyAdmin
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isCompanyAdmin: user.isCompanyAdmin,
        profilePicture: user.profilePicture,
        avatar: user.avatar,
        company: user.company ? {
          id: user.company._id,
          name: user.company.name,
          domain: user.company.domain
        } : null
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