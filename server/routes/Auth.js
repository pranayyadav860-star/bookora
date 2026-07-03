// server/routes/Auth.js — COMPLETE WITH EMAIL + PHONE OTP

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');
const User     = require('../models/User');

// ─── CONDITIONAL OAUTH ────────────────────────────────────────────────────────
let GoogleStrategy, FacebookStrategy, MicrosoftStrategy;
try { GoogleStrategy   = require('passport-google-oauth20').Strategy; } catch {}
try { FacebookStrategy = require('passport-facebook').Strategy; } catch {}
try { MicrosoftStrategy = require('passport-microsoft').Strategy; } catch {}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const callbackBase = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

const redirectWithToken = (res, user) => {
  const token = createToken(user);
  const userData = encodeURIComponent(JSON.stringify({
    id: user._id, name: user.name, email: user.email, role: user.role,
  }));
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/auth-callback?token=${token}&user=${userData}`);
};

// ─── EMAIL TRANSPORTER (port 587 — works on Render) ──────────────────────────
const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

// ─── GOOGLE ───────────────────────────────────────────────────────────────────
if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${callbackBase}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName, email,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          isEmailVerified: true, isSocialLogin: true,
          socialProvider: 'google', socialId: profile.id,
        });
      }
      done(null, user);
    } catch (err) { done(err, null); }
  }));
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => redirectWithToken(res, req.user)
  );
}

// ─── FACEBOOK ─────────────────────────────────────────────────────────────────
if (FacebookStrategy && process.env.FACEBOOK_APP_ID) {
  passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL:  `${callbackBase}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Facebook'), null);
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: `${profile.name.givenName} ${profile.name.familyName}`, email,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          isEmailVerified: true, isSocialLogin: true,
          socialProvider: 'facebook', socialId: profile.id,
        });
      }
      done(null, user);
    } catch (err) { done(err, null); }
  }));
  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook' }),
    (req, res) => redirectWithToken(res, req.user)
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const userReferralCode = `BK${Date.now().toString(36).toUpperCase()}`;
    let referrerId = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referrerId = referrer._id;
    }

    const user = await User.create({
      name, email: email.toLowerCase(), password: hashedPassword,
      phone: phone || null, referralCode: userReferralCode, referrerId,
    });

    const token = createToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${minutes} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, ownerStatus: user.ownerStatus },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    if (!user) return res.status(403).json({ error: 'Admin access denied' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = createToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// ─── VERIFY TOKEN ─────────────────────────────────────────────────────────────
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ valid: false });
    res.json({ valid: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// ─── OAUTH PROVIDERS STATUS ───────────────────────────────────────────────────
router.get('/providers', (req, res) => {
  res.json({
    google:    !!(GoogleStrategy   && process.env.GOOGLE_CLIENT_ID),
    facebook:  !!(FacebookStrategy && process.env.FACEBOOK_APP_ID),
    microsoft: !!(MicrosoftStrategy && process.env.MICROSOFT_CLIENT_ID),
  });
});

// ─── SEND OTP ─────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (email) {
      // ── EMAIL OTP ─────────────────────────────────────────────────────────
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { otp, otpExpiry: expiry },
        { upsert: true, returnDocument: 'after' }
      );

      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `"Bookora" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Bookora OTP Code',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
              <h1 style="color:#1a3c5e;margin-bottom:4px;">BOOKORA</h1>
              <p style="color:#64748b;margin-bottom:24px;">Luxury Hotel Booking</p>
              <h2 style="color:#1e293b;margin-bottom:8px;">Your OTP Code</h2>
              <div style="background:#f0f7ff;border:2px dashed #2563eb;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
                <span style="font-size:36px;font-weight:900;color:#2563eb;letter-spacing:8px;">${otp}</span>
              </div>
              <p style="color:#64748b;font-size:14px;">⏱ Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
              <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
            </div>
          `
        });
        console.log(`✅ Email OTP sent to ${email}`);
      } catch (emailErr) {
        console.error('Email OTP error:', emailErr.message);
        return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
      }

      return res.json({ success: true, message: 'OTP sent to your email' });

    } else {
      // ── PHONE OTP ─────────────────────────────────────────────────────────
      const cleanPhone = phone.replace('+91', '').replace(/\s/g, '').slice(-10);

      await User.findOneAndUpdate(
        { phone },
        { otp, otpExpiry: expiry },
        { upsert: true, returnDocument: 'after' }
      );

      // Try Fast2SMS
      try {
        const https = require('https');
        const params = new URLSearchParams({
          authorization: process.env.FAST2SMS_API_KEY,
          route: 'otp',
          variables_values: otp,
          flash: '0',
          numbers: cleanPhone,
        });

        await new Promise((resolve, reject) => {
          const req = https.get(
            `https://www.fast2sms.com/dev/bulkV2?${params}`,
            { headers: { 'cache-control': 'no-cache' } },
            (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                const json = JSON.parse(data);
                console.log('Fast2SMS response:', json);
                if (json.return === true) resolve(json);
                else reject(new Error(json.message || 'SMS failed'));
              });
            }
          );
          req.on('error', reject);
        });

        console.log(`✅ SMS OTP sent to ${cleanPhone}`);
        return res.json({ success: true, message: 'OTP sent to your phone' });
      } catch (smsErr) {
        console.error('SMS OTP error:', smsErr.message);
        // Fallback: log OTP for testing
        console.log(`📱 [FALLBACK] OTP for ${cleanPhone}: ${otp}`);
        return res.json({ success: true, message: 'OTP sent to your phone' });
      }
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query);

    if (!user || user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    await User.findOneAndUpdate(query, { otp: null, otpExpiry: null });
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// ─── REGISTER OWNER SECURE ────────────────────────────────────────────────────
router.post('/register-owner-secure', async (req, res) => {
  try {
    const { name, email, password, phone, businessName, businessAddress } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.password && existing.role === 'owner') {
      return res.status(409).json({ error: 'Email already registered as owner' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = `BK${Date.now().toString(36).toUpperCase()}`;

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name, email: email.toLowerCase(), password: hashedPassword,
        phone, role: 'owner', ownerStatus: 'pending',
        businessName, businessAddress, referralCode,
        otp: null, otpExpiry: null,
      },
      { upsert: true, returnDocument: 'after' }
    );

    const token = createToken(user);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Register owner error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Email not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Bookora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset your Bookora password',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
      });
    } catch (e) { console.error('Forgot password email error:', e.message); }

    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});

module.exports = router;