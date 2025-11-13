const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const profileController = require('../../controllers/hr/profileController');

const router = express.Router();

// Test route
router.get('/test', profileController.test);

// Debug route to check current user
router.get('/debug', auth, profileController.debug);

// HR Profile routes
router.get('/', auth, authorize('hr'), profileController.getProfile);
router.put('/', auth, authorize('hr'), profileController.updateProfile);
router.put('/avatar', auth, authorize('hr'), profileController.updateAvatar);
router.put('/change-password', auth, authorize('hr'), profileController.changePassword);

module.exports = router;