const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestMobile: { type: String, required: true },
  accessGranted: { type: Boolean, default: true },
}, { timestamps: true });

guestSchema.index({ weddingId: 1, guestUserId: 1 }, { unique: true });

module.exports = mongoose.model('Guest', guestSchema);
