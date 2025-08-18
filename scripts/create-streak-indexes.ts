import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function createStreakIndexes() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Create index for streak leaderboard queries (longest streak)
    await users.createIndex({ streakLongest: -1 }, { name: 'streak_longest_desc' });
    console.log('Created index on streakLongest (descending)');
    
    // Create index for current streak queries
    await users.createIndex({ streakCurrent: -1 }, { name: 'streak_current_desc' });
    console.log('Created index on streakCurrent (descending)');
    
    // Create compound index for streak queries with user lookup
    await users.createIndex(
      { streakLongest: -1, streakCurrent: -1, updatedAt: -1 }, 
      { name: 'streak_compound' }
    );
    console.log('Created compound index for streak queries');
    
    // List all indexes to verify
    const indexes = await users.indexes();
    console.log('\nAll indexes on users collection:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('Index creation failed:', error);
  } finally {
    await client.close();
  }
}

// Run the index creation
createStreakIndexes().catch(console.error);
