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

    const { firstName, lastName, email, password, role = 'applicant' } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role
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
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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
    const user = await User.findById(req.user.id).populate('companyId');
    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isCompanyAdmin: user.isCompanyAdmin,
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