// server/models/Booking.js
// COMPLETE VERSION

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true },
    userEmail: { type: String, required: true },
    userName: { type: String, default: "" },
    userPhone: { type: String, default: "" },
    hotelId: { type: String, required: true },
    hotelName: { type: String, required: true },
    city: { type: String, default: "" },
    roomType: { type: String, default: "Standard Room" },
    roomPrice: { type: Number, default: 0 },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    guests: { type: Number, default: 1 },
    nights: { type: Number, default: 1 },
    roomTotal: { type: Number, default: 0 },
    breakfastCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    amount: { type: Number, required: true },
     paymentId: { type: String, default: null },      // ← ADD THIS
    orderId: { type: String, default: null }, 
    paymentMethod: { type: String, default: "Pay at Hotel" },
    paymentStatus: { type: String, default: "Pending" },
    upiId: { type: String, default: "" },
    status: { type: String, default: "Confirmed" },
    specialRequests: { type: String, default: "" },
    reviewGiven: { type: Boolean, default: false },
      cancellationReason: { type: String, default: null },
    cancelledBy: { type: String, enum: ['user', 'owner', 'admin', 'system'], default: null },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);