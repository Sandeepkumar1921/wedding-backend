const Wedding = require('../models/Wedding');
const apiResponse = require('../utils/apiResponse');

const isOwner = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Primary owner check
    let wedding = await Wedding.findOne({ ownerId: userId });

    // Co-owner check
    if (!wedding) {
      wedding = await Wedding.findOne({
        coOwners: userId,
        coOwnerEnabled: true,
      });
    }

    if (!wedding) {
      return apiResponse.error(res, 'No wedding found for this account.', 404);
    }

    req.wedding = wedding;
    req.role = 'owner';
    next();
  } catch (error) {
    return apiResponse.error(res, 'Authorization failed.', 500);
  }
};

module.exports = { isOwner };
