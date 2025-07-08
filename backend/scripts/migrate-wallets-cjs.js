#!/usr/bin/env node

/**
 * Simple Migration Script - Create Wallets for Existing Users (CommonJS)
 * This script directly connects to MongoDB and creates wallets
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Schema Definitions (simplified for this script)
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  authProvider: String,
}, { timestamps: true });

const WalletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  walletType: { type: String, enum: ['BRAND', 'STREAMER', 'PLATFORM'], required: true },
  balance: { type: Number, default: 0 },
  reservedBalance: { type: Number, default: 0 },
  withdrawableBalance: { type: Number, default: 0 },
  heldBalance: { type: Number, default: 0 },
  totalEarnings: Number,
  totalSpent: Number,
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true },
  autoTopupEnabled: { type: Boolean, default: false },
  autoTopupThreshold: { type: Number, default: 0 },
  autoTopupAmount: { type: Number, default: 0 },
}, { timestamps: true });

async function runMigration() {
  try {
    console.log('🚀 Starting Wallet Migration...');
    console.log('=====================================');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Create models
    const User = mongoose.model('User', UserSchema);
    const Wallet = mongoose.model('Wallet', WalletSchema);

    // Get all users
    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users to process...`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Check if wallet already exists
        const existingWallet = await Wallet.findOne({ userId: user._id.toString() });
        
        if (existingWallet) {
          console.log(`✓ Wallet already exists for user: ${user.email}`);
          skipped++;
          continue;
        }

        // Determine wallet type based on user role
        let walletType;
        switch (user.role) {
          case 'brand':
            walletType = 'BRAND';
            break;
          case 'streamer':
            walletType = 'STREAMER';
            break;
          case 'admin':
            walletType = 'PLATFORM';
            break;
          default:
            walletType = 'STREAMER'; // Default fallback
        }

        // Create wallet
        const wallet = new Wallet({
          userId: user._id.toString(),
          walletType,
          balance: 0,
          reservedBalance: 0,
          withdrawableBalance: 0,
          heldBalance: 0,
          totalEarnings: walletType === 'STREAMER' ? 0 : undefined,
          totalSpent: walletType === 'BRAND' ? 0 : undefined,
          currency: 'INR',
          isActive: true,
          autoTopupEnabled: false,
          autoTopupThreshold: 0,
          autoTopupAmount: 0
        });

        await wallet.save();
        created++;
        
        console.log(`✓ Created ${walletType} wallet for user: ${user.email} (${user.role})`);

      } catch (error) {
        errors++;
        console.error(`✗ Failed to create wallet for user ${user.email}: ${error.message}`);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Wallets created: ${created}`);
    console.log(`Wallets already existed: ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const totalUsers = await User.countDocuments();
    const totalWallets = await Wallet.countDocuments();
    
    console.log(`Users: ${totalUsers}, Wallets: ${totalWallets}`);
    
    if (totalUsers === totalWallets) {
      console.log('✅ Migration successful! All users have wallets.');
    } else {
      console.log(`⚠️  Warning: ${totalUsers - totalWallets} users still don't have wallets.`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
runMigration().catch(console.error);

module.exports = { runMigration };
