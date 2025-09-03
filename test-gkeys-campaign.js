import { MongoClient } from 'mongodb';

async function testGKeysCampaign() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const campaignsCollection = db.collection('campaigns');
    const gkeysCollection = db.collection('gkeys');
    
    // Check the g-keys campaign
    const gkeysCampaign = await campaignsCollection.findOne({ title: "g-keys" });
    
    if (!gkeysCampaign) {
      console.log('❌ "g-keys" campaign not found');
      return;
    }
    
    console.log('\n📋 Testing "g-keys" campaign:');
    console.log(`  Title: ${gkeysCampaign.title}`);
    console.log(`  Categories: [${gkeysCampaign.categories.join(', ')}]`);
    console.log(`  Status: ${gkeysCampaign.status}`);
    
    // Check G-Key availability for each category
    const gkeys = await gkeysCollection.find({ userId: "68ad751fc9fd409f425b04fc" }).toArray();
    
    console.log('\n🔍 Category Matching Test:');
    for (const category of gkeysCampaign.categories) {
      const normalizedCategory = category.toLowerCase();
      const matchingKey = gkeys.find(key => key.category === normalizedCategory);
      
      console.log(`  - "${category}" → "${normalizedCategory}" → ${matchingKey ? `✅ Found key (${matchingKey.status})` : '❌ No matching key'}`);
    }
    
    const allMatch = gkeysCampaign.categories.every(category => {
      const normalizedCategory = category.toLowerCase();
      const matchingKey = gkeys.find(key => key.category === normalizedCategory);
      return matchingKey && matchingKey.status === 'available';
    });
    
    console.log(`\n🎯 Result: ${allMatch ? '✅ Campaign can be joined!' : '❌ Campaign cannot be joined'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testGKeysCampaign().catch(console.error);
