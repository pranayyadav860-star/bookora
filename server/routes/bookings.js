// server/routes/bookings.js
// COMPLETE WITH LOYALTY POINTS INTEGRATION

const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const nodemailer = require("nodemailer");
const auth = require("../middleware/auth");
const { generatePDFInvoice } = require("../utils/pdfInvoice");
 // ← ADDED FOR LOYALTY

/* =========================
   EMAIL CONFIG
========================= */
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("Email transporter configured");
} catch (err) {
  console.error("Email config error:", err);
}

// ========== HELPER FUNCTION: ADD LOYALTY POINTS ==========
async function addLoyaltyPoints(userId, bookingAmount, bookingId, hotelName, userEmail) {
  try {
    const pointsEarned = Math.floor(bookingAmount / 100);
    
    if (pointsEarned === 0) {
      console.log(`Booking amount ₹${bookingAmount} less than ₹100, no points earned`);
      return 0;
    }
    
    console.log(`Calculating points: ₹${bookingAmount} / 100 = ${pointsEarned} points`);
    
    let loyalty = await Loyalty.findOne({ userId: userId });
    if (!loyalty) {
      console.log(`Creating new loyalty record for user ${userId}`);
      loyalty = await Loyalty.create({ 
        userId: userId,
        points: 0,
        lifetimePoints: 0,
        tier: 'Bronze',
        transactions: []
      });
    }
    
    const oldPoints = loyalty.points;
    const oldTier = loyalty.tier;
    
    loyalty.points += pointsEarned;
    loyalty.lifetimePoints += pointsEarned;
    
    loyalty.transactions.push({
      type: 'earned',
      points: pointsEarned,
      description: `Earned ${pointsEarned} points from booking at ${hotelName}`,
      bookingId: bookingId,
      date: new Date()
    });
    
    // Update tier based on lifetime points
    if (loyalty.lifetimePoints >= 50000) loyalty.tier = 'Platinum';
    else if (loyalty.lifetimePoints >= 20000) loyalty.tier = 'Gold';
    else if (loyalty.lifetimePoints >= 5000) loyalty.tier = 'Silver';
    else loyalty.tier = 'Bronze';
    
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
   GET ALL BOOKINGS (Admin only)
========================= */
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only." });
    }
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
   ADD BOOKING (with Email & Invoice & Loyalty Points)
========================= */
router.post("/add", async (req, res) => {
  try {
    const bookingData = req.body;
    
    console.log("Received booking data:", bookingData);
    
    // Validate required fields
    if (!bookingData.hotelId || !bookingData.hotelName || !bookingData.amount) {
      return res.status(400).json({ 
        msg: "Missing required fields: hotelId, hotelName, amount" 
      });
    }
    
    // Generate unique booking ID if not provided
    if (!bookingData.bookingId) {
      bookingData.bookingId = `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    
    // Create booking
    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();
    console.log("Booking created:", savedBooking._id);
    
    // ========== ADD LOYALTY POINTS ==========
    let pointsEarned = 0;
    if (bookingData.userEmail) {
      // Try to find user by email to get userId
      const User = require("../models/User");
      const user = await User.findOne({ email: bookingData.userEmail });
      if (user) {
        pointsEarned = await addLoyaltyPoints(
          user._id, 
          bookingData.amount, 
          savedBooking._id, 
          bookingData.hotelName,
          bookingData.userEmail
        );
      } else {
        console.log("User not found for email:", bookingData.userEmail);
      }
    }
    
    // Increase hotel booking count
    if (bookingData.hotelId) {
      try {
        await Hotel.findByIdAndUpdate(bookingData.hotelId, {
          $inc: { bookings: 1 }
        });
      } catch (hotelErr) {
        console.error("Error updating hotel count:", hotelErr);
      }
    }
    
    // Get hotel details for address
    let hotelAddress = "";
    let hotelCity = "";
    try {
      const hotel = await Hotel.findById(bookingData.hotelId);
      if (hotel) {
        hotelAddress = hotel.address || "";
        hotelCity = hotel.city || "";
      }
    } catch (err) {
      console.error("Error fetching hotel:", err);
    }
    
    // Send email notification
    let emailSent = false;
    try {
      if (transporter && bookingData.userEmail) {
        const guestDetails = {
          fullName: bookingData.userName || "Guest",
          email: bookingData.userEmail,
          phone: bookingData.userPhone || "Not provided",
          specialRequests: bookingData.specialRequests || ""
        };
        
        const hotelDetails = {
          address: hotelAddress || bookingData.city,
          city: hotelCity || bookingData.city
        };
        
        // Generate PDF invoice
        const pdfBuffer = await generatePDFInvoice(bookingData, guestDetails, hotelDetails);
        
        const mailOptions = {
          from: `"Bookora" <${process.env.EMAIL_USER}>`,
          to: bookingData.userEmail,
          subject: `Booking Confirmed - ${bookingData.hotelName} | Bookora`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #eab308; margin: 0;">BOOKORA</h1>
                <p style="color: white; margin: 5px 0 0;">Booking Confirmed! 🎉</p>
              </div>
              <div style="padding: 20px; background: white;">
                <h2>Dear ${guestDetails.fullName},</h2>
                <p>Your booking has been successfully confirmed. Please find your invoice attached.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                  <p><strong>🏨 Hotel:</strong> ${bookingData.hotelName}</p>
                  <p><strong>📅 Check-in:</strong> ${new Date(bookingData.checkIn).toLocaleDateString()}</p>
                  <p><strong>📅 Check-out:</strong> ${new Date(bookingData.checkOut).toLocaleDateString()}</p>
                  <p><strong>💰 Total Amount:</strong> ₹${bookingData.amount}</p>
                  <p><strong>🆔 Booking ID:</strong> ${bookingData.bookingId}</p>
                  ${pointsEarned > 0 ? `<p><strong>⭐ Loyalty Points Earned:</strong> +${pointsEarned} points</p>` : ''}
                </div>
                <p>Your invoice is attached to this email. Please keep it for your records.</p>
                <p>For any assistance, contact us at support@bookora.com</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">Bookora - Luxury Hotel Booking Platform</p>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `Invoice_${bookingData.bookingId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", bookingData.userEmail);
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
    }
    
    res.json({ 
      msg: "Booking Confirmed", 
      bookingId: bookingData.bookingId,
      booking: savedBooking,
      emailSent: emailSent,
      loyaltyPointsEarned: pointsEarned  // ← SEND POINTS TO FRONTEND
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
    
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }
    
    // Check if user owns this booking
    if (booking.userEmail !== req.user.email) {
      return res.status(403).json({ msg: "You can only cancel your own bookings" });
    }
    
    // Check if booking can be cancelled
    if (booking.status === "Cancelled") {
      return res.status(400).json({ msg: "Booking is already cancelled" });
    }
    
    // Update booking status
    booking.status = "Cancelled";
    booking.paymentStatus = "Cancelled";
    await booking.save();
    
    // Decrease hotel booking count
    if (booking.hotelId) {
      try {
        await Hotel.findByIdAndUpdate(booking.hotelId, {
          $inc: { bookings: -1 }
        });
      } catch (hotelErr) {
        console.error("Error updating hotel count:", hotelErr);
      }
    }
    
    // Send cancellation email
    try {
      if (transporter && booking.userEmail) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: booking.userEmail,
          subject: `Booking Cancelled - ${booking.hotelName} | Bookora`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <div style="background: #ef4444; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">BOOKORA</h1>
                <p style="color: white; margin: 5px 0 0;">Booking Cancelled</p>
              </div>
              <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
                <h2>Dear ${booking.userName || "Guest"},</h2>
                <p>Your booking has been successfully cancelled.</p>
                <div style="background: white; padding: 15px; border-radius: 10px; margin: 20px 0;">
                  <p><strong>🏨 Hotel:</strong> ${booking.hotelName}</p>
                  <p><strong>📅 Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
                  <p><strong>📅 Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
                  <p><strong>💰 Refund Amount:</strong> ₹${booking.amount}</p>
                  <p><strong>🆔 Booking ID:</strong> ${booking.bookingId || booking._id}</p>
                </div>
                <p>Refund will be processed within 5-7 business days to your original payment method.</p>
                <p>For any assistance, contact us at support@bookora.com</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">Bookora - Luxury Hotel Booking Platform</p>
              </div>
            </div>
          `
        });
        console.log("Cancellation email sent to:", booking.userEmail);
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
    }
    
    res.json({ msg: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel Error:", err);
    res.status(500).json({ msg: "Failed to cancel booking" });
  }
});

/* =========================
   ADD REVIEW TO BOOKING AND HOTEL
========================= */
router.post("/review/:id", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }
    
    if (booking.userEmail !== req.user.email) {
      return res.status(403).json({ msg: "You can only review your own bookings" });
    }
    
    if (booking.status !== "Confirmed") {
      return res.status(400).json({ msg: "You can only review confirmed bookings" });
    }
    
    if (booking.reviewGiven) {
      return res.status(400).json({ msg: "Review already given for this booking" });
    }
    
    booking.reviewGiven = true;
    await booking.save();
    
    if (booking.hotelId) {
      try {
        const hotel = await Hotel.findById(booking.hotelId);
        
        if (hotel) {
          const newReview = {
            name: req.user.name || req.user.email.split('@')[0] || "Guest",
            email: req.user.email,
            rating: parseInt(rating),
            comment: comment
          };
          
          hotel.reviews.unshift(newReview);
          
          const total = hotel.reviews.reduce((sum, r) => sum + Number(r.rating), 0);
          hotel.rating = (total / hotel.reviews.length).toFixed(1);
          
          await hotel.save({ validateBeforeSave: false });
        }
      } catch (hotelErr) {
        console.error("Error updating hotel:", hotelErr);
      }
    }
    
    res.json({ msg: "Review added successfully", success: true });
    
  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ msg: "Failed to add review", error: err.message });
  }
});

/* =========================
   UPDATE BOOKING STATUS (Admin only)
========================= */
router.put("/update/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    const data = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!data) {
      return res.status(404).json({ msg: "Booking not found" });
    }
    
    res.json({ msg: "Updated", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Update Error" });
  }
});

/* =========================
   DELETE BOOKING (Admin only)
========================= */
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ msg: "Booking not found" });
    }
    
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
    
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }
    
    if (booking.userEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    
    let hotelAddress = "";
    let hotelCity = "";
    try {
      const hotel = await Hotel.findById(booking.hotelId);
      if (hotel) {
        hotelAddress = hotel.address || "";
        hotelCity = hotel.city || "";
      }
    } catch (err) {
      console.error("Error fetching hotel:", err);
    }
    
    const guestDetails = {
      fullName: booking.userName || "Guest",
      email: booking.userEmail,
      phone: booking.userPhone || "Not provided",
      specialRequests: booking.specialRequests || ""
    };
    
    const hotelDetails = {
      address: hotelAddress || booking.city,
      city: hotelCity || booking.city
    };
    
    const pdfBuffer = await generatePDFInvoice(booking, guestDetails, hotelDetails);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${booking.bookingId || booking._id}.pdf`);
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error("Invoice download error:", err);
    res.status(500).json({ msg: "Failed to generate invoice", error: err.message });
  }
});

/* =========================
   CANCEL BOOKING (Owner/Admin)
========================= */
router.put("/cancel-by-owner/:id", auth, async (req, res) => {
  try {
    const { reason, cancelledBy } = req.body;
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }
    
    // Check if user is owner of the hotel or admin
    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found" });
    }
    
    // Allow admin or the hotel owner to cancel
    const isAuthorized = req.user.role === "admin" || 
                         (hotel.ownerId && hotel.ownerId.toString() === req.user.id);
    
    if (!isAuthorized) {
      return res.status(403).json({ msg: "You are not authorized to cancel this booking" });
    }
    
    // Check if booking is already cancelled
    if (booking.status === "Cancelled") {
      return res.status(400).json({ msg: "Booking is already cancelled" });
    }
    
    // Update booking status with cancellation details
    booking.status = "Cancelled";
    booking.paymentStatus = "Cancelled";
    booking.cancellationReason = reason || "Cancelled by hotel";
    booking.cancelledBy = cancelledBy || (req.user.role === "admin" ? "admin" : "owner");
    booking.cancelledAt = new Date();
    await booking.save();
    
    // Decrease hotel booking count
    if (booking.hotelId) {
      try {
        await Hotel.findByIdAndUpdate(booking.hotelId, {
          $inc: { bookings: -1 }
        });
      } catch (hotelErr) {
        console.error("Error updating hotel count:", hotelErr);
      }
    }
    
    // Send cancellation email to customer
    let emailSent = false;
    try {
      if (transporter && booking.userEmail) {
        const cancellationReasonText = reason || "Cancelled by hotel management";
        const cancelledByText = req.user.role === "admin" ? "administrator" : "hotel owner";
        
        await transporter.sendMail({
          from: `"Bookora" <${process.env.EMAIL_USER}>`,
          to: booking.userEmail,
          subject: `Booking Cancelled - ${booking.hotelName} | Bookora`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <div style="background: #ef4444; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">BOOKORA</h1>
                <p style="color: white; margin: 5px 0 0;">Booking Cancelled</p>
              </div>
              <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
                <h2>Dear ${booking.userName || "Customer"},</h2>
                <p>We regret to inform you that your booking has been cancelled by the ${cancelledByText}.</p>
                <div style="background: white; padding: 15px; border-radius: 10px; margin: 20px 0;">
                  <p><strong>🏨 Hotel:</strong> ${booking.hotelName}</p>
                  <p><strong>📅 Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
                  <p><strong>📅 Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
                  <p><strong>💰 Refund Amount:</strong> ₹${booking.amount}</p>
                  <p><strong>🆔 Booking ID:</strong> ${booking.bookingId || booking._id}</p>
                  <p><strong>📝 Cancellation Reason:</strong> ${cancellationReasonText}</p>
                </div>
                <p>Refund will be processed within 5-7 business days to your original payment method.</p>
                <p>If you have any questions, please contact our support team at support@bookora.com</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">Bookora - Luxury Hotel Booking Platform</p>
              </div>
            </div>
          `
        });
        console.log("Cancellation email sent to:", booking.userEmail);
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      // Don't fail the request if email fails
    }
    
    res.json({ 
      msg: "Booking cancelled successfully", 
      booking,
      emailSent: emailSent
    });
    
  } catch (err) {
    console.error("Owner Cancel Error:", err);
    res.status(500).json({ msg: "Failed to cancel booking", error: err.message });
  }
});

module.exports = router;