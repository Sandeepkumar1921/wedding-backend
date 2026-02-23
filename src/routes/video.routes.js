const express = require('express');
const router = express.Router();
const { getVideo, uploadVideo, deleteVideo } = require('../controllers/video.controller');
const { protect } = require('../middleware/auth');
const { isOwner } = require('../middleware/isOwner');
const { isGuestOrOwner } = require('../middleware/isGuestOrOwner');
const { uploadVideo: multerUpload } = require('../middleware/upload');

router.get('/',        protect, isGuestOrOwner, getVideo);
router.post('/upload', protect, isOwner,        multerUpload, uploadVideo);
router.delete('/:id',  protect, isOwner,        deleteVideo);

module.exports = router;
