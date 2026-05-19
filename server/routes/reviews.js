const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

/* Add Review */
router.post("/add", async (req, res) => {
  const review = await Review.create(req.body);
  res.json({ msg: "Review Added", review });
});

/* Get Reviews by Hotel */
router.get("/:hotelId", async (req, res) => {
  const data = await Review.find({
    hotelId: req.params.hotelId
  }).sort({ createdAt: -1 });

  res.json(data);
});

module.exports = router;