// server/routes/Auth.js  — KEY FIXES:
//   1. OAuth callbackURL uses CLIENT_URL env var (not hardcoded localhost)
//   2. redirectWithToken uses CLIENT_URL env var
//   3. JWT uses process.env.JWT_SECRET (startup already validates it exists)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// ─── CONDITIONAL OAUTH STRATEGY IMPORTS ───────────────────────────────────────
let GoogleStrategy, FacebookStrategy, MicrosoftStrategy;

try { GoogleStrategy = require('passport-google-oauth20').Strategy; } catch {}
try { FacebookStrategy = require('passport-facebook').Strategy; } catch {}
try { MicrosoftStrategy = require('passport-microsoft').Strategy; } catch {}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,        // validated at startup — never a fallback
    { expiresIn: '7d' }
  );

// FIXED: CLIENT_URL from env instead of hardcoded localhost:3000
const redirectWithToken = (res, user) => {
  const token = createToken(user);
  const userData = encodeURIComponent(JSON.stringify({
    id: user._id, name: user.name, email: user.email, role: user.role,
  }));
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/auth-callback?token=${token}&user=${userData}`);
};

// FIXED: OAuth callback base from env
const callbackBase = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

// ─── GOOGLE ───────────────────────────────────────────────────────────────────
if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${callbackBase}/api/auth/google/callback`,   // FIXED
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          isEmailVerified: true,
          isSocialLogin: true,
          socialProvider: 'google',
          socialId: profile.id,
        });
      }
      done(null, user);
    } catch (err) { done(err, null); }
  }));

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => redirectWithToken(res, req.user)
  );
}

// ─── FACEBOOK ─────────────────────────────────────────────────────────────────
if (FacebookStrategy && process.env.FACEBOOK_APP_ID) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${callbackBase}/api/auth/facebook/callback`,   // FIXED
    profileFields: ['id', 'emails', 'name'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Facebook'), null);

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: `${profile.name.givenName} ${profile.name.familyName}`,
          email,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          isEmailVerified: true,
          isSocialLogin: true,
          socialProvider: 'facebook',
          socialId: profile.id,
        });
      }
      done(null, user);
    } catch (err) { done(err, null); }
  }));

  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook' }),
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

    // Generate unique referral code
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

    // Account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${minutes} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset on success
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

// ─── OAUTH PROVIDER STATUS ────────────────────────────────────────────────────
router.get('/providers', (req, res) => {
  res.json({
    google: !!(GoogleStrategy && process.env.GOOGLE_CLIENT_ID),
    facebook: !!(FacebookStrategy && process.env.FACEBOOK_APP_ID),
    microsoft: !!(MicrosoftStrategy && process.env.MICROSOFT_CLIENT_ID),
  });
});

module.exports = router;
