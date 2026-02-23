const express = require('express');
const router = express.Router();
const {
  getWedding, updateWedding,
  addCoOwner, removeCoOwner, toggleCoOwner
} = require('../controllers/wedding.controller');
const { protect } = require('../middleware/auth');
const { isOwner } = require('../middleware/isOwner');
const { isGuestOrOwner } = require('../middleware/isGuestOrOwner');

router.get('/',                protect, isGuestOrOwner, getWedding);
router.put('/',                protect, isOwner,        updateWedding);
router.post('/co-owner/add',   protect, isOwner,        addCoOwner);
router.delete('/co-owner/:id', protect, isOwner,        removeCoOwner);
router.put('/co-owner/toggle', protect, isOwner,        toggleCoOwner);

module.exports = router;
