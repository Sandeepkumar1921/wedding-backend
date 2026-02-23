const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wedding-memories/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  },
});

const photoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const weddingId = req.user.weddingId?._id
      ? req.user.weddingId._id.toString()
      : req.user.weddingId?.toString() || 'general';
    return {
      folder: `wedding-memories/${weddingId}/photos`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      resource_type: 'image',
    };
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const weddingId = req.user.weddingId?._id
      ? req.user.weddingId._id.toString()
      : req.user.weddingId?.toString() || 'general';
    return {
      folder: `wedding-memories/${weddingId}/videos`,
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      resource_type: 'video',
      chunk_size: 6000000,
    };
  },
});

module.exports = { cloudinary, profileStorage, photoStorage, videoStorage };
