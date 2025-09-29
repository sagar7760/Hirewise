const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Company = require('../../models/Company');

// GET HR profile
exports.getProfile = async (req, res) => {
  try {
    // Check the raw user data to see what field exists
    const rawUser = await User.findById(req.user._id).select('-password').lean();
    
    // The issue is that user has companyId but model expects company
    // Let's manually fetch the company using companyId
    let company = null;
    if (rawUser.companyId) {
      company = await Company.findById(rawUser.companyId).select('name logo website').lean();
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
};

// PUT update HR profile
exports.updateProfile = async (req, res) => {
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

    // Ensure company fields are set (required for HR users)
    // The User model has both 'company' and 'companyId' fields, both are required
    // Use the existing companyId from the database record if req.user.companyId is not available
    const companyIdToUse = req.user.companyId || user.companyId;
    
    if (!user.company && companyIdToUse) {
      user.company = companyIdToUse;
    }
    if (!user.companyId && companyIdToUse) {
      user.companyId = companyIdToUse;
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
};

// PUT upload profile picture - using base64 database storage
exports.updateAvatar = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    // Validate base64 image data format
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format',
        message: 'Please upload only image files (JPEG, JPG, PNG, GIF)'
      });
    }

    // Check image size (base64 encoded images are ~33% larger than original)
    const base64Data = imageData.split(',')[1];
    const imageSizeBytes = (base64Data.length * 3) / 4;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (imageSizeBytes > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Profile picture must be smaller than 5MB'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Ensure company fields are set before saving
    const companyIdToUse = req.user.companyId || user.companyId;
    if (!user.company && companyIdToUse) {
      user.company = companyIdToUse;
    }
    if (!user.companyId && companyIdToUse) {
      user.companyId = companyIdToUse;
    }

    // Store base64 image data directly in database
    user.avatar = imageData;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      avatarData: imageData
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile picture',
      details: error.message
    });
  }
};

// PUT change password
exports.changePassword = async (req, res) => {
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
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password using findByIdAndUpdate to avoid version conflicts
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        password: hashedNewPassword,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    );

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
};

// Test route
exports.test = (req, res) => {
  res.json({ message: 'HR Profile controller is working' });
};

// Debug route to check current user
exports.debug = async (req, res) => {
  try {
    // Get user with password to check hash format
    const userWithPassword = await User.findById(req.user._id).select('+password');
    
    res.json({
      message: 'Debug route',
      user: req.user,
      passwordExists: !!userWithPassword?.password,
      passwordStartsWithBcrypt: userWithPassword?.password ? /^\$2[ab]\$/.test(userWithPassword.password) : false,
      passwordLength: userWithPassword?.password?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      message: 'Debug error',
      error: error.message
    });
  }
};