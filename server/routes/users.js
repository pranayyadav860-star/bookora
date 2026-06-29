const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// ========== WISHLIST ROUTES (MUST COME FIRST) ==========

// GET user's wishlist
router.get('/wishlist', auth, async (req, res) => {
  try {
    const Wishlist = require("../models/Wishlist");
    const wishlist = await Wishlist.find({ user: req.user.id }).populate('hotel').sort({ addedAt: -1 });
    console.log("Wishlist found:", wishlist.length);
    res.json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// ADD to wishlist
router.post('/wishlist/:hotelId', auth, async (req, res) => {
  try {
    const Wishlist = require("../models/Wishlist");
    const existing = await Wishlist.findOne({ user: req.user.id, hotel: req.params.hotelId });
    if (existing) {
      return res.status(400).json({ message: 'Already in wishlist' });
    }
    
    const wishlistItem = await Wishlist.create({ 
      user: req.user.id, 
      hotel: req.params.hotelId 
    });
    await wishlistItem.populate('hotel');
    console.log("Added to wishlist");
    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// REMOVE from wishlist
router.delete('/wishlist/:hotelId', auth, async (req, res) => {
  try {
    const Wishlist = require("../models/Wishlist");
    await Wishlist.findOneAndDelete({ user: req.user.id, hotel: req.params.hotelId });
    console.log("Removed from wishlist");
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// CHECK if in wishlist
router.get('/wishlist/check/:hotelId', auth, async (req, res) => {
  try {
    const Wishlist = require("../models/Wishlist");
    const exists = await Wishlist.findOne({ user: req.user.id, hotel: req.params.hotelId });
    res.json({ inWishlist: !!exists });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== LOYALTY ROUTES ==========

// GET loyalty points
router.get('/loyalty', auth, async (req, res) => {
  try {
    const Loyalty = require("../models/Loyalty");
    let loyalty = await Loyalty.findOne({ userId: req.user.id });
    if (!loyalty) {
      loyalty = await Loyalty.create({ userId: req.user.id });
    }
    res.json(loyalty);
  } catch (error) {
    console.error("Error fetching loyalty:", error);
    res.status(500).json({ error: error.message });
  }
});

// REDEEM loyalty points
router.post('/loyalty/redeem', auth, async (req, res) => {
  try {
    const Loyalty = require("../models/Loyalty");
    const { points } = req.body;
    
    if (!points || points < 100) {
      return res.status(400).json({ message: 'Minimum 100 points required' });
    }
    
    let loyalty = await Loyalty.findOne({ userId: req.user.id });
    if (!loyalty || loyalty.points < points) {
      return res.status(400).json({ message: 'Insufficient points' });
    }
    
    loyalty.points -= points;
    loyalty.transactions.push({
      type: 'redeemed',
      points: points,
      description: `Redeemed ${points} points`,
      date: new Date()
    });
    
    await loyalty.save();
    
    const couponCode = `BOOKORA${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const discountAmount = points / 100;
    
    res.json({ 
      success: true,
      message: `Redeemed ${points} points for ₹${discountAmount} discount`,
      discountAmount: discountAmount,
      couponCode: couponCode,
      remainingPoints: loyalty.points
    });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== USER PROFILE ROUTES ==========

// GET current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ========== ADMIN ONLY ROUTES (KEEP AT THE END) ==========

// GET all users (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// GET single user (Admin only)
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: "Invalid user ID format" });
    }
    
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// UPDATE user role (Admin only)
router.put("/role/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json({ success: true, msg: `User role updated to ${role}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// DELETE user (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: "Cannot delete your own account" });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json({ success: true, msg: `User ${user.email} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Wishlist check
router.get('/wishlist/check/:hotelId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isWishlisted = user.wishlist?.includes(req.params.hotelId) || false;
    res.json({ isWishlisted });
  } catch (err) {
    res.json({ isWishlisted: false });
  }
});

// Wishlist toggle
router.post('/wishlist/toggle/:hotelId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.wishlist) user.wishlist = [];
    const idx = user.wishlist.indexOf(req.params.hotelId);
    if (idx === -1) {
      user.wishlist.push(req.params.hotelId);
    } else {
      user.wishlist.splice(idx, 1);
    }
    await user.save();
    res.json({ isWishlisted: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

module.exports = router;