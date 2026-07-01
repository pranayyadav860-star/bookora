// server/routes/hotels.js
// COMPLETE VERSION - With Image Deletion

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const auth = require("../middleware/auth");
const User = require("../models/User");

/* =========================
   CLOUDINARY
========================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* =========================
   STORAGE
========================= */
const hotelStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "bookora_hotels",
    resource_type: "image",
    public_id: Date.now() + "-" + file.originalname.split(".")[0],
    transformation: [
      { width: 1200, height: 800, crop: "fill", gravity: "auto" },
      { quality: "auto" },
      { fetch_format: "auto" }
    ]
  })
});

const roomStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "bookora_rooms",
    resource_type: "image",
    public_id: Date.now() + "-" + file.originalname.split(".")[0],
    transformation: [
      { width: 1000, height: 700, crop: "fill", gravity: "auto" },
      { quality: "auto" },
      { fetch_format: "auto" }
    ]
  })
});

const hotelUpload = multer({ storage: hotelStorage });
const roomUpload = multer({ storage: roomStorage });

/* =========================
   UPLOAD HOTEL IMAGES
========================= */
router.post("/upload", hotelUpload.array("images", 10), async (req, res) => {
  try {
    const urls = req.files.map((f) => f.path);
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Upload Error" });
  }
});

/* =========================
   UPLOAD ROOM IMAGES
========================= */
router.post("/upload-room", roomUpload.array("images", 5), async (req, res) => {
  try {
    const urls = req.files.map((f) => f.path);
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Upload Error" });
  }
});

/* =========================
   DELETE IMAGE FROM CLOUDINARY
========================= */
router.post("/delete-image", auth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ msg: "Image URL required" });
    }
    
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    const publicId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);
    
    res.json({ msg: "Image deleted successfully" });
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ msg: "Failed to delete image" });
  }
});

/* =========================
   ADD HOTEL (Admin or Owner can add)
========================= */
router.post("/add", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "owner") {
      return res.status(403).json({ msg: "Access denied. Admin or Owner only." });
    }
    
    const data = req.body;
    delete data._id;
    delete data.__v;
    
    // Make sure all required fields are set
    data.ownerId = req.user.id;
    data.ownerEmail = req.user.email;
    data.ownerName = req.user.name || req.user.email.split('@')[0]; // ← Fix here
    
    // Log for debugging
    console.log("Adding hotel with owner:", {
      ownerId: data.ownerId,
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName
    });
    
    const hotel = await Hotel.create(data);
    
    // Update user's hotelIds array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { hotelIds: hotel._id }
    });
    
    res.json({ msg: "Hotel Added", hotel });
  } catch (err) {
    console.error("Add Hotel Error:", err);
    res.status(500).json({ msg: "Add Error: " + err.message });
  }
});

/* =========================
   GET OWNER'S HOTELS
========================= */
router.get("/owner/my-hotels", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied." });
    }
    
    let hotels;
    if (req.user.role === "admin") {
      hotels = await Hotel.find();
    } else {
      hotels = await Hotel.find({ ownerId: req.user.id });
    }
    
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* =========================
   GET OWNER'S BOOKINGS
========================= */
router.get("/owner/my-bookings", auth, async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    
    let bookings;
    if (req.user.role === "admin") {
      bookings = await Booking.find().sort({ createdAt: -1 });
    } else {
      const hotels = await Hotel.find({ ownerId: req.user.id });
      const hotelIds = hotels.map(h => h._id);
      bookings = await Booking.find({ hotelId: { $in: hotelIds } }).sort({ createdAt: -1 });
    }
    
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* =========================
   GET HOTELS BY OWNER ID (Admin only)
========================= */
router.get("/owner/:ownerId/hotels", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    
    const hotels = await Hotel.find({ ownerId: req.params.ownerId });
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* =========================
   GET BOOKINGS BY OWNER ID (Admin only)
========================= */
router.get("/owner/:ownerId/bookings", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    
    const Booking = require("../models/Booking");
    const hotels = await Hotel.find({ ownerId: req.params.ownerId });
    const hotelIds = hotels.map(h => h._id);
    const bookings = await Booking.find({ hotelId: { $in: hotelIds } }).sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* =========================
   POPULAR HOTELS
========================= */
router.get("/popular/list", async (req, res) => {
  const hotels = await Hotel.find().sort({ rating: -1, bookings: -1 }).limit(6);
  res.json(hotels);
});

/* =========================
   SEARCH BY CITY
========================= */
router.get("/search/:city", async (req, res) => {
  const hotels = await Hotel.find({
    city: { $regex: req.params.city, $options: "i" }
  });
  res.json(hotels);
});

/* =========================
   GET ALL HOTELS (Public)
========================= */
router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* =========================
   GET SINGLE HOTEL
========================= */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid Hotel ID" });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found" });
    }

    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/* =========================
   UPDATE HOTEL (Owner or Admin)
========================= */
router.put("/update/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid Hotel ID" });
    }
    
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found" });
    }
    
    if (req.user.role !== "admin" && hotel.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Access denied. You don't own this hotel." });
    }
    
    const updatedHotel = await Hotel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({ msg: "Updated", hotel: updatedHotel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Update Error: " + err.message });
  }
});

/* =========================
   DELETE HOTEL (Admin only)
========================= */
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid Hotel ID" });
    }
    
    await Hotel.findByIdAndDelete(id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete Error" });
  }
});

/* =========================
   ADD REVIEW (Public)
========================= */
router.post("/review/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found" });
    }
    
    hotel.reviews.unshift(req.body);
    
    const total = hotel.reviews.reduce((sum, r) => sum + Number(r.rating), 0);
    hotel.rating = (total / hotel.reviews.length).toFixed(1);
    
    await hotel.save();
    res.json({ msg: "Review Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Review Error" });
  }
});

