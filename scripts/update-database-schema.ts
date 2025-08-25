#!/usr/bin/env ts-node

/**
 * Database Schema Update Script
 * 
 * Updates the User schema to include Eureka role fields and creates necessary indexes
 */

import { connect, disconnect } from 'mongoose';
import { User } from '../schemas/user.schema';

async function updateUserSchema() {
  console.log('🔄 Starting database schema update...');
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
  
  try {
    await connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create indexes for better query performance
    const indexes = [
      { eurekaRole: 1 },
      { portal: 1 },
      { eurekaRole: 1, portal: 1 },
      { 'permissions': 1 },
      { migrationDate: 1 },
      { 'roleAssignmentHistory.assignedAt': -1 }
    ];

    console.log('📇 Creating indexes...');
    for (const index of indexes) {
      try {
        await User.collection.createIndex(index);
        console.log(`✅ Created index:`, index);
      } catch (error) {
        console.log(`⚠️  Index might already exist:`, index);
      }
    }

    // Add default values for existing users without Eureka roles
    console.log('🔧 Adding default values for users without Eureka roles...');
    
    const updateResult = await User.updateMany(
      { 
        eurekaRole: { $exists: false },
        role: { $exists: true, $ne: null }
      },
      { 
        $set: { 
          needsMigration: true,
          migrationRequired: true 
        } 
      }
    );
    
    console.log(`✅ Marked ${updateResult.modifiedCount} users for migration`);

    // Create migration status summary
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          withEurekaRole: { 
            $sum: { $cond: [{ $ne: ['$eurekaRole', null] }, 1, 0] } 
          },
          withLegacyRole: { 
            $sum: { $cond: [{ $ne: ['$role', null] }, 1, 0] } 
          },
          needsMigration: { 
            $sum: { $cond: ['$needsMigration', 1, 0] } 
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📊 Migration Status Summary:');
      console.log(`Total Users: ${stat.totalUsers}`);
      console.log(`With Eureka Role: ${stat.withEurekaRole}`);
      console.log(`With Legacy Role: ${stat.withLegacyRole}`);
      console.log(`Needs Migration: ${stat.needsMigration}`);
      
      const migrationProgress = stat.totalUsers > 0 
        ? ((stat.withEurekaRole / stat.totalUsers) * 100).toFixed(1)
        : '0';
      console.log(`Migration Progress: ${migrationProgress}%`);
    }

    console.log('✅ Database schema update completed successfully');

  } catch (error) {
    console.error('❌ Database schema update failed:', error);
    throw error;
  } finally {
    await disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// CLI execution
if (require.main === module) {
  updateUserSchema()
    .then(() => {
      console.log('🎉 Schema update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Schema update failed:', error);
      process.exit(1);
    });
}

export { updateUserSchema };
