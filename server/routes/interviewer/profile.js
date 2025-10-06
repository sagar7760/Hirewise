const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../../middleware/auth');
const profileController = require('../../controllers/interviewer/profileController');

// Multer memory storage for base64 conversion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads allowed'));
    }
    cb(null, true);
  }
});

router.get('/', auth, profileController.getProfile);
router.patch('/', auth, profileController.updateProfile);
router.post('/password', auth, profileController.changePassword);
router.post('/avatar', auth, upload.single('avatar'), profileController.updateAvatar);
router.patch('/notifications', auth, profileController.updateNotifications);

module.exports = router;