const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user's room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Owner chat
    socket.on('owner_message', (data) => {
      io.to(`user_${data.userId}`).emit('new_message', data);
    });

    // Booking notifications
    socket.on('booking_confirmed', (data) => {
      io.to(`user_${data.userId}`).emit('booking_update', data);
    });
  });
};

const getIO = () => io;

module.exports = { initSocket, getIO };