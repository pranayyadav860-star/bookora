const express = require('express');
const router = express.Router();
const aiTravelAssistant = require('../services/aiTravelAssistant');
const Hotel = require('../models/Hotel');

// AI Travel Assistant endpoint
router.post('/travel-assistant', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const result = await aiTravelAssistant.processQuery(query);
    res.json(result);
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

// Debug endpoint to check hotel data structure
router.get('/debug/hotel-fields', async (req, res) => {
  try {
    const sampleHotel = await Hotel.findOne();
    if (sampleHotel) {
      res.json({
        message: "Sample hotel field names",
        fields: Object.keys(sampleHotel.toObject()),
        sample_data: {
          name: sampleHotel.name,
          priceFields: {
            pricePerNight: sampleHotel.pricePerNight,
            price: sampleHotel.price,
            rate: sampleHotel.rate,
            cost: sampleHotel.cost
          },
          cityFields: {
            city: sampleHotel.city,
            location: sampleHotel.location,
            address: sampleHotel.address
          }
        }
      });
    } else {
      res.json({ message: "No hotels found in database" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get similar hotels
router.post('/similar-hotels/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const Hotel = require('../models/Hotel');
    
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    
    const similar = await Hotel.find({
      city: hotel.city,
      _id: { $ne: hotelId },
      pricePerNight: { $gte: hotel.pricePerNight * 0.7, $lte: hotel.pricePerNight * 1.3 }
    }).limit(5);
    
    res.json({ similar_hotels: similar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;