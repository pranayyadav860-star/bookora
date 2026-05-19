// server/controllers/paymentController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    let { amount } = req.body;
    
    amount = Number(amount);
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        purpose: 'Hotel Booking'
      }
    };
    
    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      key_id: process.env.RAZORPAY_KEY_ID
    });
    
  } catch (error) {
    console.error('Razorpay error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.description || error.message
    });
  }
};

// Verify Razorpay Payment - FIXED
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData
    } = req.body;
    
    console.log('=== PAYMENT VERIFICATION ===');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    console.log('Signature:', razorpay_signature);
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch');
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }
    
    console.log('Signature verified successfully');
    
    // Generate booking ID
    const bookingId = `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Create booking with payment ID
    const booking = new Booking({
      bookingId: bookingId,
      hotelId: bookingData.hotelId,
      hotelName: bookingData.hotelName,
      city: bookingData.hotelCity,
      roomType: bookingData.roomType,
      roomPrice: bookingData.roomPrice,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests,
      nights: bookingData.nights,
      roomTotal: bookingData.roomTotal || bookingData.roomPrice * bookingData.nights,
      breakfastCost: bookingData.breakfastCost || 0,
      tax: bookingData.tax || 0,
      amount: bookingData.amount,
      paymentMethod: 'Online Payment (Razorpay)',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      userEmail: bookingData.userEmail,
      userName: bookingData.userName,
      userPhone: bookingData.userPhone,
      specialRequests: bookingData.specialRequests || '',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
    
    const savedBooking = await booking.save();
    
    console.log('Booking saved successfully!');
    console.log('Booking ID:', savedBooking.bookingId);
    console.log('Payment ID:', savedBooking.paymentId);
    console.log('Order ID:', savedBooking.orderId);
    
    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking: {
        _id: savedBooking._id,
        bookingId: savedBooking.bookingId,
        hotelName: savedBooking.hotelName,
        amount: savedBooking.amount,
        status: savedBooking.status,
        paymentId: savedBooking.paymentId
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Payment Methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
      { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
      { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All Indian banks' },
    ];
    
    res.json({ success: true, paymentMethods });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Payment Details by ID
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log('Fetching payment details for:', paymentId);
    
    if (!paymentId || paymentId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment ID'
      });
    }
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        created_at: new Date(payment.created_at * 1000)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: error.error?.description || error.message
    });
  }
};

// Get User's All Payments
exports.getUserPayments = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      userEmail: req.user.email,
      paymentId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });
    
    const payments = [];
    
    for (const booking of bookings) {
      if (booking.paymentId && booking.paymentId !== 'undefined') {
        try {
          const payment = await razorpay.payments.fetch(booking.paymentId);
          payments.push({
            bookingId: booking.bookingId,
            hotelName: booking.hotelName,
            amount: payment.amount / 100,
            status: payment.status,
            method: payment.method,
            paymentId: payment.id,
            orderId: payment.order_id,
            date: new Date(payment.created_at * 1000),
            bookingStatus: booking.status
          });
        } catch (e) {
          console.log('Payment not found for:', booking.paymentId);
        }
      }
    }
    
    res.json({
      success: true,
      payments,
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    });
    
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get All Payments (Admin only)
exports.getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const bookings = await Booking.find({ 
      paymentId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });
    
    const payments = [];
    
    for (const booking of bookings) {
      if (booking.paymentId && booking.paymentId !== 'undefined') {
        try {
          const payment = await razorpay.payments.fetch(booking.paymentId);
          payments.push({
            bookingId: booking.bookingId,
            hotelName: booking.hotelName,
            userName: booking.userName,
            userEmail: booking.userEmail,
            amount: payment.amount / 100,
            status: payment.status,
            method: payment.method,
            paymentId: payment.id,
            orderId: payment.order_id,
            date: new Date(payment.created_at * 1000),
            bookingStatus: booking.status
          });
        } catch (e) {
          console.log('Payment not found for:', booking.paymentId);
        }
      }
    }
    
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const successfulPayments = payments.filter(p => p.status === 'captured').length;
    
    res.json({
      success: true,
      payments,
      summary: {
        total: payments.length,
        totalAmount,
        successful: successfulPayments,
        pending: payments.length - successfulPayments
      }
    });
    
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};