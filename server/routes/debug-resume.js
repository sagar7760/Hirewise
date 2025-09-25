const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Resume = require('../models/Resume');
const { auth } = require('../middleware/auth');

// @route   GET /api/debug/resume
// @desc    Debug user's resume status
// @access  Private
router.get('/resume', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = await User.findById(userId);
    
    // Get all resumes for this user
    const userResumes = await Resume.find({ userId: userId });
    
    // Get the current resume if it exists
    let currentResume = null;
    if (user.currentResumeId) {
      currentResume = await Resume.findById(user.currentResumeId);
    }
    
    res.json({
      success: true,
      debug: {
        userId: userId,
        userResumeField: user.resume,
        currentResumeId: user.currentResumeId,
        currentResumeData: currentResume,
        allUserResumes: userResumes.map(r => ({
          id: r._id,
          fileName: r.fileName,
          originalName: r.originalName,
          uploadDate: r.createdAt,
          fileSize: r.fileSize
        }))
      }
    });
    
  } catch (error) {
    console.error('Debug resume error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error debugging resume',
      error: error.message 
    });
  }
});

module.exports = router;