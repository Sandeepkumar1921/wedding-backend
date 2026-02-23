const multer = require('multer');
const { profileStorage, photoStorage, videoStorage } = require('../config/cloudinary');

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed!'), false);
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files allowed!'), false);
};

const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: err.message });
    else if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

const uploadProfilePhoto = handleUpload(multer({ storage: profileStorage, fileFilter: imageFilter, limits: { fileSize: 20 * 1024 * 1024 } }).single('profilePhoto'));
const uploadPhotos = handleUpload(multer({ storage: photoStorage, fileFilter: imageFilter, limits: { fileSize: 20 * 1024 * 1024 } }).array('photos', 30));
const uploadVideo = handleUpload(multer({ storage: videoStorage, fileFilter: videoFilter, limits: { fileSize: 500 * 1024 * 1024 } }).single('video'));

module.exports = { uploadProfilePhoto, uploadPhotos, uploadVideo };
