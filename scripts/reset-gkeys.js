import { MongoClient } from 'mongodb';

async function resetGKeys() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('gkeys');
    
    // Update all G-Keys to be available
    const result = await collection.updateMany(
      { userId: "68ad751fc9fd409f425b04fc" },
      {
        $set: {
          status: 'available',
          updatedAt: new Date()
        },
        $unset: {
          lockedWith: "",
          lockedAt: "",
          cooloffEndsAt: ""
        }
      }
    );
    
    console.log(`✅ Reset ${result.modifiedCount} G-Keys to available status`);
    
    // Check current status
    const gKeys = await collection.find({ userId: "68ad751fc9fd409f425b04fc" }).toArray();
    console.log('Current G-Keys status:');
    gKeys.forEach(key => {
      console.log(`  ${key.category}: ${key.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting G-Keys:', error.message);
  } finally {
    await client.close();
  }
}

resetGKeys().catch(console.error);
