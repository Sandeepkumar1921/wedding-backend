const mongoose = require('mongoose');

const weddingSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  coOwners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  brideName:     { type: String, default: '', trim: true },
  groomName:     { type: String, default: '', trim: true },
  marriageDay:   { type: String, default: '' },
  marriageMonth: { type: String, default: '' },
  marriageYear:  { type: String, default: '' },
  coOwnerEnabled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Wedding', weddingSchema);
