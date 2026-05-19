const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

let io;

class WebSocketService {
  constructor(server) {
    io = socketIO(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.userSockets = new Map(); // userId -> socketId
    this.ownerSockets = new Map(); // hotelId -> socketId
    this.activeNegotiations = new Map(); // negotiationId -> {user, owner, messages}

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.userId;
          socket.userRole = decoded.role;
          socket.userName = decoded.name;
        } catch (err) {
          console.log('Invalid token');
        }
      }
      next();
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Store user connection
      if (socket.userId) {
        this.userSockets.set(socket.userId, socket.id);
        console.log(`User ${socket.userId} connected`);
      }

      // Owner registers their hotel
      socket.on('register-owner', async (data) => {
        const { hotelId, ownerId } = data;
        if (hotelId) {
          this.ownerSockets.set(hotelId, socket.id);
          socket.hotelId = hotelId;
          console.log(`Owner registered for hotel ${hotelId}`);
          
          // Notify owner of pending inquiries
          await this.sendPendingInquiries(hotelId);
        }
      });

      // User initiates negotiation with hotel
      socket.on('start-negotiation', async (data) => {
        const { hotelId, hotelName, message, userBudget, checkIn, checkOut, guests, roomType } = data;
        const userId = socket.userId;
        
        if (!userId) {
          socket.emit('negotiation-error', { message: 'Please login to negotiate' });
          return;
        }

        const negotiationId = `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store negotiation session
        this.activeNegotiations.set(negotiationId, {
          id: negotiationId,
          hotelId,
          hotelName,
          userId,
          userName: socket.userName,
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
            sender: socket.userName
          }],
          status: 'pending',
          createdAt: new Date()
        });

        // Get owner socket
        const ownerSocketId = this.ownerSockets.get(hotelId);
        
        if (ownerSocketId) {
          // Send to owner
          io.to(ownerSocketId).emit('new-negotiation-request', {
            negotiationId,
            hotelId,
            hotelName,
            userId,
            userName: socket.userName,
            message: message,
            userBudget,
            checkIn,
            checkOut,
            guests,
            roomType,
            timestamp: new Date().toISOString()
          });
          
          socket.emit('negotiation-started', {
            negotiationId,
            message: 'Your request has been sent to the hotel owner. They will respond shortly!'
          });
        } else {
          // Owner offline - store for later
          await this.storeOfflineMessage(hotelId, {
            negotiationId,
            userId,
            message,
            timestamp: new Date()
          });
          
          socket.emit('negotiation-started', {
            negotiationId,
            message: 'The hotel owner is currently offline. Your message has been saved and will be delivered when they come online.'
          });
        }
      });

      // Owner sends response to user
      socket.on('owner-response', async (data) => {
        const { negotiationId, response, offerPrice, inclusions, specialDeal } = data;
        
        const negotiation = this.activeNegotiations.get(negotiationId);
        if (!negotiation) {
          socket.emit('error', { message: 'Negotiation session not found' });
          return;
        }

        // Add owner response to messages
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

        // Get user socket
        const userSocketId = this.userSockets.get(negotiation.userId);
        
        if (userSocketId) {
          io.to(userSocketId).emit('owner-response', {
            negotiationId,
            response,
            offerPrice,
            inclusions,
            specialDeal,
            timestamp: new Date().toISOString(),
            fromOwner: true
          });
          
          // Send confirmation to owner
          socket.emit('response-sent', {
            success: true,
            message: 'Response sent to user'
          });
        } else {
          socket.emit('error', { message: 'User is offline' });
        }
        
        this.activeNegotiations.set(negotiationId, negotiation);
      });

      // User responds to owner
      socket.on('user-response', async (data) => {
        const { negotiationId, message, acceptOffer, counterPrice } = data;
        
        const negotiation = this.activeNegotiations.get(negotiationId);
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

        const ownerSocketId = this.ownerSockets.get(negotiation.hotelId);
        
        if (ownerSocketId) {
          io.to(ownerSocketId).emit('user-response', {
            negotiationId,
            message,
            acceptOffer,
            counterPrice,
            timestamp: new Date().toISOString(),
            userName: negotiation.userName
          });
        }
        
        this.activeNegotiations.set(negotiationId, negotiation);
      });

      // Accept offer and create booking
      socket.on('accept-offer', async (data) => {
        const { negotiationId, offerDetails } = data;
        
        const negotiation = this.activeNegotiations.get(negotiationId);
        if (negotiation) {
          negotiation.status = 'accepted';
          
          // Notify owner
          const ownerSocketId = this.ownerSockets.get(negotiation.hotelId);
          if (ownerSocketId) {
            io.to(ownerSocketId).emit('offer-accepted', {
              negotiationId,
              userId: negotiation.userId,
              offerDetails,
              timestamp: new Date().toISOString()
            });
          }
          
          // Notify user
          socket.emit('booking-confirmation', {
            success: true,
            negotiationId,
            offerDetails,
            message: 'Congratulations! Your offer has been accepted. Redirecting to checkout...'
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove from maps
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            break;
          }
        }
        
        for (const [hotelId, socketId] of this.ownerSockets.entries()) {
          if (socketId === socket.id) {
            this.ownerSockets.delete(hotelId);
            break;
          }
        }
      });
    });
  }

  async sendPendingInquiries(hotelId) {
    // Implementation for offline messages
    console.log(`Checking pending inquiries for hotel ${hotelId}`);
  }

  async storeOfflineMessage(hotelId, message) {
    // Store in database for later delivery
    console.log(`Storing offline message for hotel ${hotelId}`);
  }

  getIO() {
    return io;
  }
}

module.exports = WebSocketService;