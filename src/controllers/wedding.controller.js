const Wedding = require('../models/Wedding');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

const getWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.wedding._id)
      .populate('coOwners', 'username email mobile profilePhotoURL');
    return apiResponse.success(res, { wedding, role: req.role });
  } catch (error) {
    return apiResponse.error(res, 'Failed to fetch wedding.', 500);
  }
};

const updateWedding = async (req, res) => {
  try {
    const { brideName, groomName, marriageDay, marriageMonth, marriageYear } = req.body;
    if (!brideName || !groomName)
      return apiResponse.error(res, 'Bride and groom names required.', 400);

    const wedding = await Wedding.findByIdAndUpdate(
      req.wedding._id,
      { brideName, groomName, marriageDay, marriageMonth, marriageYear },
      { new: true }
    ).populate('coOwners', 'username email mobile profilePhotoURL');

    return apiResponse.success(res, { wedding }, 'Wedding details updated!');
  } catch (error) {
    return apiResponse.error(res, 'Failed to update wedding.', 500);
  }
};

// Add co-owner by mobile
const addCoOwner = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return apiResponse.error(res, 'Mobile number required.', 400);

    const coUser = await User.findOne({ mobile: mobile.trim() });
    if (!coUser)
      return apiResponse.error(res, 'No user found with this mobile.', 404);

    if (coUser._id.toString() === req.user._id.toString())
      return apiResponse.error(res, 'You cannot add yourself as co-owner.', 400);

    // Primary owner ka apna wedding hona chahiye
    const primaryWedding = await Wedding.findOne({ ownerId: req.user._id });
    if (!primaryWedding)
      return apiResponse.error(res, 'Only primary owner can add co-owners.', 403);

    if (primaryWedding.coOwners.includes(coUser._id))
      return apiResponse.error(res, 'Already a co-owner.', 409);

    primaryWedding.coOwners.push(coUser._id);
    await primaryWedding.save();

    const updated = await Wedding.findById(primaryWedding._id)
      .populate('coOwners', 'username email mobile profilePhotoURL');

    return apiResponse.success(res, { wedding: updated },
      `${coUser.username} added as co-owner!`);
  } catch (error) {
    console.error('addCoOwner error:', error);
    return apiResponse.error(res, 'Failed to add co-owner.', 500);
  }
};

// Remove co-owner
const removeCoOwner = async (req, res) => {
  try {
    const primaryWedding = await Wedding.findOne({ ownerId: req.user._id });
    if (!primaryWedding)
      return apiResponse.error(res, 'Only primary owner can remove co-owners.', 403);

    primaryWedding.coOwners = primaryWedding.coOwners.filter(
      id => id.toString() !== req.params.id
    );
    await primaryWedding.save();

    return apiResponse.success(res, {}, 'Co-owner removed.');
  } catch (error) {
    return apiResponse.error(res, 'Failed to remove co-owner.', 500);
  }
};

// Enable/disable co-owner feature
const toggleCoOwner = async (req, res) => {
  try {
    const primaryWedding = await Wedding.findOne({ ownerId: req.user._id });
    if (!primaryWedding)
      return apiResponse.error(res, 'Only primary owner can toggle this.', 403);

    primaryWedding.coOwnerEnabled = !primaryWedding.coOwnerEnabled;
    await primaryWedding.save();

    return apiResponse.success(res, {
      coOwnerEnabled: primaryWedding.coOwnerEnabled
    }, `Co-owner access ${primaryWedding.coOwnerEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    return apiResponse.error(res, 'Failed to toggle co-owner.', 500);
  }
};

module.exports = { getWedding, updateWedding, addCoOwner, removeCoOwner, toggleCoOwner };
