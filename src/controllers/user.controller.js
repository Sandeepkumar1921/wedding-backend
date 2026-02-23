const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const apiResponse = require('../utils/apiResponse');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('weddingId');
    return apiResponse.success(res, { user });
  } catch (error) {
    return apiResponse.error(res, 'Failed to fetch profile.', 500);
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return apiResponse.error(res, 'No photo uploaded.', 400);

    const user = await User.findById(req.user._id);

    if (user.profilePhotoPublicId) {
      await cloudinary.uploader.destroy(user.profilePhotoPublicId);
    }

    user.profilePhotoURL = req.file.path;
    user.profilePhotoPublicId = req.file.filename;
    await user.save();

    return apiResponse.success(res, {
      profilePhotoURL: user.profilePhotoURL
    }, 'Profile photo updated!');
  } catch (error) {
    console.error('Profile photo error:', error);
    return apiResponse.error(res, 'Failed to update photo.', 500);
  }
};

module.exports = { getProfile, updateProfilePhoto };
