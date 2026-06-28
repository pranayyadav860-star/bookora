// server/routes/loyalty.js
// NEW: Loyalty points API endpoints

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Loyalty = require('../models/Loyalty');

// GET /api/loyalty/me — get current user's loyalty data
router.get('/me', auth, async (req, res) => {
  try {
    let loyalty = await Loyalty.findOne({ userId: req.user.id });

    if (!loyalty) {
      // Auto-create on first fetch
      loyalty = await Loyalty.create({ userId: req.user.id });
    }

    res.json({
      points: loyalty.points,
      lifetimePoints: loyalty.lifetimePoints,
      tier: loyalty.tier,
      transactions: loyalty.transactions,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loyalty data' });
  }
});

// POST /api/loyalty/redeem — redeem points during checkout
router.post('/redeem', auth, async (req, res) => {
  try {
    const { pointsToRedeem, bookingId } = req.body;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    const loyalty = await Loyalty.findOne({ userId: req.user.id });
    if (!loyalty) return res.status(404).json({ error: 'No loyalty account found' });

    if (loyalty.points < pointsToRedeem) {
      return res.status(400).json({ error: `Insufficient points. You have ${loyalty.points} points.` });
    }

    // Max redemption: 50% of booking value (handled on client side too)
    loyalty.points -= pointsToRedeem;
    loyalty.transactions.push({
      type: 'redeemed',
      points: pointsToRedeem,
      description: `Redeemed ${pointsToRedeem} points (₹${pointsToRedeem} discount)`,
      bookingId,
      date: new Date(),
    });
    await loyalty.save();

    res.json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountAmount: pointsToRedeem, // 1 point = ₹1
      remainingPoints: loyalty.points,
    });
  } catch (err) {
    res.status(500).json({ error: 'Redemption failed' });
  }
});

// Internal helper — called from bookings route after successful booking
// Do not expose publicly
router.earnPoints = async (userId, bookingAmount, bookingId, hotelName) => {
  try {
    const pointsEarned = Math.floor(bookingAmount / 100); // ₹100 = 1 point
    if (pointsEarned === 0) return 0;

    let loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) loyalty = await Loyalty.create({ userId });

    loyalty.points += pointsEarned;
    loyalty.lifetimePoints += pointsEarned;
    loyalty.transactions.push({
      type: 'earned',
      points: pointsEarned,
      description: `Earned from booking at ${hotelName}`,
      bookingId,
      date: new Date(),
    });
    loyalty.updateTier();
    await loyalty.save();

    return pointsEarned;
  } catch (err) {
    console.error('Loyalty points error:', err.message);
    return 0;
  }
};

module.exports = router;
