const express = require('express');
const router = express.Router();
const { getGuests, addGuest, removeGuest, getMyGuestWeddings } = require('../controllers/guest.controller');
const { protect } = require('../middleware/auth');
const { isOwner } = require('../middleware/isOwner');

router.get('/',              protect, isOwner, getGuests);
router.get('/my-invitations', protect, getMyGuestWeddings);
router.post('/add',          protect, isOwner, addGuest);
router.delete('/:guestId',   protect, isOwner, removeGuest);

module.exports = router;
