const express = require('express');
const Company = require('../../models/Company');
const { auth } = require('../../middleware/auth');
const { uploadCompanyLogo } = require('../../middleware/upload');
const router = express.Router();

// @route   GET /api/admin/organization
// @desc    Get current organization/company data
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    console.log('Organization route - User data:', {
      id: req.user._id,
      role: req.user.role,
      companyId: req.user.companyId,
      isCompanyAdmin: req.user.isCompanyAdmin
    });

    // Ensure user is admin and has a company
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!req.user.companyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user.'
      });
    }

    // Fetch company data
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    // Fetch admin user data for contact information
    const User = require('../../models/User');
    const adminUser = await User.findById(req.user._id);

    console.log('Admin user data:', {
      id: adminUser?._id,
      email: adminUser?.email,
      phone: adminUser?.phone
    });

    console.log('Company contact data:', {
      phone: company.contact?.phone,
      email: company.contact?.email
    });

    const responseData = {
      id: company._id,
      name: company.name,
      industry: company.industry,
      size: company.size,
      headquarters: company.headquarters,
      country: company.country,
      website: company.website,
      logo: company.logo,
      registrationNumber: company.registrationNumber,
      description: company.description,
      socialLinks: company.socialLinks || {},
      hiringRegions: company.hiringRegions || [],
      remotePolicy: company.remotePolicy,
      // Address information
      address: {
        street: company.address?.street || '',
        city: company.address?.city || company.headquarters || '',
        state: company.address?.state || '',
        zipCode: company.address?.zipCode || '',
        country: company.address?.country || company.country || 'India'
      },
      // Contact information - use admin's contact if company contact is empty
      contact: {
        phone: company.contact?.phone || adminUser?.phone || '',
        email: company.contact?.email || adminUser?.email || ''
      },
      // Organization settings
      settings: {
        autoApproveApplications: company.settings?.autoApproveApplications || false,
        allowPublicJobPosting: company.settings?.allowPublicJobPosting !== false, // default true
        enableEmailNotifications: company.settings?.enableEmailNotifications !== false, // default true
        requireInterviewFeedback: company.settings?.requireInterviewFeedback !== false // default true
      },
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };

    console.log('Final contact data being sent:', responseData.contact);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching organization data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organization data.'
    });
  }
});

// @route   PUT /api/admin/organization
// @desc    Update organization/company data
// @access  Private (Admin only)
router.put('/', auth, uploadCompanyLogo.single('logo'), async (req, res) => {
  try {
    // Ensure user is admin and has a company
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!req.user.companyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user.'
      });
    }

    // Find the company
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    // Extract data from request body
    const {
      name,
      industry,
      description,
      website,
      // Address fields
      addressStreet,
      addressCity,
      addressState,
      addressZipCode,
      addressCountry,
      // Contact fields
      contactPhone,
      contactEmail,
      // Settings fields
      autoApproveApplications,
      allowPublicJobPosting,
      enableEmailNotifications,
      requireInterviewFeedback
    } = req.body;

    // Update basic company information
    if (name && name.trim()) company.name = name.trim();
    if (industry) company.industry = industry;
    if (description !== undefined) company.description = description;
    if (website !== undefined) company.website = website;

    // Handle logo upload
    if (req.file) {
      company.logo = `/uploads/company-logos/${req.file.filename}`;
    }

    // Update address information
    company.address = {
      street: addressStreet || company.address?.street || '',
      city: addressCity || company.address?.city || company.headquarters || '',
      state: addressState || company.address?.state || '',
      zipCode: addressZipCode || company.address?.zipCode || '',
      country: addressCountry || company.address?.country || company.country || 'India'
    };

    // Update contact information - also update admin user's contact info
    company.contact = {
      phone: contactPhone || company.contact?.phone || '',
      email: contactEmail || company.contact?.email || ''
    };

    // Update admin user's contact information if provided
    if (contactPhone || contactEmail) {
      const User = require('../../models/User');
      const adminUser = await User.findById(req.user._id);
      if (adminUser) {
        if (contactPhone) adminUser.phone = contactPhone;
        if (contactEmail && contactEmail !== adminUser.email) {
          // Only update email if it's different and valid
          adminUser.email = contactEmail;
        }
        await adminUser.save();
      }
    }

    // Update settings
    company.settings = {
      autoApproveApplications: autoApproveApplications === 'true' || autoApproveApplications === true,
      allowPublicJobPosting: allowPublicJobPosting !== 'false' && allowPublicJobPosting !== false,
      enableEmailNotifications: enableEmailNotifications !== 'false' && enableEmailNotifications !== false,
      requireInterviewFeedback: requireInterviewFeedback !== 'false' && requireInterviewFeedback !== false
    };

    // Save updated company
    const updatedCompany = await company.save();

    res.json({
      success: true,
      message: 'Organization settings updated successfully.',
      data: {
        id: updatedCompany._id,
        name: updatedCompany.name,
        industry: updatedCompany.industry,
        description: updatedCompany.description,
        website: updatedCompany.website,
        logo: updatedCompany.logo,
        address: updatedCompany.address,
        contact: updatedCompany.contact,
        settings: updatedCompany.settings,
        updatedAt: updatedCompany.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating organization data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating organization data.'
    });
  }
});

module.exports = router;