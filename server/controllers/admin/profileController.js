const User = require('../../models/User');

// @desc    Get admin profile
// @access  Private (Admin only)
const getProfile = async (req, res) => {
  try {
    console.log('Admin profile route - User data:', {
      id: req.user._id,
      role: req.user.role,
      companyId: req.user.companyId
    });

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Fetch admin user data
    const adminUser = await User.findById(req.user._id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    console.log('Admin user found:', adminUser.firstName, adminUser.lastName);
    console.log('Admin user company fields:', {
      company: adminUser.company,
      companyId: adminUser.companyId,
      reqUserCompanyId: req.user.companyId
    });

    // Build profile response matching frontend structure
    const profileData = {
      personalInfo: {
        firstName: adminUser.firstName || '',
        lastName: adminUser.lastName || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        dateOfBirth: adminUser.dateOfBirth ? adminUser.dateOfBirth.toISOString().split('T')[0] : '',
        avatar: adminUser.avatar || null  // Return full base64 data for display
      },
      professionalInfo: {
        jobTitle: adminUser.jobTitle || 'System Administrator',
        department: adminUser.department || 'IT & Operations',
        employeeId: adminUser.employeeId || 'ADM001',
        joiningDate: adminUser.joiningDate ? adminUser.joiningDate.toISOString().split('T')[0] : (adminUser.createdAt ? adminUser.createdAt.toISOString().split('T')[0] : ''),
        reportingTo: adminUser.reportingTo || 'CEO',
        workLocation: adminUser.workLocation || ''
      },
      contactInfo: {
        address: adminUser.address || '',
        city: adminUser.city || '',
        state: adminUser.state || '',
        zipCode: adminUser.zipCode || '',
        country: adminUser.country || 'United States',
        emergencyContact: {
          name: adminUser.emergencyContactName || '',
          relationship: adminUser.emergencyContactRelationship || '',
          phone: adminUser.emergencyContactPhone || ''
        }
      },
      preferences: {
        timezone: adminUser.timezone || 'America/Los_Angeles',
        language: adminUser.language || 'English',
        dateFormat: adminUser.dateFormat || 'MM/DD/YYYY',
        notifications: {
          email: adminUser.emailNotifications !== false,
          sms: adminUser.smsNotifications || false,
          push: adminUser.pushNotifications !== false,
          weeklyReports: adminUser.weeklyReports !== false
        }
      },
      security: {
        twoFactorEnabled: adminUser.twoFactorEnabled || false,
        lastPasswordChange: adminUser.lastPasswordChange ? adminUser.lastPasswordChange.toISOString().split('T')[0] : (adminUser.createdAt ? adminUser.createdAt.toISOString().split('T')[0] : ''),
        loginHistory: adminUser.loginHistory || []
      }
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update admin profile
// @access  Private (Admin only)
const updateProfile = async (req, res) => {
  try {
    console.log('Admin profile update - User data:', {
      id: req.user._id,
      role: req.user.role
    });

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const adminUser = await User.findById(req.user._id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Parse JSON data from request body
    let updateData = {};
    if (req.body.profileData) {
      updateData = JSON.parse(req.body.profileData);
    } else {
      updateData = req.body;
    }

    console.log('Update data received:', updateData);

    // Update personal info
    if (updateData.personalInfo) {
      const personal = updateData.personalInfo;
      adminUser.firstName = personal.firstName || adminUser.firstName;
      adminUser.lastName = personal.lastName || adminUser.lastName;
      adminUser.email = personal.email || adminUser.email;
      adminUser.phone = personal.phone || adminUser.phone;
      adminUser.dateOfBirth = personal.dateOfBirth || adminUser.dateOfBirth;
    }

    // Update professional info
    if (updateData.professionalInfo) {
      const professional = updateData.professionalInfo;
      adminUser.jobTitle = professional.jobTitle || adminUser.jobTitle;
      adminUser.department = professional.department || adminUser.department;
      adminUser.employeeId = professional.employeeId || adminUser.employeeId;
      adminUser.joiningDate = professional.joiningDate || adminUser.joiningDate;
      adminUser.reportingTo = professional.reportingTo || adminUser.reportingTo;
      adminUser.workLocation = professional.workLocation || adminUser.workLocation;
    }

    // Update contact info
    if (updateData.contactInfo) {
      const contact = updateData.contactInfo;
      adminUser.address = contact.address || adminUser.address;
      adminUser.city = contact.city || adminUser.city;
      adminUser.state = contact.state || adminUser.state;
      adminUser.zipCode = contact.zipCode || adminUser.zipCode;
      adminUser.country = contact.country || adminUser.country;
      
      if (contact.emergencyContact) {
        adminUser.emergencyContactName = contact.emergencyContact.name || adminUser.emergencyContactName;
        adminUser.emergencyContactRelationship = contact.emergencyContact.relationship || adminUser.emergencyContactRelationship;
        adminUser.emergencyContactPhone = contact.emergencyContact.phone || adminUser.emergencyContactPhone;
      }
    }

    // Update preferences
    if (updateData.preferences) {
      const prefs = updateData.preferences;
      adminUser.timezone = prefs.timezone || adminUser.timezone;
      adminUser.language = prefs.language || adminUser.language;
      adminUser.dateFormat = prefs.dateFormat || adminUser.dateFormat;
      
      if (prefs.notifications) {
        adminUser.emailNotifications = prefs.notifications.email;
        adminUser.smsNotifications = prefs.notifications.sms;
        adminUser.pushNotifications = prefs.notifications.push;
        adminUser.weeklyReports = prefs.notifications.weeklyReports;
      }
    }

    // Ensure company fields are set (required for admin users)
    // The User model has both 'company' and 'companyId' fields, both are required
    // Use the existing companyId from the database record if req.user.companyId is not available
    const companyIdToUse = req.user.companyId || adminUser.companyId;
    
    if (!adminUser.company && companyIdToUse) {
      adminUser.company = companyIdToUse;
      console.log('Setting company field to:', companyIdToUse);
    }
    if (!adminUser.companyId && companyIdToUse) {
      adminUser.companyId = companyIdToUse;
      console.log('Setting companyId field to:', companyIdToUse);
    }

    console.log('Admin user before save:', {
      id: adminUser._id,
      email: adminUser.email,
      company: adminUser.company,
      companyId: adminUser.companyId,
      reqUserCompanyId: req.user.companyId,
      companyIdToUse: companyIdToUse
    });

    // Handle avatar upload (prioritize base64, then convert file upload to base64)
    if (updateData.personalInfo && updateData.personalInfo.avatar && updateData.personalInfo.avatar.startsWith('data:image/')) {
      // Base64 data provided in JSON
      const avatarData = updateData.personalInfo.avatar;
      
      // Check image size (base64 encoded images are ~33% larger than original)
      const base64Data = avatarData.split(',')[1];
      const imageSizeBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      if (imageSizeBytes <= maxSizeBytes) {
        adminUser.avatar = avatarData;
        console.log('Avatar updated with base64 data (size:', Math.round(imageSizeBytes / 1024), 'KB)');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Profile picture must be smaller than 5MB'
        });
      }
    } else if (req.file) {
      // Convert uploaded file to base64 and store in database
      const fs = require('fs');
      const path = require('path');
      
      try {
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = req.file.mimetype;
        const base64Data = fileBuffer.toString('base64');
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        
        adminUser.avatar = dataUri;
        console.log('Avatar converted to base64 and saved to database (file:', req.file.filename, ', size:', Math.round(fileBuffer.length / 1024), 'KB)');
        
        // Delete the temporary file since we're storing in database
        fs.unlinkSync(filePath);
        console.log('Temporary file deleted:', filePath);
        
      } catch (error) {
        console.error('Error converting file to base64:', error);
        // Fallback to legacy file storage
        adminUser.avatar = req.file.filename;
        console.log('Avatar uploaded (legacy fallback):', req.file.filename);
      }
    }

    // Save updated user
    await adminUser.save();

    // Return updated profile data
    const updatedProfileData = {
      personalInfo: {
        firstName: adminUser.firstName || '',
        lastName: adminUser.lastName || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        dateOfBirth: adminUser.dateOfBirth ? adminUser.dateOfBirth.toISOString().split('T')[0] : '',
        avatar: adminUser.avatar ? (adminUser.avatar.startsWith('data:image/') ? 'base64_stored' : adminUser.avatar) : null  // Don't send full base64 in response
      },
      professionalInfo: {
        jobTitle: adminUser.jobTitle || 'System Administrator',
        department: adminUser.department || 'IT & Operations',
        employeeId: adminUser.employeeId || 'ADM001',
        joiningDate: adminUser.joiningDate ? adminUser.joiningDate.toISOString().split('T')[0] : (adminUser.createdAt ? adminUser.createdAt.toISOString().split('T')[0] : ''),
        reportingTo: adminUser.reportingTo || 'CEO',
        workLocation: adminUser.workLocation || ''
      },
      contactInfo: {
        address: adminUser.address || '',
        city: adminUser.city || '',
        state: adminUser.state || '',
        zipCode: adminUser.zipCode || '',
        country: adminUser.country || 'United States',
        emergencyContact: {
          name: adminUser.emergencyContactName || '',
          relationship: adminUser.emergencyContactRelationship || '',
          phone: adminUser.emergencyContactPhone || ''
        }
      },
      preferences: {
        timezone: adminUser.timezone || 'America/Los_Angeles',
        language: adminUser.language || 'English',
        dateFormat: adminUser.dateFormat || 'MM/DD/YYYY',
        notifications: {
          email: adminUser.emailNotifications !== false,
          sms: adminUser.smsNotifications || false,
          push: adminUser.pushNotifications !== false,
          weeklyReports: adminUser.weeklyReports !== false
        }
      },
      security: {
        twoFactorEnabled: adminUser.twoFactorEnabled || false,
        lastPasswordChange: adminUser.lastPasswordChange ? adminUser.lastPasswordChange.toISOString().split('T')[0] : (adminUser.createdAt ? adminUser.createdAt.toISOString().split('T')[0] : ''),
        loginHistory: adminUser.loginHistory || []
      }
    };

    console.log('Profile updated successfully for user:', adminUser.firstName, adminUser.lastName);
    console.log('Response data being sent:', { 
      success: true, 
      message: 'Profile updated successfully', 
      avatarStored: !!adminUser.avatar,
      responseSize: 'optimized' 
    });

    res.json({
      success: true,
      status: 'ok',
      data: updatedProfileData,
      message: 'Profile updated successfully',
      avatarUpdated: !!adminUser.avatar && adminUser.avatar.startsWith('data:image/'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update admin avatar (profile picture)
// @access  Private (Admin only)
const updateAvatar = async (req, res) => {
  try {
    console.log('Admin avatar update - User data:', {
      id: req.user._id,
      role: req.user.role
    });

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided',
        message: 'Please provide base64 image data'
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

    const adminUser = await User.findById(req.user._id);
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Ensure company fields are set before saving
    const companyIdToUse = req.user.companyId || adminUser.companyId;
    if (!adminUser.company && companyIdToUse) {
      adminUser.company = companyIdToUse;
    }
    if (!adminUser.companyId && companyIdToUse) {
      adminUser.companyId = companyIdToUse;
    }

    // Store base64 image data directly in database
    adminUser.avatar = imageData;
    await adminUser.save();

    console.log('Admin profile picture updated and saved to database for user:', adminUser._id);

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      avatarData: imageData
    });

  } catch (error) {
    console.error('Error uploading admin profile picture:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile picture',
      details: error.message
    });
  }
};

// @desc    Get admin avatar (profile picture)
// @access  Private (Admin only)
const getAvatar = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const adminUser = await User.findById(req.user._id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    res.json({
      success: true,
      avatar: adminUser.avatar || null
    });

  } catch (error) {
    console.error('Error getting admin avatar:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get avatar',
      details: error.message 
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getAvatar
};