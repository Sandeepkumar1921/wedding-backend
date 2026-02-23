const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:            { type: String, required: true, trim: true },
  email:               { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile:              { type: String, required: true, unique: true, trim: true },
  password:            { type: String, required: true, minlength: 6, select: false },
  profilePhotoURL:     { type: String, default: null },
  profilePhotoPublicId:{ type: String, default: null },
  weddingId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', default: null },
  emailVerified:       { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
