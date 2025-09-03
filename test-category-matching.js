import { MongoClient } from 'mongodb';

async function testCaseInsensitiveMatching() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Check current campaign categories vs G-Key categories
    const campaignsCollection = db.collection('campaigns');
    const gkeysCollection = db.collection('gkeys');
    
    const campaigns = await campaignsCollection.find({ status: 'active' }).limit(5).toArray();
    const gkeys = await gkeysCollection.find({ userId: "68ad751fc9fd409f425b04fc" }).toArray();
    
    console.log('\n📋 Active Campaigns and their categories:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. "${campaign.title}": [${campaign.categories ? campaign.categories.join(', ') : 'No categories'}]`);
    });
    
    console.log('\n🔑 Available G-Keys:');
    gkeys.forEach((key, index) => {
      console.log(`${index + 1}. "${key.category}": ${key.status}`);
    });
    
    console.log('\n🔍 Category Matching Analysis:');
    if (campaigns.length > 0 && campaigns[0].categories) {
      const firstCampaign = campaigns[0];
      console.log(`\nTesting campaign: "${firstCampaign.title}"`);
      console.log(`Campaign categories: [${firstCampaign.categories.join(', ')}]`);
      
      firstCampaign.categories.forEach(campaignCat => {
        const normalizedCampaignCat = campaignCat.toLowerCase();
        const matchingKey = gkeys.find(key => key.category === normalizedCampaignCat);
        
        console.log(`  - "${campaignCat}" → "${normalizedCampaignCat}" → ${matchingKey ? `✅ Found key (${matchingKey.status})` : '❌ No matching key'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testCaseInsensitiveMatching().catch(console.error);
