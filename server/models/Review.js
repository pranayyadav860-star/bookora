const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  hotelId: String,
  userName: String,
  rating: Number,
  comment: String
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);