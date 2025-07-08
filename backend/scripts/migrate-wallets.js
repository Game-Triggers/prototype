#!/usr/bin/env node

/**
 * Migration Script - Create Wallets for Existing Users
 * Run this script to ensure all existing users have wallets
 * 
 * Usage: node migrate-wallets.js
 */

import mongoose from 'mongoose';
import { userModel } from '../schemas/user.schema.js';
import { walletModel } from '../schemas/wallet.schema.js';
import { WalletMigrationService } from '../src/services/wallet-migration.service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  try {
    console.log('🚀 Starting Wallet Migration...');
    console.log('=====================================');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Initialize migration service
    const migrationService = new WalletMigrationService(userModel, walletModel);

    // Check current state
    console.log('\n📊 Checking current state...');
    const usersWithoutWallets = await migrationService.getUsersWithoutWallets();
    
    if (usersWithoutWallets.length === 0) {
      console.log('✓ All users already have wallets! No migration needed.');
      return;
    }

    console.log(`Found ${usersWithoutWallets.length} users without wallets:`);
    usersWithoutWallets.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    // Run migration
    console.log('\n🔄 Running wallet migration...');
    const result = await migrationService.migrateUserWallets();

    // Verify results
    console.log('\n🔍 Verifying migration...');
    const allHaveWallets = await migrationService.verifyUserWallets();

    if (allHaveWallets && result.errors.length === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with issues. Please review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Migration interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('\n❌ Uncaught exception:', error);
  await mongoose.disconnect();
  process.exit(1);
});

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
