const crypto       = require('crypto');
const User         = require('../models/User');
const Wedding      = require('../models/Wedding');
const OTP          = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const apiResponse  = require('../utils/apiResponse');
const { sendOTPEmail } = require('../config/email');

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const getExpiry = () => {
  const mins = parseInt(process.env.OTP_EXPIRE_MINUTES || '10');
  return new Date(Date.now() + mins * 60 * 1000);
};

// ─────────────────────────────────────────────
// STEP 1 of Register — validate & send OTP
// ─────────────────────────────────────────────
const registerSendOTP = async (req, res) => {
  try {
    const { username, email, mobile, password } = req.body;

    if (!username || !email || !mobile || !password)
      return apiResponse.error(res, 'All fields are required.', 400);
    if (password.length < 6)
      return apiResponse.error(res, 'Password must be at least 6 characters.', 400);
    if (!/^[0-9]{10}$/.test(mobile))
      return apiResponse.error(res, 'Enter valid 10-digit mobile number.', 400);

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) return apiResponse.error(res, 'Email already registered.', 409);

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) return apiResponse.error(res, 'Mobile already registered.', 409);

    // Profile photo
    let profilePhotoURL      = null;
    let profilePhotoPublicId = null;
    if (req.file) {
      profilePhotoURL      = req.file.path;
      profilePhotoPublicId = req.file.filename;
    }

    const otp = generateOTP();

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'register' });

    // Save OTP + temp data
    await OTP.create({
      email:    email.toLowerCase(),
      otp,
      purpose:  'register',
      tempData: { username, email: email.toLowerCase(), mobile, password, profilePhotoURL, profilePhotoPublicId },
      expiresAt: getExpiry(),
    });

    await sendOTPEmail(email, otp, 'register');

    return apiResponse.success(res, { email: email.toLowerCase() },
      'OTP sent to your email. Please verify to complete registration.');

  } catch (error) {
    console.error('registerSendOTP error:', error);
    return apiResponse.error(res, 'Failed to send OTP. Check email and try again.', 500);
  }
};

// ─────────────────────────────────────────────
// STEP 2 of Register — verify OTP & create user
// ─────────────────────────────────────────────
const registerVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return apiResponse.error(res, 'Email and OTP required.', 400);

    const record = await OTP.findOne({
      email:    email.toLowerCase(),
      purpose:  'register',
      verified: false,
    });

    if (!record)
      return apiResponse.error(res, 'OTP not found. Please request a new one.', 404);

    if (new Date() > record.expiresAt)
      return apiResponse.error(res, 'OTP expired. Please request a new one.', 410);

    if (record.otp !== otp.toString())
      return apiResponse.error(res, 'Incorrect OTP. Please try again.', 400);

    // Mark verified
    record.verified = true;
    await record.save();

    const { username, mobile, password, profilePhotoURL, profilePhotoPublicId } = record.tempData;

    // Double check email not taken
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return apiResponse.error(res, 'Email already registered.', 409);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      mobile,
      password,
      profilePhotoURL,
      profilePhotoPublicId,
      emailVerified: true,
    });

    // Create wedding
    const wedding = await Wedding.create({ ownerId: user._id });
    user.weddingId = wedding._id;
    await user.save();

    // Cleanup OTP
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'register' });

    generateToken(res, user._id);

    return apiResponse.created(res, {
      user: {
        _id: user._id, username: user.username,
        email: user.email, mobile: user.mobile,
        profilePhotoURL: user.profilePhotoURL,
        weddingId: wedding._id,
      }
    }, 'Account created successfully! Welcome 🎉');

  } catch (error) {
    console.error('registerVerifyOTP error:', error);
    return apiResponse.error(res, 'Verification failed.', 500);
  }
};

// ─────────────────────────────────────────────
// STEP 1 of Login — validate & send OTP
// ─────────────────────────────────────────────
const loginSendOTP = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return apiResponse.error(res, 'Email and password required.', 400);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return apiResponse.error(res, 'Invalid email or password.', 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return apiResponse.error(res, 'Invalid email or password.', 401);

    const otp = generateOTP();
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });
    await OTP.create({
      email:    email.toLowerCase(),
      otp,
      purpose:  'login',
      expiresAt: getExpiry(),
    });

    await sendOTPEmail(email, otp, 'login');

    return apiResponse.success(res, { email: email.toLowerCase() },
      'OTP sent to your email. Please verify to login.');

  } catch (error) {
    console.error('loginSendOTP error:', error);
    return apiResponse.error(res, 'Failed to send OTP.', 500);
  }
};

// ─────────────────────────────────────────────
// STEP 2 of Login — verify OTP & login
// ─────────────────────────────────────────────
const loginVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return apiResponse.error(res, 'Email and OTP required.', 400);

    const record = await OTP.findOne({
      email:    email.toLowerCase(),
      purpose:  'login',
      verified: false,
    });

    if (!record)
      return apiResponse.error(res, 'OTP not found. Please request a new one.', 404);

    if (new Date() > record.expiresAt)
      return apiResponse.error(res, 'OTP expired. Please request a new one.', 410);

    if (record.otp !== otp.toString())
      return apiResponse.error(res, 'Incorrect OTP. Please try again.', 400);

    record.verified = true;
    await record.save();

    const user = await User.findOne({ email: email.toLowerCase() }).populate('weddingId');
    if (!user) return apiResponse.error(res, 'User not found.', 404);

    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });

    generateToken(res, user._id);

    return apiResponse.success(res, {
      user: {
        _id: user._id, username: user.username,
        email: user.email, mobile: user.mobile,
        profilePhotoURL: user.profilePhotoURL,
        weddingId: user.weddingId,
      }
    }, 'Login successful! Welcome back 💍');

  } catch (error) {
    console.error('loginVerifyOTP error:', error);
    return apiResponse.error(res, 'Verification failed.', 500);
  }
};

// Logout
const logout = (req, res) => {
  res.cookie('wm_token', '', {
    httpOnly: true,
    expires:  new Date(0),
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return apiResponse.success(res, {}, 'Logged out successfully.');
};

// Get me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('weddingId');
    return apiResponse.success(res, { user });
  } catch {
    return apiResponse.error(res, 'Failed to get user.', 500);
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose)
      return apiResponse.error(res, 'Email and purpose required.', 400);

    const otp = generateOTP();
    await OTP.deleteMany({ email: email.toLowerCase(), purpose });
    await OTP.create({
      email:    email.toLowerCase(),
      otp,
      purpose,
      expiresAt: getExpiry(),
    });

    await sendOTPEmail(email, otp, purpose);
    return apiResponse.success(res, {}, 'New OTP sent to your email.');
  } catch (error) {
    return apiResponse.error(res, 'Failed to resend OTP.', 500);
  }
};

module.exports = {
  registerSendOTP, registerVerifyOTP,
  loginSendOTP, loginVerifyOTP,
  logout, getMe, resendOTP,
};
