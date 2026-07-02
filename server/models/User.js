const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },

    // Role & Owner Status
    role: {
      type: String,
      enum: ["user", "admin", "owner"],
      default: "user",
    },
    ownerStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: null, // Only for owners
    },

    // Verification flags
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Hotel Owner Details
    businessName: {
      type: String,
      default: "",
    },
    gstin: {
      type: String,
      default: "",
    },
    verificationDocs: {
      idProof: { type: String, default: "" },      // file path or URL
      addressProof: { type: String, default: "" }, // file path or URL
    },

    // Existing fields (from your original)
    hotelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ],
    wishlist: [
      {
        hotelId: { type: String, required: true },
        hotelName: { type: String, required: true },
        city: { type: String },
        price: { type: Number },
        rating: { type: Number, default: 4 },
        image: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Referral system
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      
    },
    otp:       { type: String, default: null },
otpExpiry: { type: Date,   default: null },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referralPoints: {
      type: Number,
      default: 0,
    },
    referredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    coupons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
    ],

    // Security
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Social login
    isSocialLogin: {
      type: Boolean,
      default: false,
    },
    socialProvider: {
      type: String,
      enum: ["google", "facebook", "apple", "microsoft", null],
    },
    socialId: {
      type: String,
    },

    // Legacy / duplicate fields (kept for compatibility)
    hotelName: String,
    gstNumber: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    totalBookings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("User", UserSchema);