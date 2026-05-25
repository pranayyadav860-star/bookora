const crypto = require("crypto");
const Razorpay = require("razorpay");

// ================================
// RAZORPAY INSTANCE
// ================================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================================
// CREATE ORDER
// ================================
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================
// VERIFY PAYMENT
// ================================
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // CHECK REQUIRED FIELDS
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing payment fields",
      });
    }

    // GENERATE SIGNATURE
    const generated_signature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // VERIFY SIGNATURE
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // PAYMENT VERIFIED
    return res.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

  } catch (error) {
    console.error("Razorpay Verify Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================
// GET PAYMENT METHODS
// ================================
exports.getPaymentMethods = async (req, res) => {
  try {
    return res.json({
      success: true,
      methods: [
        "card",
        "upi",
        "netbanking",
        "wallet",
      ],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================
// GET PAYMENT DETAILS
// ================================
exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(
      req.params.paymentId
    );

    return res.json({
      success: true,
      payment,
    });

  } catch (error) {
    console.error("Get Payment Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================
// USER PAYMENTS
// ================================
exports.getUserPayments = async (req, res) => {
  try {
    return res.json({
      success: true,
      payments: [],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================
// ALL PAYMENTS
// ================================
exports.getAllPayments = async (req, res) => {
  try {
    return res.json({
      success: true,
      payments: [],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};