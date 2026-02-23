const express = require('express');
const router = express.Router();
const { getPhotos, uploadPhotos, deletePhoto } = require('../controllers/photo.controller');
const { protect } = require('../middleware/auth');
const { isOwner } = require('../middleware/isOwner');
const { isGuestOrOwner } = require('../middleware/isGuestOrOwner');
const { uploadPhotos: multerUpload } = require('../middleware/upload');

router.get('/',        protect, isGuestOrOwner, getPhotos);
router.post('/upload', protect, isOwner,        multerUpload, uploadPhotos);
router.delete('/:id',  protect, isOwner,        deletePhoto);

module.exports = router;
