const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true },
  accessToken: String,
  refreshToken: String,
  expiresAt: Date
});

module.exports = mongoose.model('User', userSchema); 