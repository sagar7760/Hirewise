const express = require('express');
const { auth } = require('../../middleware/auth');
const multer = require('multer');
const User = require('../../models/User');
const {
  getProfile,
  updateProfile,
  downloadCurrentResume,
  deleteCurrentResume,
  validateProfileUpdate
} = require('../../controllers/applicant/profileController');

// Configure multer for memory storage (not disk storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', getProfile);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', validateProfileUpdate, updateProfile);

// @route   GET /api/profile/resume/download
// @desc    Download current resume
// @access  Private
router.get('/resume/download', downloadCurrentResume);

// @route   DELETE /api/profile/resume
// @desc    Delete current resume
// @access  Private
router.delete('/resume', deleteCurrentResume);

// @route   POST /api/profile/upload-photo
// @desc    Upload profile picture (store in database as base64)
// @access  Private
router.post('/upload-photo', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Use _id or id depending on what's available
    const userId = req.user.id || req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert image to base64 data URL
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update user with new profile picture (base64 data)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: base64Image },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update user profile picture'
      });
    }

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

// @route   DELETE /api/profile/delete-photo
// @desc    Delete profile picture
// @access  Private
router.delete('/delete-photo', auth, async (req, res) => {
  try {
    // Use _id or id depending on what's available
    const userId = req.user.id || req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to delete'
      });
    }

    // Remove profile picture from database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: null },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete profile picture'
      });
    }

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;