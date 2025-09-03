import { MongoClient } from 'mongodb';

async function fixMusicCampaign() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('campaigns');
    
    // Update campaigns that use "Music" to use "Entertainment"
    const result = await collection.updateMany(
      { categories: "Music" },
      { $set: { "categories.$": "Entertainment" } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} campaigns: "Music" → "Entertainment"`);
    
    // Check the specific campaign
    const updatedCampaign = await collection.findOne({ title: "g-keys" });
    if (updatedCampaign) {
      console.log(`\n📋 Updated campaign "${updatedCampaign.title}": [${updatedCampaign.categories.join(', ')}]`);
    }
    
    // Verify mapping with available G-Keys
    const gkeysCollection = db.collection('gkeys');
    const entertainmentKey = await gkeysCollection.findOne({ 
      userId: "68ad751fc9fd409f425b04fc", 
      category: "entertainment" 
    });
    
    if (entertainmentKey) {
      console.log(`\n🔑 Entertainment G-Key status: ${entertainmentKey.status}`);
      console.log(`✅ Campaign "g-keys" can now use the "entertainment" G-Key`);
    } else {
      console.log(`\n❌ No entertainment G-Key found for user`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixMusicCampaign().catch(console.error);
