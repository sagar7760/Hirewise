const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../../models/User');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

console.log('HR Profile routes module loaded'); // Debug log

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'HR Profile route is working' });
});

// Debug route to check current user
router.get('/debug', auth, (req, res) => {
  console.log('Debug route - User data:', req.user);
  res.json({
    message: 'Debug route',
    user: req.user
  });
});

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profile-pictures');
    try {
      await fs.access(uploadPath);
    } catch (error) {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadProfilePic = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET HR profile
router.get('/', auth, authorize('hr'), async (req, res) => {
  try {
    console.log('HR Profile GET request received'); // Debug log
    console.log('User from request:', req.user._id); // Debug log
    
    // Debug: Check if we have the Company model available
    const Company = require('../../models/Company');
    const allCompanies = await Company.find({}).select('name').lean();
    console.log('Available companies in DB:', allCompanies);
    
    // Check the raw user data to see what field exists
    const rawUser = await User.findById(req.user._id).select('-password').lean();
    console.log('Raw user company field:', rawUser.company);
    console.log('Raw user companyId field:', rawUser.companyId);
    
    // The issue is that user has companyId but model expects company
    // Let's manually fetch the company using companyId
    let company = null;
    if (rawUser.companyId) {
      company = await Company.findById(rawUser.companyId).select('name logo website').lean();
      console.log('Manually fetched company:', company);
    }
    
    // Fetch user with company population for complete data
    const user = await User.findById(req.user._id)
      .populate('company', 'name logo website')
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User with company data:', user); // Debug log
    console.log('Company field specifically:', user.company); // Debug company field
    
    const profile = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
      isActive: user.isActive,
      avatar: user.avatar,
      joiningDate: user.joiningDate,
      createdAt: user.createdAt,
      location: user.location,
      workLocation: user.workLocation,
      company: company ? {
        id: company._id,
        name: company.name,
        logo: company.logo,
        website: company.website
      } : null,
      notifications: user.notifications || {
        emailAlerts: true,
        interviewUpdates: true,
        applicationNotifications: true,
        weeklyReports: false
      }
    };

    console.log('Company variable before response:', company); // Debug company variable
    console.log('Profile company field:', profile.company); // Debug profile company field
    console.log('Sending profile response:', profile); // Debug log

    res.json({
      success: true,
      ...profile
    });

  } catch (error) {
    console.error('Error fetching HR profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
});

// PUT update HR profile
router.put('/', auth, authorize('hr'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      department,
      jobTitle,
      location,
      workLocation,
      notifications
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update allowed fields
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (department !== undefined) user.department = department.trim();
    if (jobTitle !== undefined) user.jobTitle = jobTitle.trim();
    if (location !== undefined) user.location = location.trim();
    if (workLocation !== undefined) user.workLocation = workLocation.trim();
    if (notifications !== undefined) user.notifications = notifications;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        department: updatedUser.department,
        jobTitle: updatedUser.jobTitle,
        isActive: updatedUser.isActive,
        avatar: updatedUser.avatar,
        joiningDate: updatedUser.joiningDate,
        location: updatedUser.location,
        workLocation: updatedUser.workLocation,
        notifications: updatedUser.notifications
      }
    });

  } catch (error) {
    console.error('Error updating HR profile:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

// PUT upload profile picture
router.put('/avatar', auth, authorize('hr'), uploadProfilePic.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete old profile picture if it exists
    if (user.avatar) {
      try {
        const oldFilePath = path.join(__dirname, '../../uploads/profile-pictures', user.avatar);
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.log('Old profile picture not found or could not be deleted');
      }
    }

    // Update user with new avatar filename
    user.avatar = req.file.filename;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      avatarPath: req.file.filename
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile picture',
      details: error.message
    });
  }
});

// PUT change password
router.put('/change-password', auth, authorize('hr'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: error.message
    });
  }
});

module.exports = router;