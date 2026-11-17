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
  isDesilenced: {
    type: Boolean,
    default: false
  },
  silencedBy: {
    type: String,
    enum: ['manual', 'bot', null],
    default: null
  },
  hipervinculo_conversacion: {
    type: String,
    default: null
  },
  botSilencedAt: {
    type: Date,
    default: null
  },
  derivationDates: {
    type: [Date],
    default: []
  },
  // --- Nuevos campos de contexto y derivación ---
  lastUserMessage: {
    type: String,
    default: null
  },
  derivationReason: {
    type: String,
    default: null
  },
  contactStatus: {
    type: String,
    enum: ['in_bot', 'pending_contact', 'contacted', 'resolved'],
    default: 'in_bot'
  },
  contactedAt: {
    type: Date,
    default: null
  },
  // ----------------------------------------------
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
