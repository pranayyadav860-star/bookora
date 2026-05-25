const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const User = require("../models/User");

// ============================================
// CONDITIONAL STRATEGY IMPORTS
// ============================================

let GoogleStrategy, FacebookStrategy, MicrosoftStrategy, AppleStrategy;

try {
  GoogleStrategy = require("passport-google-oauth20").Strategy;
} catch (err) {
  console.warn("Google strategy not installed");
}

try {
  FacebookStrategy = require("passport-facebook").Strategy;
} catch (err) {
  console.warn("Facebook strategy not installed");
}

try {
  MicrosoftStrategy = require("passport-microsoft").Strategy;
} catch (err) {
  console.warn("Microsoft strategy not installed");
}

try {
  AppleStrategy = require("passport-apple");
} catch (err) {
  console.warn("Apple strategy not installed");
}

// ============================================
// HELPER
// ============================================

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "7d" }
  );
};

const redirectWithToken = (res, user) => {
  const token = createToken(user);
  const userData = encodeURIComponent(
    JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  );
  res.redirect(`http://localhost:3000/auth-callback?token=${token}&user=${userData}`);
};

// ============================================
// TEST
// ============================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    providers: {
      google: !!GoogleStrategy,
      facebook: !!FacebookStrategy,
      microsoft: !!MicrosoftStrategy,
      apple: !!AppleStrategy,
    },
  });
});

// ============================================
// GOOGLE LOGIN
// ============================================

if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email,
              password: await bcrypt.hash(Math.random().toString(36), 10),
              role: "user",
              isSocialLogin: true,
              socialProvider: "google",
              socialId: profile.id,
            });
          }
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );

  router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  router.get("/google/callback", passport.authenticate("google", { failureRedirect: "http://localhost:3000/login?error=google" }), (req, res) => {
    redirectWithToken(res, req.user);
  });
}

// ============================================
// OTP STORAGE (temporary)
// ============================================

const otpStore = {}; // { phoneOrEmail: { otp, expires } }

// ============================================
// VERIFICATION TOKEN STORAGE (new)
// Stores temporary tokens after OTP is verified.
// Format: { token: { contact, expires } }
// ============================================
const verificationTokenStore = {};

// Optional: Clean up expired verification tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of Object.entries(verificationTokenStore)) {
    if (data.expires < now) {
      delete verificationTokenStore[token];
    }
  }
}, 5 * 60 * 1000);

// ============================================
// SEND OTP
// ============================================

router.post("/send-otp", async (req, res) => {
  try {
    const { phone, email } = req.body;
    const target = phone || email;
    if (!target) {
      return res.status(400).json({ success: false, msg: "Phone number or email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[target] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    console.log(`OTP for ${target}: ${otp}`);

    res.json({ success: true, msg: "OTP sent successfully", otp: process.env.NODE_ENV === "development" ? otp : undefined });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// ============================================
// VERIFY OTP (UPDATED)
// Now returns a temporary verification token instead of creating a user.
// ============================================

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, email, otp } = req.body;
    const target = phone || email;
    if (!target || !otp) {
      return res.status(400).json({ success: false, msg: "Phone/email and OTP required" });
    }

    const savedOtp = otpStore[target];
    if (!savedOtp) return res.status(400).json({ success: false, msg: "OTP not found" });
    if (Date.now() > savedOtp.expires) {
      delete otpStore[target];
      return res.status(400).json({ success: false, msg: "OTP expired" });
    }
    if (savedOtp.otp !== otp) return res.status(400).json({ success: false, msg: "Invalid OTP" });

    // OTP is valid. Generate a temporary verification token (random string)
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // Store it with the contact (email/phone) and expiry (10 minutes)
    verificationTokenStore[verificationToken] = {
      contact: target,
      expires: Date.now() + 10 * 60 * 1000,
    };

    // Clean up OTP
    delete otpStore[target];

    res.json({
      success: true,
      verificationToken, // Send to frontend
      msg: "OTP verified successfully. Please complete registration.",
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// ============================================
// REGISTER (UPDATED)
// Uses verificationToken to create the user with name & password.
// ============================================

router.post("/register", async (req, res) => {
  try {
    const { name, password, verificationToken, email, phone } = req.body;

    console.log("📝 Register request:", { name, verificationToken, email, phone });

    // Validate required fields
    if (!name || !password || !verificationToken) {
      return res.status(400).json({ success: false, msg: "Name, password and verification token are required" });
    }

    // Look up the verification token
    const tokenData = verificationTokenStore[verificationToken];
    if (!tokenData) {
      return res.status(400).json({ success: false, msg: "Invalid or expired verification token. Please verify again." });
    }
    if (Date.now() > tokenData.expires) {
      delete verificationTokenStore[verificationToken];
      return res.status(400).json({ success: false, msg: "Verification token expired. Please request a new OTP." });
    }

    const contact = tokenData.contact; // this is the email or phone that was verified

    // Determine if contact is email or phone
    const isEmail = contact.includes('@');
    const userEmail = isEmail ? contact : (email || null);
    const userPhone = !isEmail ? contact : (phone || null);

    // Check if user already exists with that email or phone
    const existingUser = await User.findOne({
      $or: [
        ...(userEmail ? [{ email: userEmail.toLowerCase() }] : []),
        ...(userPhone ? [{ phone: userPhone }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, msg: "User already exists with this email or phone. Please login." });
    }

    // Create the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: userEmail ? userEmail.toLowerCase() : null,
      phone: userPhone,
      password: hashedPassword,
      role: "user",
      // optionally mark as verified
      isEmailVerified: isEmail,
      isPhoneVerified: !isEmail,
    });

    // Clean up the used verification token
    delete verificationTokenStore[verificationToken];

    // Generate final auth token
    const authToken = createToken(user);

    res.json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ success: false, msg: err.message || "Server error" });
  }
});

// ============================================
// FACEBOOK LOGIN
// ============================================

if (FacebookStrategy && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:5000/api/auth/facebook/callback",
        profileFields: ["id", "displayName", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = `${profile.id}@facebook.user`;
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email,
              password: await bcrypt.hash(Math.random().toString(36), 10),
              role: "user",
              isSocialLogin: true,
              socialProvider: "facebook",
              socialId: profile.id,
            });
          }
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );

  router.get("/facebook", passport.authenticate("facebook", { scope: ["public_profile"] }));
  router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "http://localhost:3000/login?error=facebook" }), (req, res) => {
    redirectWithToken(res, req.user);
  });
}

