const express = require('express');
const router  = express.Router();
const {
  registerSendOTP, registerVerifyOTP,
  loginSendOTP,    loginVerifyOTP,
  logout, getMe,   resendOTP,
} = require('../controllers/auth.controller');
const { protect }          = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/upload');

// Register — 2 step
router.post('/register/send-otp',   uploadProfilePhoto, registerSendOTP);
router.post('/register/verify-otp', registerVerifyOTP);

// Login — 2 step
router.post('/login/send-otp',      loginSendOTP);
router.post('/login/verify-otp',    loginVerifyOTP);

// Common
router.post('/resend-otp', resendOTP);
router.post('/logout',     protect, logout);
router.get('/me',          protect, getMe);

module.exports = router;
