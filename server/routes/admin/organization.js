const express = require('express');
const { auth } = require('../../middleware/auth');
const { uploadCompanyLogo } = require('../../middleware/upload');
const { getOrganization, updateOrganization, updateLogo } = require('../../controllers/admin/organizationController');

const router = express.Router();

// @route   GET /api/admin/organization
// @desc    Get current organization/company data
// @access  Private (Admin only)
router.get('/', auth, getOrganization);

// @route   PUT /api/admin/organization
// @desc    Update organization/company data
// @access  Private (Admin only)
router.put('/', auth, uploadCompanyLogo.single('logo'), updateOrganization);

// @route   POST /api/admin/organization/logo
// @desc    Update organization logo with base64
// @access  Private (Admin only)
router.post('/logo', auth, updateLogo);

module.exports = router;