const mongoose = require('mongoose');
require('dotenv').config();

const LOCAL = 'mongodb://127.0.0.1:27017/bookora';
const ATLAS = process.env.MONGODB_URI;

async function migrate() {
  console.log('Connecting to local MongoDB...');
  const local = await mongoose.createConnection(LOCAL).asPromise();
  
  console.log('Connecting to Atlas...');
  const atlas = await mongoose.createConnection(ATLAS).asPromise();

  const collections = await local.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));

  for (const col of collections) {
    const name = col.name;
    let docs = await local.db.collection(name).find({}).toArray();
    if (docs.length === 0) {
      console.log(`⏭ Skipping ${name} (empty)`);
      continue;
    }

    // Fix bookings with null bookingId
    if (name === 'bookings') {
      docs = docs.map((doc, i) => {
        if (!doc.bookingId) {
          doc.bookingId = `BOOK${Date.now()}${i}${Math.floor(Math.random() * 1000)}`;
        }
        return doc;
      });
    }

    await atlas.db.collection(name).deleteMany({});
    
    // Insert one by one to skip duplicates
    let success = 0, failed = 0;
    for (const doc of docs) {
      try {
        await atlas.db.collection(name).insertOne(doc);
        success++;
      } catch (e) {
        failed++;
        console.log(`  ⚠ Skipped duplicate in ${name}: ${e.message.slice(0, 60)}`);
      }
    }
    console.log(`✅ Migrated ${name}: ${success} docs (${failed} skipped)`);
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
