const Resume = require('../../models/Resume');
const User = require('../../models/User');
const multer = require('multer');

// Configure multer for memory storage (not disk storage)
const storage = multer.memoryStorage();

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
    const userId = req.user._id || req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Convert file buffer to Base64
    const fileData = req.file.buffer.toString('base64');
    
    // Generate unique filename for reference
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `resume-${uniqueSuffix}${getFileExtension(req.file.originalname)}`;

    // Delete previous resumes completely
    const deleteResult = await Resume.deleteMany({
      userId,
      isActive: true
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} previous resumes for user ${userId}`);

    // Create new resume record with Base64 data
    const resume = new Resume({
      userId,
      fileName,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileData, // Store Base64 encoded file data
      processingStatus: 'completed' // Mark as completed since we're not doing server-side parsing
    });

    await resume.save();

    // Update user's current resume reference - handle both old and new format
    const updateData = {
      'profile.currentResumeId': resume._id,
      'profile.resume': {
        fileName,
        uploadDate: new Date(),
        fileSize: req.file.size
      }
    };

    // Also update the old format if it exists
    const user = await User.findById(userId);
    if (user.currentResumeId !== undefined) {
      updateData.currentResumeId = resume._id;
    }

    await User.findByIdAndUpdate(userId, updateData);
    
    console.log('Updated user resume reference:', updateData);
    console.log('New resume ID:', resume._id);

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        originalName: resume.originalName,
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

// Helper function to get file extension
function getFileExtension(filename) {
  return filename.substring(filename.lastIndexOf('.'));
}

// @desc    Save parsed resume data
// @access  Private
const saveParsedResumeData = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
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
    const userId = req.user._id || req.user.id;
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
    const userId = req.user._id || req.user.id;
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
    const userId = req.user._id || req.user.id;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Deactivate resume record (no file system cleanup needed)
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

// @desc    Download resume file
// @access  Private
const downloadResume = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const resumeId = req.params.id;

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

    // Convert Base64 back to buffer
    const fileBuffer = Buffer.from(resume.fileData, 'base64');

    // Set appropriate headers
    res.setHeader('Content-Type', resume.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Send the file
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download resume error:', error);
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
  downloadResume,
  upload
};