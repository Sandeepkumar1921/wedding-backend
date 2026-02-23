const Photo = require('../models/Photo');
const Guest = require('../models/Guest');
const Wedding = require('../models/Wedding');
const { cloudinary } = require('../config/cloudinary');
const apiResponse = require('../utils/apiResponse');

// Get photos — supports ?weddingId= param for guest viewing other weddings
const getPhotos = async (req, res) => {
  try {
    let targetWeddingId = req.wedding._id;

    // Agar query mein weddingId hai — guest kisi aur ki wedding dekh raha hai
    if (req.query.weddingId && req.query.weddingId !== req.wedding._id.toString()) {
      // Verify karo ki user us wedding ka guest hai
      const guestEntry = await Guest.findOne({
        weddingId: req.query.weddingId,
        guestUserId: req.user._id,
        accessGranted: true,
      });
      if (!guestEntry) {
        return apiResponse.error(res, 'Access denied to this wedding.', 403);
      }
      targetWeddingId = req.query.weddingId;
    }

    const photos = await Photo.find({ weddingId: targetWeddingId })
      .sort({ order: 1, createdAt: 1 });
    return apiResponse.success(res, { photos });
  } catch (error) {
    return apiResponse.error(res, 'Failed to fetch photos.', 500);
  }
};

// Upload photos
const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return apiResponse.error(res, 'No photos uploaded.', 400);

    const existingCount = await Photo.countDocuments({ weddingId: req.wedding._id });

    const photoPromises = req.files.map((file, index) =>
      Photo.create({
        weddingId: req.wedding._id,
        uploadedBy: req.user._id,
        cloudinaryUrl: file.path,
        cloudinaryPublicId: file.filename,
        fileName: file.originalname,
        order: existingCount + index,
      })
    );

    const photos = await Promise.all(photoPromises);
    return apiResponse.created(res, { photos, count: photos.length },
      `${photos.length} photo(s) uploaded!`);
  } catch (error) {
    console.error('Photo upload error:', error);
    return apiResponse.error(res, 'Failed to upload photos.', 500);
  }
};

// Delete photo
const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findOne({
      _id: req.params.id,
      weddingId: req.wedding._id,
    });
    if (!photo) return apiResponse.error(res, 'Photo not found.', 404);

    await cloudinary.uploader.destroy(photo.cloudinaryPublicId);
    await photo.deleteOne();

    return apiResponse.success(res, {}, 'Photo deleted.');
  } catch (error) {
    return apiResponse.error(res, 'Failed to delete photo.', 500);
  }
};

module.exports = { getPhotos, uploadPhotos, deletePhoto };
