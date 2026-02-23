const Wedding = require('../models/Wedding');
const Guest = require('../models/Guest');
const apiResponse = require('../utils/apiResponse');

const isGuestOrOwner = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Primary owner
    let wedding = await Wedding.findOne({ ownerId: userId });
    if (wedding) {
      req.wedding = wedding;
      req.role = 'owner';
      return next();
    }

    // Co-owner
    wedding = await Wedding.findOne({
      coOwners: userId,
      coOwnerEnabled: true,
    });
    if (wedding) {
      req.wedding = wedding;
      req.role = 'owner';
      return next();
    }

    // Guest
    const guestEntry = await Guest.findOne({
      guestUserId: userId,
      accessGranted: true,
    });
    if (guestEntry) {
      const guestWedding = await Wedding.findById(guestEntry.weddingId);
      if (guestWedding) {
        req.wedding = guestWedding;
        req.role = 'guest';
        return next();
      }
    }

    return apiResponse.error(res, 'Access denied.', 403);
  } catch (error) {
    return apiResponse.error(res, 'Authorization check failed.', 500);
  }
};

module.exports = { isGuestOrOwner };
