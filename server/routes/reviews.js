// server/routes/reviews.js — VERIFIED REVIEWS SYSTEM

const express    = require("express");
const mongoose   = require("mongoose");
const router     = express.Router();
const Review     = require("../models/Review");
const Booking    = require("../models/Booking");
const Hotel      = require("../models/Hotel");
const auth       = require("../middleware/auth");

const toId = (str) => new mongoose.Types.ObjectId(str);

// ─── GET reviews for a hotel ──────────────────────────────────────────────────
router.get("/:hotelId", async (req, res) => {
  try {
    const reviews = await Review.find({ hotelId: req.params.hotelId })
      .sort({ createdAt: -1 }).limit(50);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ─── CHECK if logged-in user can review ──────────────────────────────────────
router.get("/can-review/:hotelId", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log("can-review:", { userId: req.user.id, hotelId: req.params.hotelId, today });

    const booking = await Booking.findOne({
      userId:   toId(req.user.id),
      hotelId:  toId(req.params.hotelId),
      status:   { $in: ["Completed", "Confirmed"] },
      checkOut: { $lt: today },
    });

    console.log("Booking found:", booking ? booking._id : "NONE");

    if (!booking) {
      const existing = await Review.findOne({
        userId:  toId(req.user.id),
        hotelId: req.params.hotelId,
      });
      return res.json({
        canReview:       false,
        alreadyReviewed: !!existing,
        bookingId:       null,
      });
    }

    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      return res.json({ canReview: false, alreadyReviewed: true, bookingId: null });
    }

    return res.json({ canReview: true, bookingId: booking._id, alreadyReviewed: false });
  } catch (err) {
    console.error("can-review error:", err);
    res.status(500).json({ error: "Failed to check review eligibility" });
  }
});

// ─── POST a new verified review ───────────────────────────────────────────────
router.post("/add", auth, async (req, res) => {
  try {
    const { hotelId, bookingId, rating, comment } = req.body;

    if (!hotelId || !bookingId || !rating || !comment)
      return res.status(400).json({ error: "All fields are required" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    if (comment.trim().length < 10)
      return res.status(400).json({ error: "Review must be at least 10 characters" });

    const today = new Date().toISOString().split("T")[0];

    const booking = await Booking.findOne({
      _id:      toId(bookingId),
      userId:   toId(req.user.id),
      hotelId:  toId(hotelId),
      status:   { $in: ["Completed", "Confirmed"] },
      checkOut: { $lt: today },
    });

    if (!booking)
      return res.status(403).json({ error: "You can only review hotels where you have completed a stay" });

    const existing = await Review.findOne({ bookingId: toId(bookingId) });
    if (existing)
      return res.status(400).json({ error: "You have already reviewed this booking" });

    const review = await Review.create({
      hotelId,
      userId:   req.user.id,
      bookingId,
      userName: req.user.name || req.user.email?.split("@")[0] || "Guest",
      rating:   Number(rating),
      comment:  comment.trim(),
      verified: true,
    });

    await Booking.findByIdAndUpdate(bookingId, { reviewGiven: true });

    // Update hotel average rating
    const allReviews = await Review.find({ hotelId });
    const avgRating  = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.map((r) => ({
        name: r.userName, rating: r.rating, comment: r.comment, date: r.createdAt,
      })),
    });

    // Add 50 loyalty points
    try {
      const Loyalty = require("../models/Loyalty");
      let loyalty = await Loyalty.findOne({ userId: req.user.id });
      if (!loyalty) loyalty = await Loyalty.create({ userId: req.user.id });
      loyalty.points         += 50;
      loyalty.lifetimePoints += 50;
      loyalty.transactions.push({
        type: "bonus", points: 50,
        description: `Review bonus for ${booking.hotelName}`,
        date: new Date(),
      });
      loyalty.updateTier();
      await loyalty.save();
    } catch (e) { console.error("Loyalty error:", e.message); }

    res.status(201).json({ success: true, review, message: "Review submitted! +50 loyalty points earned." });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "You have already reviewed this booking" });
    console.error("Review error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ─── Owner reply ──────────────────────────────────────────────────────────────
router.post("/:reviewId/reply", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 5)
      return res.status(400).json({ error: "Reply must be at least 5 characters" });
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { ownerReply: { text: text.trim(), repliedAt: new Date() } },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: "Failed to add reply" });
  }
});

// ─── Mark helpful ─────────────────────────────────────────────────────────────
router.post("/:reviewId/helpful", auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    res.json({ helpful: review.helpful });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark helpful" });
  }
});

module.exports = router;
