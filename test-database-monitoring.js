const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instreamly';
const DB_NAME = 'instreamly';

// Test data - update these values based on your actual campaign
const TEST_CAMPAIGN_ID = '68ba7b1bac409b8584ee0d6c'; // Replace with actual campaign ID
const TEST_PARTICIPATION_ID = '68ba7c37ac409b8584ee0dd3'; // Replace with actual participation ID
const TEST_STREAMER_ID = '68ba7919ac409b8584ee0d29'; // Replace with actual streamer ID

async function testDatabaseImpressionsUpdate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    const participationsCollection = db.collection('campaignparticipations');
    
    console.log('📊 Starting database impression update test...');
    console.log('This will simulate manual database updates to test real-time monitoring');
    console.log('=========================================================================');
    
    // Get current participation data
    const participation = await participationsCollection.findOne({
      _id: new require('mongodb').ObjectId(TEST_PARTICIPATION_ID)
    });
    
    if (!participation) {
      console.log('❌ Participation not found. Please check the TEST_PARTICIPATION_ID.');
      return;
    }
    
    console.log('✅ Found participation:', {
      id: participation._id,
      campaignId: participation.campaignId,
      streamerId: participation.streamerId,
      currentImpressions: participation.impressions || 0,
      status: participation.status
    });
    
    if (participation.status !== 'active') {
      console.log('⚠️  Warning: Participation is not active. Status:', participation.status);
    }
    
    const currentImpressions = participation.impressions || 0;
    
    // Test 1: Small increment (should trigger check at 50 impressions)
    console.log('\n🧪 Test 1: Adding 10 impressions...');
    const newImpressions1 = currentImpressions + 10;
    
    const result1 = await participationsCollection.updateOne(
      { _id: new require('mongodb').ObjectId(TEST_PARTICIPATION_ID) },
      { 
        $set: { 
          impressions: newImpressions1,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated impressions: ${currentImpressions} → ${newImpressions1}`);
    console.log(`📝 MongoDB update result:`, result1.acknowledged ? 'Success' : 'Failed');
    console.log('🔍 Check the application logs for change stream detection...');
    
    // Wait a bit to see the logs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Larger increment to potentially trigger completion
    console.log('\n🧪 Test 2: Adding 100 impressions...');
    const newImpressions2 = newImpressions1 + 100;
    
    const result2 = await participationsCollection.updateOne(
      { _id: new require('mongodb').ObjectId(TEST_PARTICIPATION_ID) },
      { 
        $set: { 
          impressions: newImpressions2,
          estimatedEarnings: newImpressions2 * 1.65, // Assuming $1.65 CPM
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated impressions: ${newImpressions1} → ${newImpressions2}`);
    console.log(`💰 Updated estimated earnings: $${(newImpressions2 * 1.65).toFixed(2)}`);
    console.log(`📝 MongoDB update result:`, result2.acknowledged ? 'Success' : 'Failed');
    console.log('🔍 Check the application logs for completion check trigger...');
    
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Massive increment to definitely trigger completion
    console.log('\n🧪 Test 3: Adding 500 impressions (should trigger completion)...');
    const newImpressions3 = newImpressions2 + 500;
    
    const result3 = await participationsCollection.updateOne(
      { _id: new require('mongodb').ObjectId(TEST_PARTICIPATION_ID) },
      { 
        $set: { 
          impressions: newImpressions3,
          estimatedEarnings: newImpressions3 * 1.65,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated impressions: ${newImpressions2} → ${newImpressions3}`);
    console.log(`💰 Updated estimated earnings: $${(newImpressions3 * 1.65).toFixed(2)}`);
    console.log(`📝 MongoDB update result:`, result3.acknowledged ? 'Success' : 'Failed');
    console.log('🔍 This should definitely trigger campaign completion if target was met!');
    
    console.log('\n=========================================================================');
    console.log('🎯 Test completed! Check your application logs for:');
    console.log('   1. "Database impression update detected" messages');
    console.log('   2. "Campaign completion check event" messages');
    console.log('   3. Potential campaign completion and earnings transfer');
    console.log('   4. The dashboard should reflect the new impression counts in real-time');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the test
console.log('🚀 Starting database impression update test...');
console.log('Make sure your application is running to see the change stream events!');
console.log('');

testDatabaseImpressionsUpdate()
  .then(() => {
    console.log('✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
