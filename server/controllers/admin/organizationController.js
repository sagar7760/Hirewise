const Company = require('../../models/Company');
const User = require('../../models/User');

// @desc    Get current organization/company data
// @access  Private (Admin only)
const getOrganization = async (req, res) => {
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

    // Get company ID from JWT token or fetch from user record
    let companyId = req.user.companyId;
    
    if (!companyId) {
      // If JWT doesn't have companyId, fetch from user record
      const adminUser = await User.findById(req.user._id);
      companyId = adminUser?.company || adminUser?.companyId;
      
      console.log('Fetched company ID from user record:', companyId);
    }

    if (!companyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user.'
      });
    }

    // Fetch company data
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    // Fetch admin user data for contact information
    const adminUser = await User.findById(req.user._id);

    console.log('Admin user data:', {
      id: adminUser?._id,
      email: adminUser?.email,
      phone: adminUser?.phone,
      company: adminUser?.company,
      companyId: adminUser?.companyId
    });

    console.log('Company data found:', {
      id: company._id,
      name: company.name,
      contact: company.contact
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
};

// @desc    Update organization/company data
// @access  Private (Admin only)
const updateOrganization = async (req, res) => {
  try {
    // Ensure user is admin and has a company
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!req.user.companyId) {
      // If JWT doesn't have companyId, fetch from user record
      const adminUser = await User.findById(req.user._id);
      const companyId = adminUser?.company || adminUser?.companyId;
      
      if (!companyId) {
        return res.status(404).json({
          success: false,
          message: 'No company associated with this user.'
        });
      }
      
      // Use the fetched company ID
      req.user.companyId = companyId;
      console.log('Using company ID from user record for update:', companyId);
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

    // Handle logo upload (prioritize base64, then convert file upload to base64)
    if (req.body.logo && req.body.logo.startsWith('data:image/')) {
      // Base64 image upload
      const logoData = req.body.logo;
      
      // Check image size (base64 encoded images are ~33% larger than original)
      const base64Data = logoData.split(',')[1];
      const imageSizeBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB for company logos
      
      if (imageSizeBytes <= maxSizeBytes) {
        company.logo = logoData;
        console.log('Company logo updated with base64 data (size:', Math.round(imageSizeBytes / 1024), 'KB)');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Company logo must be smaller than 10MB'
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
        
        company.logo = dataUri;
        console.log('Company logo converted to base64 and saved to database (file:', req.file.filename, ', size:', Math.round(fileBuffer.length / 1024), 'KB)');
        
        // Delete the temporary file since we're storing in database
        fs.unlinkSync(filePath);
        console.log('Temporary file deleted:', filePath);
        
      } catch (error) {
        console.error('Error converting logo file to base64:', error);
        // Fallback to legacy file storage
        company.logo = `/uploads/company-logos/${req.file.filename}`;
        console.log('Company logo uploaded (legacy fallback):', req.file.filename);
      }
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
};

// @desc    Update organization logo
// @access  Private (Admin only)
const updateLogo = async (req, res) => {
  try {
    // Ensure user is admin and has a company
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get company ID from JWT token or fetch from user record
    let companyId = req.user.companyId;
    
    if (!companyId) {
      const adminUser = await User.findById(req.user._id);
      companyId = adminUser?.company || adminUser?.companyId;
    }

    if (!companyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user.'
      });
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
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB for company logos

    if (imageSizeBytes > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Company logo must be smaller than 10MB'
      });
    }

    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Store base64 image data directly in database
    company.logo = imageData;
    await company.save();

    console.log('Company logo updated and saved to database for company:', company._id);

    res.json({
      success: true,
      message: 'Company logo updated successfully',
      logoData: imageData
    });

  } catch (error) {
    console.error('Error uploading company logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload company logo',
      details: error.message
    });
  }
};

module.exports = {
  getOrganization,
  updateOrganization,
  updateLogo
};