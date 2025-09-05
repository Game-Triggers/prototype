const { MongoClient } = require('mongodb');

async function debugGamingGKey() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('gametriggers');
    const gkeysCollection = db.collection('gkeys');
    const campaignsCollection = db.collection('campaigns');
    
    // Find gaming G-key for the user
    const gamingGKey = await gkeysCollection.findOne({ 
      userId: "68b29b14b560706995f6d348", // Your user ID
      category: "gaming" 
    });
    
    if (!gamingGKey) {
      console.log('❌ No gaming G-key found for your user');
      return;
    }
    
    console.log('\n🎮 Gaming G-Key Status:');
    console.log('  Category:', gamingGKey.category);
    console.log('  Status:', gamingGKey.status);
    console.log('  Locked With:', gamingGKey.lockedWith || 'None');
    console.log('  Locked At:', gamingGKey.lockedAt || 'None');
    console.log('  Cooloff Ends At:', gamingGKey.cooloffEndsAt || 'None');
    console.log('  Last Brand ID:', gamingGKey.lastBrandId || 'None');
    console.log('  Last Used:', gamingGKey.lastUsed || 'None');
    
    // Check if cooloff has expired
    if (gamingGKey.status === 'cooloff' && gamingGKey.cooloffEndsAt) {
      const now = new Date();
      const cooloffEnd = new Date(gamingGKey.cooloffEndsAt);
      const hasExpired = now > cooloffEnd;
      
      console.log('\n⏰ Cooloff Analysis:');
      console.log('  Current Time:', now.toISOString());
      console.log('  Cooloff Ends:', cooloffEnd.toISOString());
      console.log('  Has Expired:', hasExpired ? '✅ Yes' : '❌ No');
      
      if (hasExpired) {
        console.log('  Time Since Expiry:', Math.round((now - cooloffEnd) / (1000 * 60)), 'minutes');
      } else {
        console.log('  Time Until Expiry:', Math.round((cooloffEnd - now) / (1000 * 60)), 'minutes');
      }
    }
    
    // Check if locked with a campaign
    if (gamingGKey.status === 'locked' && gamingGKey.lockedWith) {
      const campaign = await campaignsCollection.findOne({ 
        _id: { $oid: gamingGKey.lockedWith } 
      });
      
      console.log('\n🏭 Campaign Analysis:');
      if (campaign) {
        console.log('  Campaign Title:', campaign.title);
        console.log('  Campaign Status:', campaign.status);
        console.log('  Campaign Categories:', campaign.categories);
        
        // Check if campaign has gaming category
        const hasGaming = campaign.categories.some(cat => 
          cat.toLowerCase() === 'gaming'
        );
        console.log('  Has Gaming Category:', hasGaming ? '✅ Yes' : '❌ No');
      } else {
        console.log('  ❌ Campaign not found - orphaned lock!');
      }
    }
    
    // Check for active gaming campaigns
    const activeCampaigns = await campaignsCollection.find({
      status: { $in: ['active', 'approved'] },
      categories: { $regex: /gaming/i }
    }).toArray();
    
    console.log('\n🎯 Active Gaming Campaigns:', activeCampaigns.length);
    activeCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.title} (${campaign.status}) - Categories: [${campaign.categories.join(', ')}]`);
    });
    
    // Suggest fixes
    console.log('\n🔧 Suggested Fixes:');
    if (gamingGKey.status === 'cooloff') {
      const now = new Date();
      const cooloffEnd = new Date(gamingGKey.cooloffEndsAt);
      if (now > cooloffEnd) {
        console.log('  1. Run cooloff update: curl -X POST http://localhost:3000/api/v1/g-keys/update-cooloffs');
      } else {
        console.log('  1. Wait for cooloff to expire or force unlock');
      }
    } else if (gamingGKey.status === 'locked') {
      console.log('  1. Force unlock the key: curl -X POST http://localhost:3000/api/v1/g-keys/force-unlock/gaming');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

debugGamingGKey();
