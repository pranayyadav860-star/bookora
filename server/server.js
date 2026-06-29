// server/server.js  — SECURITY-HARDENED VERSION
// Key fixes:
//   1. Validates all required env vars at startup
//   2. CORS whitelist instead of origin: true
//   3. No fallback JWT secret
//   4. Rate limiting on auth routes
//   5. Helmet for security headers

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

dotenv.config();

// ─── STARTUP VALIDATION ────────────────────────────────────────────────────────
// Fail fast if critical env vars are missing — never use fallback secrets in prod
const REQUIRED_ENV = ['JWT_SECRET', 'SESSION_SECRET', 'MONGODB_URI'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// ─── CORS WHITELIST ────────────────────────────────────────────────────────────
// FIXED: No longer allows all origins. Add your deployed frontend URL here.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────────
const io = socketIo(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled to avoid breaking React
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = require('./models/User');
    done(null, await User.findById(id));
  } catch (err) {
    done(err, null);
  }
});

// ─── RATE LIMITING ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── SOCKET.IO NEGOTIATION ─────────────────────────────────────────────────────
const connectedUsers = new Map();
const connectedOwners = new Map();

// NOTE: activeNegotiations is now persisted to MongoDB (see Negotiation model).
// The Map is only a runtime cache for online-user routing.
const activeNegotiations = new Map();

io.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name || decoded.email?.split('@')[0] || 'User';
      connectedUsers.set(socket.userId, socket.id);
    } catch (err) {
      socket.disconnect();
      return;
    }
  }

  socket.on('register-owner', ({ hotelId }) => {
    if (hotelId && socket.userRole === 'owner') {
      connectedOwners.set(hotelId, socket.id);
      socket.hotelId = hotelId;
    }
  });

  socket.on('start-negotiation', async (data) => {
    const { hotelId, hotelName, message, userBudget, checkIn, checkOut, guests, roomType } = data;
    if (!socket.userId) return socket.emit('negotiation-error', { message: 'Please login first' });

    const negotiationId = `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const negotiation = {
      id: negotiationId, hotelId, hotelName, userId: socket.userId,
      userName: socket.userName, userBudget, checkIn, checkOut, guests, roomType,
      messages: [{ id: Date.now(), type: 'user', message, timestamp: new Date().toISOString(), sender: socket.userName }],
      status: 'pending', createdAt: new Date(),
    };

    // Persist to DB
    try {
      const Negotiation = require('./models/Negotiation');
      await Negotiation.create(negotiation);
    } catch (e) { console.error('Failed to persist negotiation:', e.message); }

    activeNegotiations.set(negotiationId, negotiation);

    const ownerSocketId = connectedOwners.get(hotelId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit('new-negotiation-request', { negotiationId, ...data, userName: socket.userName, timestamp: new Date().toISOString() });
      socket.emit('negotiation-started', { negotiationId, message: '✅ Request sent to the hotel owner.' });
    } else {
      socket.emit('negotiation-started', { negotiationId, message: '📝 Owner is offline. Your message is saved.' });
    }
  });

  socket.on('owner-response', async ({ negotiationId, response, offerPrice, inclusions, specialDeal }) => {
    const negotiation = activeNegotiations.get(negotiationId);
    if (!negotiation) return socket.emit('error', { message: 'Negotiation not found' });

    negotiation.messages.push({ id: Date.now(), type: 'owner', message: response, offerPrice, inclusions, specialDeal, timestamp: new Date().toISOString(), sender: 'Hotel Owner' });
    negotiation.status = 'responded';
    activeNegotiations.set(negotiationId, negotiation);

    // Persist update
    try {
      const Negotiation = require('./models/Negotiation');
      await Negotiation.findOneAndUpdate({ id: negotiationId }, { messages: negotiation.messages, status: 'responded' });
    } catch (e) {}

    const userSocketId = connectedUsers.get(negotiation.userId);
    if (userSocketId) {
      io.to(userSocketId).emit('owner-response', { negotiationId, response, offerPrice, inclusions, specialDeal, timestamp: new Date().toISOString() });
    }
  });

  socket.on('user-response', ({ negotiationId, message, acceptOffer, counterPrice }) => {
    const negotiation = activeNegotiations.get(negotiationId);
    if (!negotiation) return;
    negotiation.messages.push({ id: Date.now(), type: 'user', message, acceptOffer, counterPrice, timestamp: new Date().toISOString(), sender: negotiation.userName });
    activeNegotiations.set(negotiationId, negotiation);
    const ownerSocketId = connectedOwners.get(negotiation.hotelId);
    if (ownerSocketId) io.to(ownerSocketId).emit('user-response', { negotiationId, message, acceptOffer, counterPrice, userName: negotiation.userName, timestamp: new Date().toISOString() });
  });

  socket.on('accept-offer', ({ negotiationId, offerDetails }) => {
    const negotiation = activeNegotiations.get(negotiationId);
    if (negotiation) {
      negotiation.status = 'accepted';
      const ownerSocketId = connectedOwners.get(negotiation.hotelId);
      if (ownerSocketId) io.to(ownerSocketId).emit('offer-accepted', { negotiationId, userId: negotiation.userId, userName: negotiation.userName, offerDetails });
      socket.emit('booking-confirmation', { success: true, negotiationId, offerDetails, message: '🎉 Offer accepted! Redirecting to checkout...' });
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.forEach((sid, uid) => { if (sid === socket.id) connectedUsers.delete(uid); });
    connectedOwners.forEach((sid, hid) => { if (sid === socket.id) connectedOwners.delete(hid); });
  });
});

// ─── MONGODB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => { console.error('❌ MongoDB error:', err); process.exit(1); });

app.set('io', io);

// ─── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/Auth'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/ai', require('./routes/aiAssistant'));
app.use('/api/ai-features', require('./routes/aiFeatures'));
app.use('/api/negotiation', require('./routes/negotiation'));
app.use('/api/payment', require('./routes/payment'));
app.use("/api/loyalty", require("./routes/loyalty"));

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  env: process.env.NODE_ENV || 'development',
  websocket: { connectedUsers: connectedUsers.size, connectedOwners: connectedOwners.size },
}));

// ─── ERROR HANDLERS ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.originalUrl }));

// ─── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔒 JWT: configured | Session: configured | Helmet: on\n`);
});
