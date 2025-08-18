import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateUserStreakFields() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Count documents that need updating
    const totalUsers = await users.countDocuments({});
    const usersWithoutStreak = await users.countDocuments({
      streakCurrent: { $exists: false }
    });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users without streak fields: ${usersWithoutStreak}`);
    
    if (usersWithoutStreak === 0) {
      console.log('All users already have streak fields!');
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
    
    console.log(`Migration completed! Updated ${result.modifiedCount} users`);
    
    // Verify the migration
    const verifyUsers = await users.find({
      email: "trainee01@gametriggers.com"
    }, {
      projection: {
        email: 1,
        streakCurrent: 1,
        streakLongest: 1,
        streakLastDate: 1,
        streakHistory: 1,
        updatedAt: 1
      }
    }).toArray();
    
    console.log('Sample user after migration:', verifyUsers[0]);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateUserStreakFields().catch(console.error);
