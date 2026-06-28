// server/models/Loyalty.js
// NEW: Loyalty points system
// Points earned: ₹100 spent = 1 point. Tiers: Bronze/Silver/Gold/Platinum

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['earned', 'redeemed', 'expired', 'bonus'], required: true },
  points: { type: Number, required: true },
  description: String,
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  date: { type: Date, default: Date.now },
});

const loyaltySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  points: { type: Number, default: 0 },           // Current redeemable points
  lifetimePoints: { type: Number, default: 0 },   // Total ever earned (for tier)
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze',
  },
  transactions: [transactionSchema],
}, { timestamps: true });

// Tier thresholds (lifetime points)
// Bronze: 0–4999 | Silver: 5000–19999 | Gold: 20000–49999 | Platinum: 50000+

loyaltySchema.methods.updateTier = function () {
  if (this.lifetimePoints >= 50000) this.tier = 'Platinum';
  else if (this.lifetimePoints >= 20000) this.tier = 'Gold';
  else if (this.lifetimePoints >= 5000) this.tier = 'Silver';
  else this.tier = 'Bronze';
};

// Helper: points value in rupees (1 point = ₹1)
loyaltySchema.methods.pointsValue = function () {
  return this.points;
};

module.exports = mongoose.model('Loyalty', loyaltySchema);
