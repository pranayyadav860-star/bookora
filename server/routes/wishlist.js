const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const auth = require('../middleware/auth');

router.get('/check/:hotelId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const inWishlist = user.wishlist?.some(
      item => item.hotelId === req.params.hotelId
    ) || false;
    res.json({ inWishlist });
  } catch (err) {
    res.json({ inWishlist: false });
  }
});

router.post('/add/:hotelId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.wishlist) user.wishlist = [];
    const alreadyIn = user.wishlist.some(
      item => item.hotelId === req.params.hotelId
    );
    if (alreadyIn) return res.status(400).json({ error: 'Already in wishlist' });

    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    user.wishlist.push({
      hotelId: req.params.hotelId,
      hotelName: hotel.hotelName,
      city: hotel.city,
      price: hotel.price,
    });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Wishlist add error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/remove/:hotelId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.wishlist = user.wishlist.filter(
      item => item.hotelId !== req.params.hotelId
    );
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

module.exports = router;