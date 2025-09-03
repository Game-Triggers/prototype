import { MongoClient } from 'mongodb';

async function fixCampaignCategories() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('campaigns');
    
    // Update campaigns that use "Tech" to use "Technology"
    const result = await collection.updateMany(
      { categories: "Tech" },
      { $set: { "categories.$": "Technology" } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} campaigns: "Tech" → "Technology"`);
    
    // Check current campaigns after update
    const campaigns = await collection.find({ status: 'active' }).limit(5).toArray();
    console.log('\n📋 Updated campaigns:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. "${campaign.title}": [${campaign.categories ? campaign.categories.join(', ') : 'No categories'}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

fixCampaignCategories().catch(console.error);
