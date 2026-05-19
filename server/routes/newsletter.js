// server/routes/newsletter.js
// UPDATED - Sends best available coupon

const express = require("express");
const router = express.Router();
const Newsletter = require("../models/Newsletter");
const Coupon = require("../models/Coupon");
const nodemailer = require("nodemailer");

// Email transporter
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} catch (err) {
  console.error("Email config error:", err);
}

// Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }
    
    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ msg: "Email already subscribed!" });
      } else {
        existing.isActive = true;
        await existing.save();
        return res.json({ msg: "Welcome back! You've been resubscribed." });
      }
    }
    
    // Create new subscription
    const subscription = new Newsletter({
      email: email.toLowerCase(),
      subscribedAt: new Date(),
      isActive: true,
      source: "homepage"
    });
    
    await subscription.save();
    
    // ========== GET BEST AVAILABLE COUPON ==========
    const now = new Date();
    const availableCoupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).sort({ discountValue: -1 }); // Sort by highest discount first
    
    console.log("Available coupons:", availableCoupons.length);
    
    // Select best coupon (highest discount) or default to WELCOME20
    let bestCoupon = availableCoupons[0];
    
    // If no coupon found, create or find WELCOME20
    if (!bestCoupon) {
      bestCoupon = await Coupon.findOne({ code: "WELCOME20" });
      if (!bestCoupon) {
        // Create default coupon if not exists
        bestCoupon = await Coupon.create({
          code: "WELCOME20",
          description: "20% off on first booking",
          discountType: "percentage",
          discountValue: 20,
          minBookingAmount: 0,
          maxDiscount: 5000,
          validFrom: new Date(),
          validUntil: new Date("2025-12-31"),
          usageLimit: 1000,
          usedCount: 0,
          isActive: true
        });
      }
    }
    
    // Get all active coupons for display
    const allActiveCoupons = await Coupon.find({
      isActive: true,
      validUntil: { $gte: now }
    }).limit(5);
    
    // Generate coupon list HTML
    const couponListHtml = allActiveCoupons.map(coupon => {
      const discountText = coupon.discountType === "percentage" 
        ? `${coupon.discountValue}% OFF` 
        : `₹${coupon.discountValue} OFF`;
      return `<li style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 8px;">
        <strong style="color: #eab308;">${coupon.code}</strong> - ${discountText}
        ${coupon.minBookingAmount > 0 ? `<span style="font-size: 12px; color: #666;"> (Min. ₹${coupon.minBookingAmount})</span>` : ''}
      </li>`;
    }).join('');
    
    // Send welcome email with best coupon
    try {
      if (transporter) {
        const discountDisplay = bestCoupon.discountType === "percentage" 
          ? `${bestCoupon.discountValue}% OFF` 
          : `₹${bestCoupon.discountValue} OFF`;
        
        await transporter.sendMail({
          from: `"Bookora" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Welcome to Bookora Newsletter! 🎉",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #eab308; margin: 0;">BOOKORA</h1>
                <p style="color: white;">You're now subscribed!</p>
              </div>
              <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <h2>Welcome to the Bookora Family! 🏨</h2>
                <p>Thank you for subscribing to our newsletter. You'll now receive:</p>
                <ul style="margin: 15px 0;">
                  <li>✨ Exclusive discount codes</li>
                  <li>🏖️ Special weekend deals</li>
                  <li>🏨 New hotel announcements</li>
                  <li>🎉 Festival & holiday offers</li>
                  <li>📱 Early access to sales</li>
                </ul>
                
                <div style="background: #fefce8; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">🎁 Your Exclusive Welcome Offer</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #eab308;">${bestCoupon.code}</p>
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1a1a2e;">${discountDisplay}</p>
                  <p style="margin: 5px 0; font-size: 12px; color: #666;">Valid until: ${new Date(bestCoupon.validUntil).toLocaleDateString()}</p>
                  <a href="http://localhost:3000/hotels" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #eab308; color: #1a1a2e; text-decoration: none; border-radius: 8px; font-weight: bold;">Book Now →</a>
                </div>
                
                ${allActiveCoupons.length > 1 ? `
                <div style="margin-top: 20px;">
                  <p style="font-weight: bold;">Other Active Offers:</p>
                  <ul style="margin: 10px 0;">${couponListHtml}</ul>
                </div>
                ` : ''}
                
                <p style="color: #666; font-size: 12px; margin-top: 20px;">You can unsubscribe anytime by clicking the link in our emails.</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Bookora - Luxury Hotel Booking Platform</p>
              </div>
            </div>
          `
        });
        console.log("Welcome email sent with coupon:", bestCoupon.code);
      }
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }
    
    res.json({ 
      msg: "Successfully subscribed to newsletter! 🎉", 
      coupon: bestCoupon.code 
    });
    
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ msg: "Failed to subscribe" });
  }
});

// Get all active coupons (for display)
router.get("/active-coupons", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).sort({ discountValue: -1 });
    
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch coupons" });
  }
});

// Unsubscribe
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;
    await Newsletter.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isActive: false },
      { new: true }
    );
    res.json({ msg: "Successfully unsubscribed" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to unsubscribe" });
  }
});

// Get all subscribers (Admin only)
router.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort({ subscribedAt: -1 });
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch subscribers" });
  }
});

module.exports = router;