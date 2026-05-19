// server/models/Hotel.js
// UPDATED - Added ownerId field

const mongoose = require("mongoose");

/* =========================
   ROOM TYPE (ENHANCED)
========================= */
const roomSchema = new mongoose.Schema({
  name: String,
  price: Number,
  guests: Number,
  beds: String,
  available: Number,
  size: String,
  view: String,
  
  images: {
    type: [String],
    default: []
  },

  breakfast: {
    type: Boolean,
    default: false
  },

  refundable: {
    type: Boolean,
    default: true
  },
  
  amenities: {
    type: [String],
    default: []
  },
  romanticScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  nearBeach: {
    type: Boolean,
    default: false
  },
  hasMountainView: {
    type: Boolean,
    default: false
  },
  businessFriendly: {
    type: Boolean,
    default: false
  },
  familyFriendly: {
    type: Boolean,
    default: false
  },
  aiTags: [String], // For better AI matching
  popularityScore: {
    type: Number,
    default: 0
  }
});

/* =========================
   REVIEW
========================= */
const reviewSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    rating: { type: Number, default: 5 },
    comment: String
  },
  { timestamps: true }
);

/* =========================
   CHILD POLICIES
========================= */
const childPoliciesSchema = new mongoose.Schema({
  infant: { type: String, default: "" },
  children: { type: String, default: "" },
  adultAge: { type: String, default: "" },
  extraBeds: { type: String, default: "" },
  groupPolicy: { type: String, default: "" },
  minGuestAge: { type: Number, default: 1 }
});

/* =========================
   MAP LOCATION
========================= */
const mapLocationSchema = new mongoose.Schema({
  lat: { type: String, default: "" },
  lng: { type: String, default: "" }
});

/* =========================
   HOTEL (ENHANCED)
========================= */
const hotelSchema = new mongoose.Schema({
  // Basic Info
  hotelName: { type: String, required: true },
  city: { type: String, required: true },
  address: String,
  description: String,
  price: { type: Number, required: true },
  rating: { type: Number, default: 4 },
  category: String,
  rooms: Number,
  
  // Owner Info
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  ownerEmail: { type: String, required: true },
  ownerName: { type: String, required: true },
  
  // Highlights
  highlights: { type: [String], default: [] },
  
  // Images
  images: { type: [String], default: [] },
  
  // Booking Stats
  bookings: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  bookedDates: { type: [String], default: [] },
  
  // Room Types
  roomTypes: { type: [roomSchema], default: [] },
  
  // Location Details
  distanceToCity: String,
  distanceToPalace: String,
  distanceToAirport: String,
  distanceToBusStand: String,
  distanceToRailway: String,
  nearbyAttractions: { type: [String], default: [] },
  mapLocation: { type: mapLocationSchema, default: () => ({}) },
  
  // Facilities (Dynamic - User Selected)
  popularFacilities: { type: [String], default: [] },
  roomFeatures: { type: [String], default: [] },
  servicesAndConveniences: { type: [String], default: [] },
  gettingAround: { type: [String], default: [] },
  roomAmenities: { type: [String], default: [] },
  
  // Legacy fields (for backward compatibility)
  languages: { type: [String], default: [] },
  checkinRules: { type: [String], default: [] },
  transport: { type: [String], default: [] },
  nearbyPlaces: { type: [String], default: [] },
  
  // Languages (new field)
  languagesSpoken: { type: [String], default: [] },
  
  // Check-in/out
  checkinFrom: { type: String, default: "12:00 PM" },
  checkoutUntil: { type: String, default: "11:00 AM" },
  
  // Child Policies
  childPolicies: { type: childPoliciesSchema, default: () => ({}) },
  
  // Policies
  cancellationPolicy: { type: String, default: "Free cancellation up to 7 days before check-in" },
  paymentMethods: { type: [String], default: ["Cash", "Card", "UPI"] },
  taxInfo: { type: String, default: "" },
  
  // Contact Info
  contactEmail: String,
  contactPhone: String,
  website: String,
  
  // Reviews
  reviews: { type: [reviewSchema], default: [] }
}, {
  timestamps: true
});



module.exports = mongoose.model("Hotel", hotelSchema);