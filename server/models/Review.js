// server/models/Review.js — UPGRADED
// Verified reviews: only users with completed stays can review

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  hotelId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  userName:  { type: String, required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, required: true, maxlength: 1000 },
  verified:  { type: Boolean, default: true }, // always true — enforced at route level
  helpful:   { type: Number, default: 0 },
  // Owner reply
  ownerReply: {
    text:      { type: String, default: null },
    repliedAt: { type: Date,   default: null },
  },
}, { timestamps: true });

// One review per booking
reviewSchema.index({ bookingId: 1 }, { unique: true });
reviewSchema.index({ hotelId: 1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
