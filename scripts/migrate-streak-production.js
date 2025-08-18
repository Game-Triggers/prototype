const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateUserStreakFields() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
  
  try {
    console.log('🚀 Starting streak fields migration...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Count documents that need updating
    const totalUsers = await users.countDocuments({});
    const usersWithoutStreak = await users.countDocuments({
      $or: [
        { streakCurrent: { $exists: false } },
        { streakLongest: { $exists: false } },
        { streakLastDate: { $exists: false } },
        { streakHistory: { $exists: false } }
      ]
    });
    
    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`🔄 Users needing migration: ${usersWithoutStreak}`);
    
    if (usersWithoutStreak === 0) {
      console.log('✅ All users already have streak fields! Migration skipped.');
      return;
    }
    
    // Update all users that don't have streak fields
    const result = await users.updateMany(
      {
        $or: [
          { streakCurrent: { $exists: false } },
          { streakLongest: { $exists: false } },
          { streakLastDate: { $exists: false } },
          { streakHistory: { $exists: false } }
        ]
      },
      {
        $set: {
          streakCurrent: 0,
          streakLongest: 0,
          streakLastDate: null,
          streakHistory: []
        }
      }
    );
    
    console.log(`✅ Migration completed! Updated ${result.modifiedCount} users`);
    
    // Create indexes if they don't exist
    console.log('🔍 Creating streak indexes...');
    try {
      await users.createIndex({ streakLongest: -1 }, { name: 'streak_longest_desc', background: true });
      await users.createIndex({ streakCurrent: -1 }, { name: 'streak_current_desc', background: true });
      console.log('✅ Streak indexes created successfully');
    } catch (indexError) {
      // Indexes might already exist
      console.log('ℹ️ Streak indexes already exist or failed to create:', indexError.message);
    }
    
    console.log('🎉 Streak migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateUserStreakFields().catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateUserStreakFields };
