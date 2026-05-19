// server/models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "percentage"
  },
  discountValue: {
    type: Number,
    required: true
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 1000
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGlobal: {
    type: Boolean,
    default: true
  },
  applicableHotelIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel"
  }],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  ownerEmail: String
}, {
  timestamps: true
});

module.exports = mongoose.model("Coupon", couponSchema);