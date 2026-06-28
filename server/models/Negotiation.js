// server/models/Negotiation.js
// NEW: Persists negotiation sessions to MongoDB
// Fixes: negotiation state was only in memory (lost on server restart)

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: Number,
  type: { type: String, enum: ['user', 'owner'], required: true },
  message: { type: String, required: true },
  offerPrice: Number,
  inclusions: [String],
  specialDeal: String,
  acceptOffer: Boolean,
  counterPrice: Number,
  sender: String,
  timestamp: { type: String, default: () => new Date().toISOString() },
});

const negotiationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true },
  hotelName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userBudget: Number,
  checkIn: String,
  checkOut: String,
  guests: Number,
  roomType: String,
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['pending', 'responded', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  },
}, { timestamps: true });

// Index for fast lookup by user or hotel
negotiationSchema.index({ userId: 1 });
negotiationSchema.index({ hotelId: 1, status: 1 });

module.exports = mongoose.model('Negotiation', negotiationSchema);
