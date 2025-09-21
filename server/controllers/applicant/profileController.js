const User = require('../../models/User');
const Resume = require('../../models/Resume');
const { body, validationResult } = require('express-validator');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get user with populated resume data
    const user = await User.findById(userId)
      .select('-password')
      .populate('companyId', 'name logo');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current resume if exists - check both locations
    let currentResume = null;
    if (user.profile?.currentResumeId) {
      currentResume = await Resume.findOne({
        _id: user.profile.currentResumeId,
        userId,
        isActive: true
      }).select('-fileData'); // Exclude file data for profile view
    } else if (user.currentResumeId) {
      currentResume = await Resume.findOne({
        _id: user.currentResumeId,
        userId,
        isActive: true
      }).select('-fileData'); // Exclude file data for profile view
    }

    // Transform data for frontend
    const profileData = {
      // Personal Information
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone || '',
      location: user.profile?.currentLocation || '',
      summary: user.profile?.summary || '',
      
      // Resume info
      resume: currentResume ? {
        id: currentResume._id,
        fileName: currentResume.originalName,
        uploadDate: currentResume.createdAt.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        fileSize: `${(currentResume.fileSize / 1024).toFixed(0)} KB`
      } : null,
      
      // Education - check both old and new format
      education: (user.profile?.educationEntries?.map(edu => ({
        id: edu._id,
        institution: edu.universityName,
        degree: `${edu.qualification} in ${edu.fieldOfStudy}`,
        graduationDate: edu.graduationYear,
        description: `${edu.qualification} in ${edu.fieldOfStudy}, ${edu.universityName}${edu.cgpaPercentage ? ` - CGPA: ${edu.cgpaPercentage}` : ''}`
      })) || user.education?.map(edu => ({
        id: edu._id,
        institution: edu.institution,
        degree: edu.degree,
        graduationDate: edu.graduationDate,
        description: edu.description
      }))) || [],
      
      // Work Experience - check both old and new format
      workExperience: (user.profile?.workExperienceEntries?.map(work => ({
        id: work._id,
        company: work.company,
        position: work.position,
        duration: work.isCurrentlyWorking 
          ? `${work.startDate} - Present` 
          : `${work.startDate} - ${work.endDate}`,
        description: work.description || work.position
      })) || user.workExperience?.map(work => ({
        id: work._id,
        company: work.company,
        position: work.position,
        duration: work.duration,
        description: work.description
      }))) || [],
      
      // Skills - check both old and new format
      skills: user.profile?.primarySkills || user.skills || [],
      
      // Projects - check both old and new format
      projects: (user.profile?.projects?.map(project => ({
        id: project._id,
        name: project.name,
        technologies: project.technologies,
        description: project.description
      })) || user.projects?.map(project => ({
        id: project._id,
        name: project.name,
        technologies: project.technologies,
        description: project.description
      }))) || []
    };

    // Disable caching for profile data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user._id || req.user.id;

    const {
      fullName,
      phone,
      location,
      summary,
      education,
      workExperience,
      skills,
      projects
    } = req.body;

    // Email is not included - business rule: cannot change email

    // Split full name with validation
    const fullNameStr = fullName ? fullName.toString().trim() : '';
    const nameParts = fullNameStr.split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Convert frontend data structures back to database format
    const educationEntries = education?.map(edu => ({
      _id: edu.id && edu.id !== 'new' ? edu.id : undefined,
      qualification: edu.degree && edu.degree.includes(' in ') ? edu.degree.split(' in ')[0] : (edu.degree || ''),
      fieldOfStudy: edu.degree && edu.degree.includes(' in ') ? edu.degree.split(' in ')[1] : '',
      universityName: edu.institution || '',
      graduationYear: edu.graduationDate || '',
      cgpaPercentage: '' // Could be extracted from description if needed
    })) || [];

    const workExperienceEntries = workExperience?.map(work => ({
      _id: work.id && work.id !== 'new' ? work.id : undefined,
      company: work.company || '',
      position: work.position || '',
      startDate: work.duration && work.duration.includes(' - ') ? work.duration.split(' - ')[0] : (work.duration || ''),
      endDate: work.duration && work.duration.includes('Present') ? '' : (work.duration && work.duration.includes(' - ') ? work.duration.split(' - ')[1] : ''),
      isCurrentlyWorking: work.duration ? work.duration.includes('Present') : false,
      description: work.description || '',
      yearsOfExperience: '' // Could be calculated
    })) || [];

    const projectEntries = projects?.map(project => ({
      _id: project.id && project.id !== 'new' ? project.id : undefined,
      name: project.name || '',
      technologies: project.technologies || '',
      description: project.description || ''
    })) || [];

    // Update user profile
    const updateData = {
      firstName,
      lastName,
      phone,
      'profile.currentLocation': location,
      'profile.summary': summary,
      'profile.educationEntries': educationEntries,
      'profile.workExperienceEntries': workExperienceEntries,
      'profile.primarySkills': skills || [],
      'profile.projects': projectEntries
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        phone: updatedUser.phone,
        location: updatedUser.profile?.currentLocation,
        summary: updatedUser.profile?.summary
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current resume download
// @route   GET /api/profile/resume/download
// @access  Private
const downloadCurrentResume = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get user's current resume - check both locations
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let resumeId = user.profile?.currentResumeId || user.currentResumeId;
    if (!resumeId) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      userId,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Return file data as JSON for frontend processing
    res.json({
      success: true,
      fileData: resume.fileData, // Base64 string
      fileName: resume.originalName,
      contentType: resume.mimeType,
      fileSize: resume.fileSize
    });

  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete current resume
// @route   DELETE /api/profile/resume
// @access  Private
const deleteCurrentResume = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get user's current resume - check both locations
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let resumeId = user.profile?.currentResumeId || user.currentResumeId;
    if (!resumeId) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }

    // Deactivate the resume
    await Resume.findByIdAndUpdate(resumeId, {
      isActive: false
    });

    // Clear user's current resume reference in both locations
    const updateData = {};
    if (user.profile?.currentResumeId) {
      updateData['profile.currentResumeId'] = null;
      updateData['profile.resume'] = null;
    }
    if (user.currentResumeId) {
      updateData['currentResumeId'] = null;
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validation middleware
const validateProfileUpdate = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('summary')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Summary must not exceed 1000 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  body('workExperience')
    .optional()
    .isArray()
    .withMessage('Work experience must be an array'),
  body('projects')
    .optional()
    .isArray()
    .withMessage('Projects must be an array')
];

module.exports = {
  getProfile,
  updateProfile,
  downloadCurrentResume,
  deleteCurrentResume,
  validateProfileUpdate
};