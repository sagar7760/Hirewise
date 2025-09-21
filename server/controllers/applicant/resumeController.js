const Resume = require('../../models/Resume');
const User = require('../../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only PDF and DOCX files
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Upload resume file
// @access  Private
const uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Deactivate previous resumes
    await Resume.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Create new resume record
    const resume = new Resume({
      userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/resumes/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      processingStatus: 'completed' // Mark as completed since we're not doing server-side parsing
    });

    await resume.save();

    // Update user's current resume reference
    await User.findByIdAndUpdate(userId, {
      'profile.currentResumeId': resume._id,
      'profile.resume': {
        fileName: req.file.filename,
        fileUrl: `/uploads/resumes/${req.file.filename}`,
        uploadDate: new Date(),
        fileSize: req.file.size
      }
    });

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        originalName: resume.originalName,
        fileUrl: resume.fileUrl,
        fileSize: resume.fileSize,
        uploadDate: resume.createdAt
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Save parsed resume data
// @access  Private
const saveParsedResumeData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parsedData } = req.body;

    if (!parsedData) {
      return res.status(400).json({
        success: false,
        message: 'No parsed data provided'
      });
    }

    // Get user's latest resume
    const resume = await Resume.findLatestByUser(userId);
    
    if (resume) {
      // Update resume with parsed data
      await resume.markAsCompleted(parsedData);
    }

    // Update user profile with parsed data
    const updateData = {};
    
    if (parsedData.fullName) {
      const nameParts = parsedData.fullName.trim().split(' ');
      updateData.firstName = nameParts[0] || '';
      updateData.lastName = nameParts.slice(1).join(' ') || '';
      updateData['profile.fullName'] = parsedData.fullName;
    }
    
    if (parsedData.phone) updateData.phone = parsedData.phone;
    if (parsedData.currentLocation) updateData['profile.currentLocation'] = parsedData.currentLocation;
    if (parsedData.primarySkills && parsedData.primarySkills.length > 0) {
      updateData['profile.primarySkills'] = parsedData.primarySkills;
    }
    if (parsedData.educationEntries && parsedData.educationEntries.length > 0) {
      updateData['profile.educationEntries'] = parsedData.educationEntries;
    }
    if (parsedData.workExperienceEntries && parsedData.workExperienceEntries.length > 0) {
      updateData['profile.workExperienceEntries'] = parsedData.workExperienceEntries;
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      message: 'Resume data saved successfully',
      parsedData
    });

  } catch (error) {
    console.error('Save parsed data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving parsed data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's resumes
// @access  Private
const getUserResumes = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumes = await Resume.findByUser(userId);

    res.json({
      success: true,
      data: resumes
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get specific resume
// @access  Private
const getResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete resume
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/resumes', resume.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deactivate resume record
    await resume.deactivate();

    // Clear user's current resume reference if this was the current one
    const user = await User.findById(userId);
    if (user.profile.currentResumeId && user.profile.currentResumeId.toString() === resumeId) {
      await User.findByIdAndUpdate(userId, {
        'profile.currentResumeId': null,
        'profile.resume': null
      });
    }

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

module.exports = {
  uploadResume,
  saveParsedResumeData,
  getUserResumes,
  getResume,
  deleteResume,
  upload
};