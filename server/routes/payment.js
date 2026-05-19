// server/routes/payment.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentMethods,
  getPaymentDetails,
  getUserPayments,
  getAllPayments
} = require('../controllers/paymentController');

// Razorpay Routes
router.post('/razorpay/create-order', auth, createRazorpayOrder);
router.post('/razorpay/verify', auth, verifyRazorpayPayment);

// Payment Details Routes
router.get('/details/:paymentId', auth, getPaymentDetails);
router.get('/my-payments', auth, getUserPayments);
router.get('/all-payments', auth, getAllPayments);

// Common Routes
router.get('/methods', getPaymentMethods);

module.exports = router;