// server/models/User.js
// UPDATED - Added owner role

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin", "owner"],  // ← Added "owner"
    default: "user"
  },
  phone: {
    type: String,
    default: ""
  },

  hotelIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel"
  }],

wishlist: [{
  hotelId: { type: String, required: true },
  hotelName: { type: String, required: true },
  city: { type: String },
  price: { type: Number },
  rating: { type: Number, default: 4 },
  image: { type: String },
  addedAt: { type: Date, default: Date.now }
}],


 referralCode: { 
  type: String, 
  unique: true, 
  sparse: true 
},
referrerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},
coupons: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Coupon' 
}]
  
}, {
  phone: {
    type: String,
    sparse: true,
    trim: true
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referralPoints: {
    type: Number,
    default: 0
  },
  referredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: {
    type: Boolean,
    default: false
  },

   isSocialLogin: {
    type: Boolean,
    default: false
  },
  socialProvider: {
    type: String,
    enum: ["google", "facebook", "apple", "microsoft", null]
  },
  socialId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  hotelName: String,
  gstNumber: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  totalBookings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});


module.exports = mongoose.model("User", UserSchema);