const mongoose = require('mongoose');

async function fixGKeyCollection() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/gametriggers');
    console.log('Connected to MongoDB');

    // Drop the gkeys collection to remove old indexes
    await mongoose.connection.db.collection('gkeys').drop();
    console.log('Dropped gkeys collection');

    console.log('Collection fixed successfully');
  } catch (error) {
    if (error.code === 26) {
      console.log('Collection does not exist - this is fine');
    } else {
      console.error('Error fixing collection:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixGKeyCollection();
