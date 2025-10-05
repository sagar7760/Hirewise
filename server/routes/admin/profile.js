const express = require('express');
const { auth } = require('../../middleware/auth');
const { uploadProfilePic } = require('../../middleware/upload');
const { getProfile, updateProfile, updateAvatar, getAvatar, changePassword } = require('../../controllers/admin/profileController');

const router = express.Router();

// GET /api/admin/profile - Get admin profile
router.get('/', auth, getProfile);

// PUT /api/admin/profile - Update admin profile
router.put('/', auth, uploadProfilePic.single('avatar'), updateProfile);

// POST /api/admin/profile/avatar - Update admin avatar with base64
router.post('/avatar', auth, updateAvatar);

// GET /api/admin/profile/avatar - Get admin avatar
router.get('/avatar', auth, getAvatar);

// POST /api/admin/profile/change-password - Change password
router.post('/change-password', auth, changePassword);

module.exports = router;