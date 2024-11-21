const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  town: {
    type: String,
    required: true
  },
  neighborhood: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: false
  },
  profilePicture: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);