import { MongoClient } from 'mongodb';

async function checkCampaignFields() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('campaigns');
    
    // Check a few campaigns to see their structure
    const campaigns = await collection.find({}).limit(3).toArray();
    
    console.log('Sample campaigns:');
    campaigns.forEach((campaign, index) => {
      console.log(`\n📋 Campaign ${index + 1}: ${campaign.title}`);
      console.log(`   Categories field: ${campaign.categories ? campaign.categories.join(', ') : 'None'}`);
      console.log(`   TargetCategories field: ${campaign.targetCategories ? campaign.targetCategories.join(', ') : 'None'}`);
      console.log(`   Status: ${campaign.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking campaigns:', error.message);
  } finally {
    await client.close();
  }
}

checkCampaignFields().catch(console.error);
