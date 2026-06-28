// server/models/Booking.js
// FIXED: hotelId is now ObjectId (was String) — enables .populate() joins

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true },

    // User info
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userEmail: { type: String, required: true },
    userName: { type: String, default: '' },
    userPhone: { type: String, default: '' },

    // Hotel info — FIXED: was String, now ObjectId for proper joins
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    hotelName: { type: String, required: true },
    city: { type: String, default: '' },

    // Room & dates
    roomType: { type: String, default: 'Standard Room' },
    roomPrice: { type: Number, default: 0 },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    guests: { type: Number, default: 1 },
    nights: { type: Number, default: 1 },

    // Pricing
    roomTotal: { type: Number, default: 0 },
    breakfastCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },

    // Payment
    paymentId: { type: String, default: null },
    orderId: { type: String, default: null },
    paymentMethod: { type: String, default: 'Pay at Hotel' },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    upiId: { type: String, default: '' },

    // Booking status
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Completed', 'No-show'],
      default: 'Confirmed',
    },
    specialRequests: { type: String, default: '' },
    reviewGiven: { type: Boolean, default: false },

    // Cancellation
    cancellationReason: { type: String, default: null },
    cancelledBy: { type: String, enum: ['user', 'owner', 'admin', 'system', null], default: null },
    cancelledAt: { type: Date, default: null },

    // Loyalty points awarded for this booking
    loyaltyPointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for common queries
bookingSchema.index({ userEmail: 1 });
bookingSchema.index({ hotelId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
