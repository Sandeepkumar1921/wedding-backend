const express = require('express');
const router = express.Router();
const { getProfile, updateProfilePhoto } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile/photo', protect, uploadProfilePhoto, updateProfilePhoto);

module.exports = router;
