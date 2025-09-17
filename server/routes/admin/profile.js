const express = require('express');
const { auth } = require('../../middleware/auth');
const { uploadProfilePic } = require('../../middleware/upload');
const User = require('../../models/User');

const router = express.Router();

// GET /api/admin/profile - Get admin profile
router.get('/', auth, async (req, res) => {
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

    // Build profile response matching frontend structure
    const profileData = {
      personalInfo: {
        firstName: adminUser.firstName || '',
        lastName: adminUser.lastName || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        dateOfBirth: adminUser.dateOfBirth ? adminUser.dateOfBirth.toISOString().split('T')[0] : '',
        avatar: adminUser.avatar ? `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${adminUser.avatar}` : null
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
});

// PUT /api/admin/profile - Update admin profile
router.put('/', auth, uploadProfilePic.single('avatar'), async (req, res) => {
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

    // Handle avatar upload
    if (req.file) {
      adminUser.avatar = req.file.filename;
      console.log('Avatar uploaded:', req.file.filename);
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
        avatar: adminUser.avatar ? `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${adminUser.avatar}` : null
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

    res.json({
      success: true,
      data: updatedProfileData,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;