// ============================================
// MICROSOFT LOGIN
// ============================================

if (MicrosoftStrategy && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/auth/microsoft/callback",
        scope: ["user.read"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName || `${profile.id}@microsoft.user`;
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name: profile.displayName || "Microsoft User",
              email,
              password: await bcrypt.hash(Math.random().toString(36), 10),
              role: "user",
              isSocialLogin: true,
              socialProvider: "microsoft",
              socialId: profile.id,
            });
          }
          return done(null, user);
        } catch (err) {
          console.error("MICROSOFT ERROR:", err);
          return done(err, null);
        }
      }
    )
  );

  router.get("/microsoft", passport.authenticate("microsoft"));
  router.get("/microsoft/callback", passport.authenticate("microsoft", { failureRedirect: "http://localhost:3000/login?error=microsoft" }), (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      const userData = encodeURIComponent(
        JSON.stringify({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role })
      );
      res.redirect(`http://localhost:3000/auth-callback?token=${token}&user=${userData}`);
    } catch (err) {
      console.error("CALLBACK ERROR:", err);
      res.redirect("http://localhost:3000/login?error=microsoft_callback");
    }
  });
}

// ============================================
// APPLE LOGIN
// ============================================

if (AppleStrategy && process.env.APPLE_CLIENT_ID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: "./AuthKey.p8",
        callbackURL: "http://localhost:5000/api/auth/apple/callback",
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          const email = idToken.email || `${idToken.sub}@apple.user`;
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name: "Apple User",
              email,
              password: await bcrypt.hash(Math.random().toString(36), 10),
              role: "user",
              isSocialLogin: true,
              socialProvider: "apple",
              socialId: idToken.sub,
            });
          }
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );

  router.get("/apple", passport.authenticate("apple"));
  router.post("/apple/callback", passport.authenticate("apple", { failureRedirect: "http://localhost:3000/login?error=apple" }), (req, res) => {
    redirectWithToken(res, req.user);
  });
}

// ============================================
// LOGIN ROUTE (FIXED - Supports Email & Phone)
// ============================================

router.post("/login", async (req, res) => {
  try {
    console.log("📝 Login request body:", req.body);

    const { identifier, password, loginMethod } = req.body;

    // Validation
    if (!identifier) {
      return res.status(400).json({ success: false, msg: "Email or phone is required" });
    }
    if (!password) {
      return res.status(400).json({ success: false, msg: "Password is required" });
    }

    let user = null;

    // Email login
    if (loginMethod === "email") {
      user = await User.findOne({ email: identifier.trim().toLowerCase() });
    }
    // Phone login
    else if (loginMethod === "phone") {
      const cleanPhone = identifier.replace(/\D/g, "");
      user = await User.findOne({ phone: cleanPhone });
    }
    // Invalid method
    else {
      return res.status(400).json({ success: false, msg: "Invalid login method" });
    }

    // User not found
    if (!user) {
      return res.status(400).json({ success: false, msg: "User not found. Please register first." });
    }

    console.log("✅ User found:", user.email || user.phone);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: "Incorrect password" });
    }

    // Generate token
    const token = createToken(user);

    // Success response
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message || "Server error" });
  }
});

// ============================================
// CREATE TEST USER (unchanged)
// ============================================

router.post("/create-test-user", async (req, res) => {
  try {
    let user = await User.findOne({ $or: [{ email: "test@bookora.com" }, { phone: "9876543210" }] });
    if (user) {
      return res.json({
        success: true,
        message: "Test user already exists",
        user: { email: "test@bookora.com", phone: "9876543210", password: "Test@123" },
      });
    }

    const hashedPassword = await bcrypt.hash("Test@123", 10);
    user = await User.create({
      name: "Test User",
      email: "test@bookora.com",
      phone: "9876543210",
      password: hashedPassword,
      role: "user",
    });

    res.json({
      success: true,
      message: "Test user created",
      user: { email: "test@bookora.com", phone: "9876543210", password: "Test@123" },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;