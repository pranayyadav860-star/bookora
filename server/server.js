const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session'); // ADD THIS
const passport = require('passport'); // ADD THIS

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ============ MIDDLEWARE (ORDER IS CRITICAL!) ============

// 1. CORS - Must be first
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// 2. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session middleware - REQUIRED for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_fallback_session_secret_key_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 4. Passport middleware - MUST be after session
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// PASSPORT SESSION FIX
// ============================================

passport.serializeUser((user, done) => {

  try {

    done(null, user._id);

  } catch (error) {

    done(error, null);

  }

});

passport.deserializeUser(async (id, done) => {

  try {

    const User = require('./models/User');

    const user = await User.findById(id);

    done(null, user);

  } catch (error) {

    done(error, null);

  }

});


// Make io available to routes
app.set('io', io);

// Store connected users
const connectedUsers = new Map(); // userId -> socketId
const connectedOwners = new Map(); // hotelId -> socketId
const activeNegotiations = new Map(); // negotiationId -> negotiation

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Get token from handshake auth
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      socket.userId = decoded.id || decoded.userId;
      socket.userRole = decoded.role;
      socket.userName = decoded.name || decoded.email?.split('@')[0] || 'User';
      
      console.log(`✅ User authenticated: ${socket.userName} (${socket.userRole})`);
      
      // Store user connection
      connectedUsers.set(socket.userId, socket.id);
    } catch (err) {
      console.log('❌ Invalid token:', err.message);
    }
  }
  
  // Owner registers for their hotel
  socket.on('register-owner', (data) => {
    const { hotelId, ownerId } = data;
    if (hotelId) {
      connectedOwners.set(hotelId, socket.id);
      socket.hotelId = hotelId;
      console.log(`🏨 Owner registered for hotel ${hotelId}`);
      
      // Send any pending negotiations for this hotel
      const pendingNegotiations = Array.from(activeNegotiations.values())
        .filter(n => n.hotelId === hotelId && n.status === 'pending');
      
      if (pendingNegotiations.length > 0) {
        socket.emit('pending-negotiations', { negotiations: pendingNegotiations });
        console.log(`📨 Sent ${pendingNegotiations.length} pending negotiations to owner`);
      }
    }
  });
  
  // User starts negotiation
  socket.on('start-negotiation', (data) => {
    const { hotelId, hotelName, message, userBudget, checkIn, checkOut, guests, roomType } = data;
    const userId = socket.userId;
    
    console.log(`💬 Negotiation request from user ${userId} for hotel ${hotelName}`);
    
    if (!userId) {
      socket.emit('negotiation-error', { message: 'Please login to negotiate' });
      return;
    }
    
    const negotiationId = `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const negotiation = {
      id: negotiationId,
      hotelId,
      hotelName,
      userId,
      userName: socket.userName || 'Guest',
      userBudget,
      checkIn,
      checkOut,
      guests,
      roomType,
      messages: [{
        id: Date.now(),
        type: 'user',
        message: message,
        timestamp: new Date().toISOString(),
        sender: socket.userName || 'Guest'
      }],
      status: 'pending',
      createdAt: new Date()
    };
    
    activeNegotiations.set(negotiationId, negotiation);
    console.log(`📝 Created negotiation ${negotiationId}`);
    
    // Notify the owner if online
    const ownerSocketId = connectedOwners.get(hotelId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit('new-negotiation-request', {
        negotiationId,
        hotelId,
        hotelName,
        userId,
        userName: socket.userName || 'Guest',
        message: message,
        userBudget,
        checkIn,
        checkOut,
        guests,
        roomType,
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Sent negotiation request to owner for hotel ${hotelId}`);
      
      socket.emit('negotiation-started', {
        negotiationId,
        message: '✅ Your request has been sent to the hotel owner. They will respond shortly!'
      });
    } else {
      console.log(`⚠️ Owner not online for hotel ${hotelId}`);
      socket.emit('negotiation-started', {
        negotiationId,
        message: '📝 The hotel owner is currently offline. Your message has been saved and will be delivered when they come online.'
      });
    }
  });
  
  // Owner responds to negotiation
  socket.on('owner-response', (data) => {
    const { negotiationId, response, offerPrice, inclusions, specialDeal } = data;
    
    console.log(`💬 Owner response to negotiation ${negotiationId}`);
    
    const negotiation = activeNegotiations.get(negotiationId);
    if (!negotiation) {
      socket.emit('error', { message: 'Negotiation session not found' });
      return;
    }
    
    // Add owner response
    negotiation.messages.push({
      id: Date.now(),
      type: 'owner',
      message: response,
      offerPrice,
      inclusions,
      specialDeal,
      timestamp: new Date().toISOString(),
      sender: 'Hotel Owner'
    });
    negotiation.status = 'responded';
    
    activeNegotiations.set(negotiationId, negotiation);
    
    // Notify the user
    const userSocketId = connectedUsers.get(negotiation.userId);
    if (userSocketId) {
      io.to(userSocketId).emit('owner-response', {
        negotiationId,
        response,
        offerPrice,
        inclusions,
        specialDeal,
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Sent owner response to user ${negotiation.userId}`);
      
      socket.emit('response-sent', { success: true, message: 'Response sent to user' });
    } else {
      console.log(`⚠️ User ${negotiation.userId} is offline`);
      socket.emit('error', { message: 'User is offline. They will see the response when they reconnect.' });
    }
  });
  
  // User responds to owner
  socket.on('user-response', (data) => {
    const { negotiationId, message, acceptOffer, counterPrice } = data;
    
    console.log(`💬 User response to negotiation ${negotiationId}`);
    
    const negotiation = activeNegotiations.get(negotiationId);
    if (!negotiation) return;
    
    negotiation.messages.push({
      id: Date.now(),
      type: 'user',
      message: message,
      acceptOffer,
      counterPrice,
      timestamp: new Date().toISOString(),
      sender: negotiation.userName
    });
    
    activeNegotiations.set(negotiationId, negotiation);
    
    const ownerSocketId = connectedOwners.get(negotiation.hotelId);
    if (ownerSocketId) {
      io.to(ownerSocketId).emit('user-response', {
        negotiationId,
        message,
        acceptOffer,
        counterPrice,
        timestamp: new Date().toISOString(),
        userName: negotiation.userName
      });
      console.log(`📤 Sent user response to owner`);
    }
  });
  
  // User accepts offer
  socket.on('accept-offer', (data) => {
    const { negotiationId, offerDetails } = data;
    
    console.log(`🎉 User accepted offer for negotiation ${negotiationId}`);
    
    const negotiation = activeNegotiations.get(negotiationId);
    if (negotiation) {
      negotiation.status = 'accepted';
      
      const ownerSocketId = connectedOwners.get(negotiation.hotelId);
      if (ownerSocketId) {
        io.to(ownerSocketId).emit('offer-accepted', {
          negotiationId,
          userId: negotiation.userId,
          userName: negotiation.userName,
          offerDetails,
          timestamp: new Date().toISOString()
        });
        console.log(`📤 Sent offer acceptance to owner`);
      }
      
      socket.emit('booking-confirmation', {
        success: true,
        negotiationId,
        offerDetails,
        message: '🎉 Congratulations! Your offer has been accepted. Redirecting to checkout...'
      });
    }
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    // Remove from maps
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🗑️ Removed user ${userId} from connected users`);
        break;
      }
    }
    
    for (const [hotelId, socketId] of connectedOwners.entries()) {
      if (socketId === socket.id) {
        connectedOwners.delete(hotelId);
        console.log(`🗑️ Removed owner for hotel ${hotelId}`);
        break;
      }
    }
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookora';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import Routes
const authRoutes = require('./routes/Auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const couponRoutes = require('./routes/coupons');
const newsletterRoutes = require('./routes/newsletter');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const aiAssistantRoutes = require('./routes/aiAssistant');
const aiFeaturesRoutes = require('./routes/aiFeatures');
const negotiationRoutes = require('./routes/negotiation');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/ai-features', aiFeaturesRoutes);
app.use('/api/negotiation', negotiationRoutes);
// server/server.js - Add this line with other routes
app.use("/api/payment", require("./routes/payment"));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    websocket: 'enabled',
    session: req.session ? 'active' : 'inactive',
    passport: req.user ? 'authenticated' : 'not authenticated',
    endpoints: {
      ai_features: '/api/ai-features/languages',
      ai_assistant: '/api/ai/travel-assistant',
      hotels: '/api/hotels',
      payment: '/api/payment',
      auth: '/api/auth'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    session: req.session ? 'active' : 'inactive',
    websocket: {
      connectedUsers: connectedUsers.size,
      connectedOwners: connectedOwners.size,
      activeNegotiations: activeNegotiations.size
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 5000;

// IMPORTANT: Use server.listen, NOT app.listen
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Test URL: http://localhost:${PORT}/api/test`);
  console.log(`🤖 AI Features: http://localhost:${PORT}/api/ai-features/languages`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready for real-time negotiation\n`);
  console.log(`📊 Stats:`);
  console.log(`   - WebSocket: enabled`);
  console.log(`   - Session: enabled`);
  console.log(`   - Passport: enabled`);
  console.log(`   - MongoDB: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
  console.log(`   - Negotiation system: active\n`);
});