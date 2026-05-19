// server/create-coupon.js
// Run this once to create the WELCOME20 coupon

const mongoose = require('mongoose');
require('dotenv').config();

const Coupon = require('./models/Coupon');

async function createCoupon() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    // Check if coupon already exists
    const existing = await Coupon.findOne({ code: "WELCOME20" });
    
    if (existing) {
      console.log("✅ WELCOME20 coupon already exists!");
      console.log(existing);
      mongoose.disconnect();
      return;
    }
    
    // Create new coupon
    const coupon = await Coupon.create({
      code: "WELCOME20",
      description: "20% off on first booking",
      discountType: "percentage",
      discountValue: 20,
      minBookingAmount: 1000,
      maxDiscount: 5000,
      validFrom: new Date(),
      validUntil: new Date("2025-12-31"),
      usageLimit: 1000,
      usedCount: 0,
      isActive: true
    });
    
    console.log("✅ WELCOME20 coupon created successfully!");
    console.log(coupon);
    
  } catch (err) {
    console.error("Error creating coupon:", err);
  } finally {
    mongoose.disconnect();
  }
}

createCoupon();