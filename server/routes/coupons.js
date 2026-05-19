const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const Hotel = require("../models/Hotel");
const auth = require("../middleware/auth");

// ========== PUBLIC ROUTES ==========

// Get all active coupons for customers (Public)
router.get("/active", async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    }).limit(10);
    
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Validate coupon (Public)
router.post("/validate", async (req, res) => {
  try {
    const { code, amount, hotelId } = req.body;
    
    const coupon = await Coupon.findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });
    
    if (!coupon) {
      return res.json({ valid: false, msg: "Invalid coupon code" });
    }
    
    // Check if coupon applies to this hotel
    // Admin global coupons (isGlobal=true) apply to all hotels
    // Owner coupons (isGlobal=false) only apply to their assigned hotels
    if (!coupon.isGlobal && coupon.applicableHotelIds && coupon.applicableHotelIds.length > 0 && hotelId) {
      if (!coupon.applicableHotelIds.includes(hotelId)) {
        return res.json({ valid: false, msg: "Coupon not valid for this hotel" });
      }
    }
    
    if (amount < coupon.minBookingAmount) {
      return res.json({ valid: false, msg: `Minimum booking amount of ₹${coupon.minBookingAmount} required` });
    }
    
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }
    
    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountAmount: Math.round(discountAmount),
        discountValue: coupon.discountValue,
        discountType: coupon.discountType,
        description: coupon.description
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, msg: "Server error" });
  }
});

// ========== OWNER ROUTES ==========

// Get coupons for owner (ONLY owner's own coupons, not global admin coupons)
router.get("/owner/my-coupons", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    let coupons;
    if (req.user.role === "admin") {
      // Admin can see all coupons
      coupons = await Coupon.find({}).sort({ createdAt: -1 });
    } else {
      // Owner sees ONLY their own coupons (isGlobal=false and ownerId matches)
      coupons = await Coupon.find({ 
        ownerId: req.user.id,
        isGlobal: false
      }).sort({ createdAt: -1 });
    }
    
    // Populate hotel names for applicable hotels
    const couponsWithHotels = await Promise.all(coupons.map(async (coupon) => {
      const couponObj = coupon.toObject();
      if (couponObj.applicableHotelIds && couponObj.applicableHotelIds.length > 0) {
        const hotels = await Hotel.find({ 
          _id: { $in: couponObj.applicableHotelIds } 
        }).select('hotelName city');
        couponObj.applicableHotels = hotels;
      }
      return couponObj;
    }));
    
    res.json(couponsWithHotels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get owner's coupons (legacy - without hotel details)
router.get("/owner-coupons", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    let coupons;
    if (req.user.role === "admin") {
      coupons = await Coupon.find({}).sort({ createdAt: -1 });
    } else {
      // Owner sees ONLY their own coupons (not global ones)
      coupons = await Coupon.find({ 
        ownerId: req.user.id,
        isGlobal: false
      }).sort({ createdAt: -1 });
    }
    
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create coupon (Owner or Admin)
router.post("/create", auth, async (req, res) => {
  try {
    const { 
      code, discountValue, discountType, minBookingAmount, maxDiscount, 
      validUntil, applicableHotelIds, isGlobal, description, usageLimit,
      perUserLimit, firstTimeOnly, newUserOnly, autoApply, stackable,
      minimumNights, advanceBookingDays, couponType
    } = req.body;
    
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ msg: "Coupon code already exists" });
    }
    
    const couponData = {
      code: code.toUpperCase(),
      description: description || `${discountValue}% off`,
      discountType: discountType || "percentage",
      discountValue: Number(discountValue) || 20,
      minBookingAmount: Number(minBookingAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      validFrom: new Date(),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: Number(perUserLimit) || 1,
      usedCount: 0,
      isActive: true,
      minimumNights: Number(minimumNights) || 1,
      advanceBookingDays: Number(advanceBookingDays) || 0,
      firstTimeOnly: firstTimeOnly || false,
      newUserOnly: newUserOnly || false,
      autoApply: autoApply || false,
      stackable: stackable || false,
      couponType: couponType || "discount"
    };
    
    // For Admin: Create global coupon (applies to all hotels)
    if (req.user.role === "admin") {
      couponData.isGlobal = true;
      couponData.applicableHotelIds = [];
      couponData.ownerId = null;
      couponData.ownerEmail = null;
    } 
    // For Owner: Create hotel-specific coupon
    else if (req.user.role === "owner") {
      couponData.isGlobal = false;
      couponData.ownerId = req.user.id;
      couponData.ownerEmail = req.user.email;
      couponData.applicableHotelIds = isGlobal ? [] : (applicableHotelIds || []);
    }
    else {
      return res.status(403).json({ msg: "Unauthorized to create coupons" });
    }
    
    const coupon = await Coupon.create(couponData);
    res.json({ msg: "Coupon created successfully!", coupon });
  } catch (err) {
    console.error("Create coupon error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete coupon
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ msg: "Coupon not found" });
    }
    
    // Check ownership
    if (req.user.role !== "admin") {
      if (coupon.ownerId?.toString() !== req.user.id) {
        return res.status(403).json({ msg: "You can only delete your own coupons" });
      }
    }
    
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ msg: "Coupon deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update coupon (Edit)
router.put("/update/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ msg: "Coupon not found" });
    }
    
    // Check ownership
    if (req.user.role !== "admin" && coupon.ownerId?.toString() !== req.user.id) {
      return res.status(403).json({ msg: "You can only edit your own coupons" });
    }
    
    const updates = req.body;
    delete updates._id;
    delete updates.createdAt;
    delete updates.usedCount;
    
    // If owner is editing and trying to make it global, prevent
    if (req.user.role === "owner" && updates.isGlobal === true) {
      updates.isGlobal = false;
    }
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({ msg: "Coupon updated successfully", coupon: updatedCoupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get owner's hotels for coupon assignment
router.get("/owner-hotels", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    let hotels;
    if (req.user.role === "admin") {
      hotels = await Hotel.find({});
    } else {
      hotels = await Hotel.find({ ownerId: req.user.id });
    }
    
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN ONLY ROUTES ==========

// Get all global coupons (Admin only)
router.get("/admin/global-coupons", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    
    const coupons = await Coupon.find({ isGlobal: true }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all coupons (Admin only) - All coupons including owner coupons
router.get("/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle coupon status (Admin only)
router.put("/toggle/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ msg: "Coupon not found" });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    res.json({ msg: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get coupons for a specific hotel (Public)
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    // Get coupons that are:
    // 1. Admin global coupons (isGlobal=true) OR
    // 2. Owner coupons that specifically apply to this hotel (applicableHotelIds includes hotelId)
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $or: [
        { isGlobal: true },  // Admin global coupons
        { applicableHotelIds: hotelId }  // Owner coupons for this specific hotel
      ]
    }).sort({ discountValue: -1 }).limit(20);
    
    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;