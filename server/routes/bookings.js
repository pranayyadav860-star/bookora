// server/routes/bookings.js
// COMPLETE WITH LOYALTY POINTS + BREVO EMAIL API

const express = require("express");
const router  = express.Router();
const https   = require("https");
const Booking = require("../models/Booking");
const Loyalty = require("../models/Loyalty");
const Hotel   = require("../models/Hotel");
const User    = require("../models/User");
const auth    = require("../middleware/auth");
const { generatePDFInvoice } = require("../utils/pdfInvoice");

/* =========================
   BREVO EMAIL (HTTP API — works on Render, no SMTP needed)
========================= */
const sendEmailBrevo = async (to, subject, html, attachments = []) => {
  const body = JSON.stringify({
    sender:      { name: "Bookora", email: process.env.EMAIL_USER },
    to:          [{ email: to }],
    subject,
    htmlContent: html,
    attachment:  attachments,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.brevo.com",
      path:     "/v3/smtp/email",
      method:   "POST",
      headers: {
        "api-key":        process.env.BREVO_API_KEY,
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`Brevo error ${res.statusCode}: ${data}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
};

console.log("Email configured via Brevo HTTP API");

/* =========================
   HELPER: ADD LOYALTY POINTS
========================= */
async function addLoyaltyPoints(userId, bookingAmount, bookingId, hotelName) {
  try {
    const pointsEarned = Math.floor(bookingAmount / 100);
    if (pointsEarned === 0) return 0;

    console.log(`Calculating points: ₹${bookingAmount} / 100 = ${pointsEarned} points`);

    let loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) {
      console.log(`Creating new loyalty record for user ${userId}`);
      loyalty = await Loyalty.create({ userId, points: 0, lifetimePoints: 0, tier: "Bronze", transactions: [] });
    }

    const oldPoints = loyalty.points;
    const oldTier   = loyalty.tier;

    loyalty.points         += pointsEarned;
    loyalty.lifetimePoints += pointsEarned;
    loyalty.transactions.push({
      type: "earned", points: pointsEarned,
      description: `Earned ${pointsEarned} points from booking at ${hotelName}`,
      bookingId, date: new Date()
    });

    if      (loyalty.lifetimePoints >= 50000) loyalty.tier = "Platinum";
    else if (loyalty.lifetimePoints >= 20000) loyalty.tier = "Gold";
    else if (loyalty.lifetimePoints >= 5000)  loyalty.tier = "Silver";
    else                                       loyalty.tier = "Bronze";

    await loyalty.save();
    console.log(`✅ Added ${pointsEarned} loyalty points to user ${userId}`);
    console.log(`   Old: ${oldPoints} | New: ${loyalty.points} | Tier: ${oldTier} → ${loyalty.tier}`);
    return pointsEarned;
  } catch (error) {
    console.error("❌ Error adding loyalty points:", error);
    return 0;
  }
}

/* =========================
   GET ALL BOOKINGS (Admin)
========================= */
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied. Admin only." });
    const data = await Booking.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error loading bookings" });
  }
});

/* =========================
   GET MY BOOKINGS (User)
========================= */
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const data = await Booking.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error loading bookings" });
  }
});

/* =========================
   ADD BOOKING
========================= */
router.post("/add", async (req, res) => {
  try {
    const bookingData = req.body;
    console.log("Received booking data:", bookingData);

    if (!bookingData.hotelId || !bookingData.hotelName || !bookingData.amount) {
      return res.status(400).json({ msg: "Missing required fields: hotelId, hotelName, amount" });
    }

    if (!bookingData.bookingId) {
      bookingData.bookingId = `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }

    // Attach userId
    if (req.user?.id) {
      bookingData.userId = req.user.id;
    } else if (bookingData.userEmail) {
      const user = await User.findOne({ email: bookingData.userEmail });
      if (user) bookingData.userId = user._id;
    }

    const booking     = new Booking(bookingData);
    const savedBooking = await booking.save();
    console.log("Booking created:", savedBooking._id);

    // Loyalty points
    let pointsEarned = 0;
    if (bookingData.userEmail) {
      const user = await User.findOne({ email: bookingData.userEmail });
      if (user) {
        pointsEarned = await addLoyaltyPoints(user._id, bookingData.amount, savedBooking._id, bookingData.hotelName);
        await Booking.findByIdAndUpdate(savedBooking._id, { loyaltyPointsEarned: pointsEarned });
      }
    }

    // Hotel booking count
    if (bookingData.hotelId) {
      try { await Hotel.findByIdAndUpdate(bookingData.hotelId, { $inc: { bookings: 1 } }); } catch (e) {}
    }

    // Hotel details for invoice
    let hotelAddress = "", hotelCity = "", hotelCategory = "";
    try {
      const hotel = await Hotel.findById(bookingData.hotelId);
      if (hotel) { hotelAddress = hotel.address || ""; hotelCity = hotel.city || ""; hotelCategory = hotel.category || ""; }
    } catch (e) {}

    // Send confirmation email via Brevo
    let emailSent = false;
    try {
      if (bookingData.userEmail) {
        const guestDetails = {
          fullName: bookingData.userName || "Guest",
          email:    bookingData.userEmail,
          phone:    bookingData.userPhone || "Not provided",
          specialRequests: bookingData.specialRequests || ""
        };
        const hotelDetails = {
          address:  hotelAddress || bookingData.city,
          city:     hotelCity    || bookingData.city,
          category: hotelCategory
        };

        const invoiceBooking = { ...bookingData, loyaltyPointsEarned: pointsEarned };
        const pdfBuffer = await generatePDFInvoice(invoiceBooking, guestDetails, hotelDetails);

        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:20px;text-align:center;border-radius:10px 10px 0 0;">
              <h1 style="color:#eab308;margin:0;">BOOKORA</h1>
              <p style="color:white;margin:5px 0 0;">Booking Confirmed! 🎉</p>
            </div>
            <div style="padding:20px;background:white;">
              <h2>Dear ${guestDetails.fullName},</h2>
              <p>Your booking has been successfully confirmed. Please find your invoice attached.</p>
              <div style="background:#f3f4f6;padding:15px;border-radius:10px;margin:20px 0;">
                <p><strong>🏨 Hotel:</strong> ${bookingData.hotelName}</p>
                <p><strong>📅 Check-in:</strong> ${new Date(bookingData.checkIn).toLocaleDateString()}</p>
                <p><strong>📅 Check-out:</strong> ${new Date(bookingData.checkOut).toLocaleDateString()}</p>
                <p><strong>💰 Total Amount:</strong> ₹${bookingData.amount}</p>
                <p><strong>🆔 Booking ID:</strong> ${bookingData.bookingId}</p>
                ${pointsEarned > 0 ? `<p><strong>⭐ Loyalty Points Earned:</strong> +${pointsEarned} points</p>` : ""}
              </div>
              <p>Your invoice is attached to this email.</p>
              <p>For assistance, contact us at support@bookora.com</p>
              <hr style="margin:20px 0;">
              <p style="font-size:12px;color:#6b7280;text-align:center;">Bookora - Luxury Hotel Booking Platform</p>
            </div>
          </div>
        `;

        await sendEmailBrevo(
          bookingData.userEmail,
          `Booking Confirmed - ${bookingData.hotelName} | Bookora`,
          emailHtml,
          [{ name: `Invoice_${bookingData.bookingId}.pdf`, content: pdfBuffer.toString("base64") }]
        );

        console.log("Email sent successfully to:", bookingData.userEmail);
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr.message);
    }

    res.json({
      msg: "Booking Confirmed",
      bookingId: bookingData.bookingId,
      booking: savedBooking,
      emailSent,
      loyaltyPointsEarned: pointsEarned
    });

  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ msg: "Booking Failed", error: err.message });
  }
});

/* =========================
   CANCEL BOOKING (User)
========================= */
router.put("/cancel/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.userEmail !== req.user.email) return res.status(403).json({ msg: "You can only cancel your own bookings" });
    if (booking.status === "Cancelled") return res.status(400).json({ msg: "Booking is already cancelled" });

    booking.status        = "Cancelled";
    booking.paymentStatus = "Cancelled";
    await booking.save();

    if (booking.hotelId) {
      try { await Hotel.findByIdAndUpdate(booking.hotelId, { $inc: { bookings: -1 } }); } catch (e) {}
    }

    try {
      await sendEmailBrevo(
        booking.userEmail,
        `Booking Cancelled - ${booking.hotelName} | Bookora`,
        `<div style="font-family:Arial;padding:20px;">
          <h1 style="color:#1a3c5e;">BOOKORA</h1>
          <h2>Booking Cancelled</h2>
          <p>Your booking for <strong>${booking.hotelName}</strong> has been cancelled.</p>
          <p>Refund will be processed within 5-7 business days.</p>
          <p>Booking ID: ${booking.bookingId || booking._id}</p>
        </div>`
      );
    } catch (e) { console.error("Cancel email error:", e.message); }

    res.json({ msg: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel Error:", err);
    res.status(500).json({ msg: "Failed to cancel booking" });
  }
});

/* =========================
   CANCEL BOOKING (Owner/Admin)
========================= */
router.put("/cancel-by-owner/:id", auth, async (req, res) => {
  try {
    const { reason, cancelledBy } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) return res.status(404).json({ msg: "Hotel not found" });

    const isAuthorized = req.user.role === "admin" ||
      (hotel.ownerId && hotel.ownerId.toString() === req.user.id);
    if (!isAuthorized) return res.status(403).json({ msg: "Not authorized" });
    if (booking.status === "Cancelled") return res.status(400).json({ msg: "Already cancelled" });

    booking.status              = "Cancelled";
    booking.paymentStatus       = "Cancelled";
    booking.cancellationReason  = reason || "Cancelled by hotel";
    booking.cancelledBy         = cancelledBy || (req.user.role === "admin" ? "admin" : "owner");
    booking.cancelledAt         = new Date();
    await booking.save();

    if (booking.hotelId) {
      try { await Hotel.findByIdAndUpdate(booking.hotelId, { $inc: { bookings: -1 } }); } catch (e) {}
    }

    try {
      await sendEmailBrevo(
        booking.userEmail,
        `Booking Cancelled - ${booking.hotelName} | Bookora`,
        `<div style="font-family:Arial;padding:20px;">
          <h1 style="color:#1a3c5e;">BOOKORA</h1>
          <h2>Booking Cancelled</h2>
          <p>Your booking for <strong>${booking.hotelName}</strong> was cancelled.</p>
          <p><strong>Reason:</strong> ${reason || "Hotel management decision"}</p>
          <p>Refund will be processed within 5-7 business days.</p>
          <p>Booking ID: ${booking.bookingId || booking._id}</p>
        </div>`
      );
    } catch (e) { console.error("Cancel email error:", e.message); }

    res.json({ msg: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Owner Cancel Error:", err);
    res.status(500).json({ msg: "Failed to cancel booking", error: err.message });
  }
});

/* =========================
   ADD REVIEW TO BOOKING
========================= */
router.post("/review/:id", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.userEmail !== req.user.email) return res.status(403).json({ msg: "Not your booking" });
    if (booking.reviewGiven) return res.status(400).json({ msg: "Review already given" });

    booking.reviewGiven = true;
    await booking.save();

    if (booking.hotelId) {
      try {
        const hotel = await Hotel.findById(booking.hotelId);
        if (hotel) {
          hotel.reviews.unshift({
            name:    req.user.name || req.user.email.split("@")[0] || "Guest",
            email:   req.user.email,
            rating:  parseInt(rating),
            comment
          });
          const total = hotel.reviews.reduce((sum, r) => sum + Number(r.rating), 0);
          hotel.rating = (total / hotel.reviews.length).toFixed(1);
          await hotel.save({ validateBeforeSave: false });
        }
      } catch (e) { console.error("Hotel review error:", e); }
    }

    res.json({ msg: "Review added successfully", success: true });
  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ msg: "Failed to add review", error: err.message });
  }
});

/* =========================
   UPDATE BOOKING (Admin)
========================= */
router.put("/update/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied" });
    const data = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ msg: "Booking not found" });
    res.json({ msg: "Updated", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Update Error" });
  }
});

/* =========================
   DELETE BOOKING (Admin)
========================= */
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied" });
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Booking not found" });
    res.json({ msg: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete Error" });
  }
});

/* =========================
   DOWNLOAD INVOICE PDF
========================= */
router.get("/invoice/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.userEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    let hotelAddress = "", hotelCity = "", hotelCategory = "";
    try {
      const hotel = await Hotel.findById(booking.hotelId);
      if (hotel) { hotelAddress = hotel.address || ""; hotelCity = hotel.city || ""; hotelCategory = hotel.category || ""; }
    } catch (e) {}

    const guestDetails = {
      fullName: booking.userName || "Guest",
      email:    booking.userEmail,
      phone:    booking.userPhone || "Not provided",
      specialRequests: booking.specialRequests || ""
    };
    const hotelDetails = { address: hotelAddress || booking.city, city: hotelCity || booking.city, category: hotelCategory };

    const pdfBuffer = await generatePDFInvoice(booking, guestDetails, hotelDetails);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${booking.bookingId || booking._id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Invoice download error:", err);
    res.status(500).json({ msg: "Failed to generate invoice", error: err.message });
  }
});

/* =========================
   DELETE BOOKING (Admin)
========================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Access denied. Admin only." });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    await booking.deleteOne();
    res.json({ msg: "Booking deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete Error" });
  }
});

module.exports = router;