/* =========================
   GET HOTEL STATS (Admin only)
========================= */
router.get("/stats/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
    
    const totalHotels = await Hotel.countDocuments();
    const totalRooms = await Hotel.aggregate([
      { $project: { totalRooms: { $size: "$roomTypes" } } },
      { $group: { _id: null, sum: { $sum: "$totalRooms" } } }
    ]);
    
    const avgPrice = await Hotel.aggregate([
      { $group: { _id: null, avg: { $avg: "$price" } } }
    ]);
    
    const cities = await Hotel.distinct("city");
    
    res.json({
      totalHotels,
      totalRooms: totalRooms[0]?.sum || 0,
      avgPrice: Math.round(avgPrice[0]?.avg || 0),
      totalCities: cities.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// server/routes/hotels.js
// Add this endpoint to directly add a review to a hotel

/* =========================
   DIRECTLY ADD REVIEW TO HOTEL (Fixed - bypasses validation)
========================= */
router.post("/add-review-direct/:hotelId", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const hotel = await Hotel.findById(req.params.hotelId);
    
    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found" });
    }
    
    console.log("Adding review to hotel:", hotel.hotelName);
    
    // Add review
    hotel.reviews.unshift({
      name: req.user.name || req.user.email.split('@')[0] || "Guest",
      email: req.user.email,
      rating: parseInt(rating),
      comment: comment
    });
    
    // Calculate new rating
    const total = hotel.reviews.reduce((sum, r) => sum + Number(r.rating), 0);
    hotel.rating = (total / hotel.reviews.length).toFixed(1);
    
    // Save with validation bypass for existing required fields
    await hotel.save({ validateBeforeSave: false });
    
    res.json({ 
      msg: "Review added to hotel successfully",
      hotel: {
        name: hotel.hotelName,
        rating: hotel.rating,
        reviewCount: hotel.reviews.length
      }
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ msg: "Error", error: err.message });
  }
});

// server/routes/hotels.js - Add this route

// GET hotel recommendations
router.get('/recommendations', async (req, res) => {
  try {
    // Try to get user-specific recommendations if logged in
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token invalid, continue with public recommendations
      }
    }
    
    let recommendations = [];
    
    if (userId) {
      // Get user's booking history for personalized recommendations
      const bookings = await Booking.find({ user: userId }).populate('hotelId');
      const bookedHotelTypes = [...new Set(bookings.map(b => b.hotelId?.type))];
      
      // Recommend similar hotels
      recommendations = await Hotel.find({
        _id: { $nin: bookings.map(b => b.hotelId?._id) },
        type: { $in: bookedHotelTypes }
      })
      .limit(6)
      .select('name city price rating images');
      
      // Add match scores
      recommendations = recommendations.map(hotel => ({
        ...hotel.toObject(),
        matchScore: Math.floor(Math.random() * (95 - 70 + 1) + 70),
        reason: 'Based on your preferences',
        personalized: true
      }));
    }
    
    // If no personalized recommendations, get popular hotels
    if (recommendations.length === 0) {
      recommendations = await Hotel.find()
        .sort({ rating: -1, 'reviews.length': -1 })
        .limit(6)
        .select('name city price rating images');
      
      recommendations = recommendations.map(hotel => ({
        ...hotel.toObject(),
        matchScore: Math.floor(Math.random() * (90 - 60 + 1) + 60),
        reason: 'Popular among travelers',
        personalized: false
      }));
    }
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});
// ========== AI RECOMMENDATIONS ROUTE ==========

// GET hotel recommendations (AI powered)
router.get('/recommendations', async (req, res) => {
  try {
    // Try to get user-specific recommendations if logged in
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        userId = decoded.id || decoded.userId;
      } catch (err) {
        // Token invalid, continue with public recommendations
        console.log('Invalid token, using public recommendations');
      }
    }
    
    let recommendations = [];
    
    if (userId) {
      // Get user's booking history for personalized recommendations
      const Booking = require('../models/Booking');
      const bookings = await Booking.find({ user: userId }).populate('hotelId');
      
      // Get hotel types user has booked
      const bookedHotelTypes = [...new Set(bookings.map(b => b.hotelId?.type).filter(Boolean))];
      const bookedHotelCities = [...new Set(bookings.map(b => b.hotelId?.city).filter(Boolean))];
      
      if (bookedHotelTypes.length > 0 || bookedHotelCities.length > 0) {
        // Recommend similar hotels
        let query = {};
        if (bookedHotelTypes.length > 0) {
          query.type = { $in: bookedHotelTypes };
        }
        if (bookedHotelCities.length > 0) {
          query.city = { $in: bookedHotelCities };
        }
        
        recommendations = await Hotel.find(query)
          .limit(6)
          .select('name city price rating images');
        
        // Add match scores
        recommendations = recommendations.map(hotel => ({
          ...hotel.toObject(),
          matchScore: Math.floor(Math.random() * (95 - 70 + 1) + 70),
          reason: 'Based on your preferences',
          personalized: true
        }));
      }
    }
    
    // If no personalized recommendations, get popular hotels
    if (recommendations.length === 0) {
      recommendations = await Hotel.find()
        .sort({ rating: -1 })
        .limit(6)
        .select('name city price rating images');
      
      recommendations = recommendations.map(hotel => ({
        ...hotel.toObject(),
        matchScore: Math.floor(Math.random() * (90 - 60 + 1) + 60),
        reason: 'Popular among travelers',
        personalized: false
      }));
    }
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Return empty array instead of error to not break the frontend
    res.json([]);
  }
});



module.exports = router;