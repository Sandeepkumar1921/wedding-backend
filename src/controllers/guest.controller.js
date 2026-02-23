const Guest = require('../models/Guest');
const User = require('../models/User');
const Wedding = require('../models/Wedding');
const apiResponse = require('../utils/apiResponse');

// Get all guests for owner's wedding
const getGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ weddingId: req.wedding._id })
      .sort({ createdAt: -1 });
    return apiResponse.success(res, { guests });
  } catch (error) {
    return apiResponse.error(res, 'Failed to fetch guests.', 500);
  }
};

// Get all weddings where current user is a guest
const getMyGuestWeddings = async (req, res) => {
  try {
    const guestEntries = await Guest.find({
      guestUserId: req.user._id,
      accessGranted: true,
    });

    const weddings = await Promise.all(
      guestEntries.map(async (entry) => {
        const wedding = await Wedding.findById(entry.weddingId);
        if (!wedding) return null;
        const owner = await User.findById(wedding.ownerId).select('username profilePhotoURL');
        return {
          weddingId: wedding._id,
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          marriageDay: wedding.marriageDay,
          marriageMonth: wedding.marriageMonth,
          marriageYear: wedding.marriageYear,
          ownerName: owner?.username || 'Unknown',
          ownerPhoto: owner?.profilePhotoURL || null,
        };
      })
    );

    const validWeddings = weddings.filter(Boolean);
    return apiResponse.success(res, { weddings: validWeddings });
  } catch (error) {
    console.error('getMyGuestWeddings error:', error);
    return apiResponse.error(res, 'Failed to fetch guest weddings.', 500);
  }
};

// Add guest
const addGuest = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return apiResponse.error(res, 'Mobile number required.', 400);

    const guestUser = await User.findOne({ mobile: mobile.trim() });
    if (!guestUser)
      return apiResponse.error(res,
        'No user found with this mobile. They must register first.', 404);

    if (guestUser._id.toString() === req.user._id.toString())
      return apiResponse.error(res, 'You cannot add yourself as guest.', 400);

    const existing = await Guest.findOne({
      weddingId: req.wedding._id,
      guestUserId: guestUser._id,
    });
    if (existing) return apiResponse.error(res, 'Already in guest list.', 409);

    const guest = await Guest.create({
      weddingId: req.wedding._id,
      addedBy: req.user._id,
      guestUserId: guestUser._id,
      guestName: guestUser.username,
      guestEmail: guestUser.email,
      guestMobile: mobile.trim(),
      accessGranted: true,
    });

    return apiResponse.created(res, { guest },
      `${guestUser.username} added as guest!`);
  } catch (error) {
    console.error('Add guest error:', error);
    if (error.code === 11000)
      return apiResponse.error(res, 'Guest already exists.', 409);
    return apiResponse.error(res, 'Failed to add guest.', 500);
  }
};

// Remove guest
const removeGuest = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.guestId,
      weddingId: req.wedding._id,
    });
    if (!guest) return apiResponse.error(res, 'Guest not found.', 404);

    await guest.deleteOne();
    return apiResponse.success(res, {}, 'Guest removed.');
  } catch (error) {
    return apiResponse.error(res, 'Failed to remove guest.', 500);
  }
};

module.exports = { getGuests, addGuest, removeGuest, getMyGuestWeddings };
