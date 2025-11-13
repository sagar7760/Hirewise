const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { uploadProfilePic, deleteFile } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('profile.currentResumeId', 'fileName originalName fileSize mimeType uploadDate parsedData')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Make sure the frontend knows about the resume even if it's nested in profile
    const enhancedUser = {
      ...user,
      // Add top-level references to the resume for easier access in the frontend
      resumeAvailable: !!user.profile?.currentResumeId || !!user.profile?.resume?.fileName,
      currentResumeId: user.profile?.currentResumeId,
      resume: user.profile?.resume
    };

    res.json({
      success: true,
      data: enhancedUser
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/basic-info
// @desc    Update basic profile information
// @access  Private
router.put('/basic-info', auth, [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('profile.summary').optional().trim().isLength({ max: 1000 }).withMessage('Summary too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'location', 'profile'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'profile' && req.user.profile) {
          updates.profile = { ...req.user.profile, ...req.body.profile };
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update basic info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/education
// @desc    Update education information
// @access  Private (Applicant)
router.put('/education', auth, authorize('applicant'), [
  body('education').isArray().withMessage('Education must be an array'),
  body('education.*.institution').notEmpty().withMessage('Institution is required'),
  body('education.*.degree').notEmpty().withMessage('Degree is required'),
  body('education.*.graduationDate').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'profile.education': req.body.education },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Education updated successfully',
      data: user.profile.education
    });

  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/work-experience
// @desc    Update work experience
// @access  Private (Applicant)
router.put('/work-experience', auth, authorize('applicant'), [
  body('workExperience').isArray().withMessage('Work experience must be an array'),
  body('workExperience.*.company').notEmpty().withMessage('Company is required'),
  body('workExperience.*.position').notEmpty().withMessage('Position is required'),
  body('workExperience.*.duration').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'profile.workExperience': req.body.workExperience },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Work experience updated successfully',
      data: user.profile.workExperience
    });

  } catch (error) {
    console.error('Update work experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/skills
// @desc    Update skills
// @access  Private (Applicant)
router.put('/skills', auth, authorize('applicant'), [
  body('skills').isArray().withMessage('Skills must be an array'),
  body('skills.*').trim().notEmpty().withMessage('Skill cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'profile.skills': req.body.skills },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: user.profile.skills
    });

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/projects
// @desc    Update projects
// @access  Private (Applicant)
router.put('/projects', auth, authorize('applicant'), [
  body('projects').isArray().withMessage('Projects must be an array'),
  body('projects.*.name').notEmpty().withMessage('Project name is required'),
  body('projects.*.description').optional().trim(),
  body('projects.*.technologies').optional().isArray().withMessage('Technologies must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'profile.projects': req.body.projects },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Projects updated successfully',
      data: user.profile.projects
    });

  } catch (error) {
    console.error('Update projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/profile/upload-photo
// @desc    Upload profile picture
// @access  Private
router.post('/upload-photo', auth, uploadProfilePic.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old profile picture if exists
    const user = await User.findById(req.user.id);
    if (user.profilePicture) {
      const oldImagePath = path.join(__dirname, '..', user.profilePicture);
      deleteFile(oldImagePath);
    }

    // Update user with new profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: `/uploads/profile-pictures/${req.file.filename}` },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: updatedUser.profilePicture
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/resume
// @desc    Update resume information in profile
// @access  Private (Applicant)
router.put('/resume', auth, authorize('applicant'), [
  body('resume.fileName').optional().trim(),
  body('resume.fileUrl').optional().trim(),
  body('resume.fileSize').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const resumeData = {
      ...req.body.resume,
      uploadDate: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'profile.resume': resumeData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Resume information updated successfully',
      data: user.profile.resume
    });

  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/profile/preferences
// @desc    Update job preferences
// @access  Private (Applicant)
router.put('/preferences', auth, authorize('applicant'), [
  body('preferredJobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship']),
  body('expectedSalary.min').optional().isNumeric(),
  body('expectedSalary.max').optional().isNumeric(),
  body('expectedSalary.currency').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updates = {};
    if (req.body.preferredJobType) {
      updates['profile.preferredJobType'] = req.body.preferredJobType;
    }
    if (req.body.expectedSalary) {
      updates['profile.expectedSalary'] = req.body.expectedSalary;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferredJobType: user.profile?.preferredJobType,
        expectedSalary: user.profile?.expectedSalary
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/profile/completeness
// @desc    Get profile completeness percentage
// @access  Private (Applicant)
router.get('/completeness', auth, authorize('applicant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate profile completeness
    const checkList = {
      basicInfo: !!(user.firstName && user.lastName && user.email && user.phone),
      location: !!user.location,
      summary: !!(user.profile?.summary),
      resume: !!(user.profile?.resume?.fileUrl),
      education: !!(user.profile?.education?.length > 0),
      workExperience: !!(user.profile?.workExperience?.length > 0),
      skills: !!(user.profile?.skills?.length > 0),
      profilePicture: !!user.profilePicture
    };

    const completedFields = Object.values(checkList).filter(Boolean).length;
    const totalFields = Object.keys(checkList).length;
    const completeness = Math.round((completedFields / totalFields) * 100);

    const missingFields = Object.keys(checkList).filter(key => !checkList[key]);

    res.json({
      success: true,
      data: {
        completeness,
        completedFields,
        totalFields,
        checkList,
        missingFields,
        suggestions: missingFields.map(field => {
          const suggestions = {
            basicInfo: 'Complete your basic information',
            location: 'Add your location',
            summary: 'Write a professional summary',
            resume: 'Upload your resume',
            education: 'Add your education details',
            workExperience: 'Add your work experience',
            skills: 'List your skills',
            profilePicture: 'Upload a profile picture'
          };
          return suggestions[field];
        })
      }
    });

  } catch (error) {
    console.error('Get profile completeness error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;