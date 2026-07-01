const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('bookings').updateMany(
    { userEmail: 'ambatipranay24@gmail.com', userId: null },
    { $set: { userId: new mongoose.Types.ObjectId('69ee7a88c2ab8684d1259469'), reviewGiven: false } }
  );
  console.log('Updated:', result.modifiedCount, 'bookings');
  process.exit();
});