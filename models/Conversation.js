const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  whatsappName: {
    type: String,
    default: null
  },
  isSilenced: {
    type: Boolean,
    default: false
  },
  silencedBy: {
    type: String,
    enum: ['manual', 'bot', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);
