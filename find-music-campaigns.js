import { MongoClient } from 'mongodb';

async function findMusicCampaigns() {
  const mongoUrl = 'mongodb://localhost:27017/gametriggers';
  const dbName = 'gametriggers';
  
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const campaignsCollection = db.collection('campaigns');
    const gkeysCollection = db.collection('gkeys');
    
    // Search for campaigns with Music category
    const musicCampaigns = await campaignsCollection.find({
      categories: { $in: ["Music", "music", "MUSIC"] }
    }).toArray();
    
    console.log('\n🎵 Campaigns with Music category:');
    if (musicCampaigns.length === 0) {
      console.log('No campaigns found with Music category');
    } else {
      musicCampaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. "${campaign.title}": [${campaign.categories.join(', ')}] (Status: ${campaign.status})`);
      });
    }
    
    // Check if there's a music-related G-Key
    const gkeys = await gkeysCollection.find({ userId: "68ad751fc9fd409f425b04fc" }).toArray();
    const musicKeys = gkeys.filter(key => 
      key.category.toLowerCase().includes('music') || 
      key.category.toLowerCase().includes('entertainment') ||
      key.category.toLowerCase().includes('audio')
    );
    
    console.log('\n🔑 Music-related G-Keys:');
    if (musicKeys.length === 0) {
      console.log('No music-related G-Keys found');
      console.log('\nAll available G-Key categories:');
      gkeys.forEach(key => console.log(`  - ${key.category}`));
    } else {
      musicKeys.forEach(key => {
        console.log(`  - ${key.category}: ${key.status}`);
      });
    }
    
    // Check if there are any campaigns with Music that might be recently created
    const allCampaigns = await campaignsCollection.find({}).toArray();
    const campaignsWithMusic = allCampaigns.filter(campaign => 
      campaign.categories && campaign.categories.some(cat => 
        cat.toLowerCase().includes('music')
      )
    );
    
    console.log('\n🔍 All campaigns containing "music" (case-insensitive):');
    if (campaignsWithMusic.length === 0) {
      console.log('No campaigns found containing "music"');
    } else {
      campaignsWithMusic.forEach((campaign, index) => {
        console.log(`${index + 1}. "${campaign.title}": [${campaign.categories.join(', ')}] (Status: ${campaign.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

findMusicCampaigns().catch(console.error);
