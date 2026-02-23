const Video = require('../models/Video');
const Guest = require('../models/Guest');
const { cloudinary } = require('../config/cloudinary');
const apiResponse = require('../utils/apiResponse');

// Get video — supports ?weddingId= param
const getVideo = async (req, res) => {
  try {
    let targetWeddingId = req.wedding._id;

    if (req.query.weddingId && req.query.weddingId !== req.wedding._id.toString()) {
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

    const video = await Video.findOne({ weddingId: targetWeddingId });
    return apiResponse.success(res, { video });
  } catch (error) {
    return apiResponse.error(res, 'Failed to fetch video.', 500);
  }
};

// Upload video
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) return apiResponse.error(res, 'No video uploaded.', 400);

    const existingVideo = await Video.findOne({ weddingId: req.wedding._id });
    if (existingVideo) {
      try {
        await cloudinary.uploader.destroy(existingVideo.cloudinaryPublicId,
          { resource_type: 'video' });
      } catch (err) {
        console.warn('Old video delete failed:', err.message);
      }
      await existingVideo.deleteOne();
    }

    const video = await Video.create({
      weddingId: req.wedding._id,
      uploadedBy: req.user._id,
      cloudinaryUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      fileName: req.file.originalname,
    });

    return apiResponse.created(res, { video }, 'Video uploaded!');
  } catch (error) {
    console.error('Video upload error:', error);
    return apiResponse.error(res, 'Failed to upload video.', 500);
  }
};

// Delete video
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      weddingId: req.wedding._id,
    });
    if (!video) return apiResponse.error(res, 'Video not found.', 404);

    await cloudinary.uploader.destroy(video.cloudinaryPublicId,
      { resource_type: 'video' });
    await video.deleteOne();

    return apiResponse.success(res, {}, 'Video deleted.');
  } catch (error) {
    return apiResponse.error(res, 'Failed to delete video.', 500);
  }
};

module.exports = { getVideo, uploadVideo, deleteVideo };
