const { MongoClient } = require('mongodb');

async function checkGKeyStatus() {
  const uri = 'mongodb://localhost:27017/gametriggers';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('gametriggers');
    
    const userId = '68b29b14b560706995f6d348';
    console.log('Checking G-key status for user:', userId);
    
    // Check G-keys
    const gkeys = await db.collection('gkeys').find({
      userId: { $oid: userId }
    }).toArray();
    
    console.log('\n=== G-KEYS STATUS ===');
    gkeys.forEach(key => {
      console.log(`Category: ${key.category}`);
      console.log(`Status: ${key.status}`);
      console.log(`Locked with: ${key.lockedWith || 'None'}`);
      console.log(`Locked at: ${key.lockedAt || 'None'}`);
      console.log(`Cooloff ends: ${key.cooloffEndsAt || 'None'}`);
      console.log('---');
    });
    
    // Check campaign participations
    const participations = await db.collection('campaignparticipations').find({
      streamerId: { $oid: userId }
    }).toArray();
    
    console.log('\n=== CAMPAIGN PARTICIPATIONS ===');
    participations.forEach(participation => {
      console.log(`Campaign ID: ${participation.campaignId}`);
      console.log(`Status: ${participation.status}`);
      console.log(`G-Key Category: ${participation.gKeyCategory}`);
      console.log(`Joined at: ${participation.joinedAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkGKeyStatus();
