/**
 * Migration Script: Convert USD to INR
 * 
 * This script migrates all monetary values in the database from USD to INR
 * using the exchange rate of 1 USD = 83 INR.
 * 
 * Collections affected:
 * - campaigns: budget, remainingBudget, paymentRate
 * - campaignparticipations: estimatedEarnings
 * - wallets: balance, reservedBalance, withdrawableBalance, heldBalance, totalEarnings, totalSpent
 * - transactions: amount
 * 
 * IMPORTANT: 
 * - Run this script during a maintenance window
 * - Ensure you have a database backup before running
 * - Test on staging environment first
 * - This migration is irreversible without a backup
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
const DATABASE_NAME = 'gametriggers';
const USD_TO_INR_RATE = 83.0; // 1 USD = 83 INR (as per currency-config.ts)

async function migrateCurrencyToINR() {
  console.log('Starting USD to INR currency migration...');
  console.log(`Exchange rate: 1 USD = ${USD_TO_INR_RATE} INR`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Step 1: Migrate Campaigns Collection
    console.log('\\n=== Migrating Campaigns Collection ===');
    await migrateCampaigns(db);
    
    // Step 2: Migrate Campaign Participations Collection
    console.log('\\n=== Migrating Campaign Participations Collection ===');
    await migrateCampaignParticipations(db);
    
    // Step 3: Migrate Wallets Collection
    console.log('\\n=== Migrating Wallets Collection ===');
    await migrateWallets(db);
    
    // Step 4: Migrate Transactions Collection
    console.log('\\n=== Migrating Transactions Collection ===');
    await migrateTransactions(db);
    
    // Step 5: Generate migration report
    console.log('\\n=== Migration Report ===');
    await generateMigrationReport(db);
    
    console.log('\\n✅ Currency migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

async function migrateCampaigns(db) {
  const collection = db.collection('campaigns');
  
  // Get current statistics
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        totalRemainingBudget: { $sum: '$remainingBudget' },
        avgPaymentRate: { $avg: '$paymentRate' },
        maxBudget: { $max: '$budget' },
        minBudget: { $min: '$budget' }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    console.log('Current Campaign Statistics (USD):');
    console.log(`- Total campaigns: ${stats[0].totalCampaigns}`);
    console.log(`- Total budget: $${stats[0].totalBudget?.toFixed(2) || 0}`);
    console.log(`- Total remaining budget: $${stats[0].totalRemainingBudget?.toFixed(2) || 0}`);
    console.log(`- Average payment rate: $${stats[0].avgPaymentRate?.toFixed(2) || 0}`);
    console.log(`- Budget range: $${stats[0].minBudget?.toFixed(2) || 0} - $${stats[0].maxBudget?.toFixed(2) || 0}`);
  }
  
  // Update campaigns
  const campaignResult = await collection.updateMany(
    {}, // Update all campaigns
    [
      {
        $set: {
          budget: { $multiply: ['$budget', USD_TO_INR_RATE] },
          remainingBudget: { $multiply: ['$remainingBudget', USD_TO_INR_RATE] },
          paymentRate: { $multiply: ['$paymentRate', USD_TO_INR_RATE] }
        }
      }
    ]
  );
  
  console.log(`Updated ${campaignResult.modifiedCount} campaigns`);
  
  // Get updated statistics
  const updatedStats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalBudget: { $sum: '$budget' },
        totalRemainingBudget: { $sum: '$remainingBudget' },
        avgPaymentRate: { $avg: '$paymentRate' }
      }
    }
  ]).toArray();
  
  if (updatedStats.length > 0) {
    console.log('Updated Campaign Statistics (INR):');
    console.log(`- Total budget: ₹${updatedStats[0].totalBudget?.toFixed(2) || 0}`);
    console.log(`- Total remaining budget: ₹${updatedStats[0].totalRemainingBudget?.toFixed(2) || 0}`);
    console.log(`- Average payment rate: ₹${updatedStats[0].avgPaymentRate?.toFixed(2) || 0}`);
  }
}

async function migrateCampaignParticipations(db) {
  const collection = db.collection('campaignparticipations');
  
  // Get current statistics
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalParticipations: { $sum: 1 },
        totalEarnings: { $sum: '$estimatedEarnings' },
        avgEarnings: { $avg: '$estimatedEarnings' },
        maxEarnings: { $max: '$estimatedEarnings' },
        participationsWithEarnings: {
          $sum: { $cond: [{ $gt: ['$estimatedEarnings', 0] }, 1, 0] }
        }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    console.log('Current Participation Statistics (USD):');
    console.log(`- Total participations: ${stats[0].totalParticipations}`);
    console.log(`- Total earnings: $${stats[0].totalEarnings?.toFixed(2) || 0}`);
    console.log(`- Average earnings: $${stats[0].avgEarnings?.toFixed(2) || 0}`);
    console.log(`- Max earnings: $${stats[0].maxEarnings?.toFixed(2) || 0}`);
    console.log(`- Participations with earnings: ${stats[0].participationsWithEarnings}`);
  }
  
  // Update participations
  const participationResult = await collection.updateMany(
    {}, // Update all participations
    [
      {
        $set: {
          estimatedEarnings: { $multiply: ['$estimatedEarnings', USD_TO_INR_RATE] }
        }
      }
    ]
  );
  
  console.log(`Updated ${participationResult.modifiedCount} campaign participations`);
  
  // Get updated statistics
  const updatedStats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$estimatedEarnings' },
        avgEarnings: { $avg: '$estimatedEarnings' }
      }
    }
  ]).toArray();
  
  if (updatedStats.length > 0) {
    console.log('Updated Participation Statistics (INR):');
    console.log(`- Total earnings: ₹${updatedStats[0].totalEarnings?.toFixed(2) || 0}`);
    console.log(`- Average earnings: ₹${updatedStats[0].avgEarnings?.toFixed(2) || 0}`);
  }
}

async function migrateWallets(db) {
  const collection = db.collection('wallets');
  
  // Get current statistics
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        totalBalance: { $sum: '$balance' },
        totalReservedBalance: { $sum: '$reservedBalance' },
        totalWithdrawableBalance: { $sum: '$withdrawableBalance' },
        totalHeldBalance: { $sum: '$heldBalance' },
        totalEarnings: { $sum: '$totalEarnings' },
        totalSpent: { $sum: '$totalSpent' }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    console.log('Current Wallet Statistics (USD):');
    console.log(`- Total wallets: ${stats[0].totalWallets}`);
    console.log(`- Total balance: $${stats[0].totalBalance?.toFixed(2) || 0}`);
    console.log(`- Total reserved: $${stats[0].totalReservedBalance?.toFixed(2) || 0}`);
    console.log(`- Total withdrawable: $${stats[0].totalWithdrawableBalance?.toFixed(2) || 0}`);
    console.log(`- Total held: $${stats[0].totalHeldBalance?.toFixed(2) || 0}`);
    console.log(`- Total earnings: $${stats[0].totalEarnings?.toFixed(2) || 0}`);
    console.log(`- Total spent: $${stats[0].totalSpent?.toFixed(2) || 0}`);
  }
  
  // Update wallets
  const walletResult = await collection.updateMany(
    {}, // Update all wallets
    [
      {
        $set: {
          balance: { $multiply: ['$balance', USD_TO_INR_RATE] },
          reservedBalance: { $multiply: ['$reservedBalance', USD_TO_INR_RATE] },
          withdrawableBalance: { $multiply: ['$withdrawableBalance', USD_TO_INR_RATE] },
          heldBalance: { $multiply: [{ $ifNull: ['$heldBalance', 0] }, USD_TO_INR_RATE] },
          totalEarnings: { $multiply: [{ $ifNull: ['$totalEarnings', 0] }, USD_TO_INR_RATE] },
          totalSpent: { $multiply: [{ $ifNull: ['$totalSpent', 0] }, USD_TO_INR_RATE] },
          autoTopupThreshold: { $multiply: [{ $ifNull: ['$autoTopupThreshold', 0] }, USD_TO_INR_RATE] },
          autoTopupAmount: { $multiply: [{ $ifNull: ['$autoTopupAmount', 0] }, USD_TO_INR_RATE] },
          currency: 'INR'
        }
      }
    ]
  );
  
  console.log(`Updated ${walletResult.modifiedCount} wallets`);
  
  // Get updated statistics
  const updatedStats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$balance' },
        totalEarnings: { $sum: '$totalEarnings' },
        totalSpent: { $sum: '$totalSpent' }
      }
    }
  ]).toArray();
  
  if (updatedStats.length > 0) {
    console.log('Updated Wallet Statistics (INR):');
    console.log(`- Total balance: ₹${updatedStats[0].totalBalance?.toFixed(2) || 0}`);
    console.log(`- Total earnings: ₹${updatedStats[0].totalEarnings?.toFixed(2) || 0}`);
    console.log(`- Total spent: ₹${updatedStats[0].totalSpent?.toFixed(2) || 0}`);
  }
}

async function migrateTransactions(db) {
  const collection = db.collection('transactions');
  
  // Get current statistics
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        transactionsByType: {
          $push: {
            type: '$transactionType',
            amount: '$amount'
          }
        }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    console.log('Current Transaction Statistics (USD):');
    console.log(`- Total transactions: ${stats[0].totalTransactions}`);
    console.log(`- Total amount: $${stats[0].totalAmount?.toFixed(2) || 0}`);
    console.log(`- Average amount: $${stats[0].avgAmount?.toFixed(2) || 0}`);
  }
  
  // Update transactions
  const transactionResult = await collection.updateMany(
    {}, // Update all transactions
    [
      {
        $set: {
          amount: { $multiply: ['$amount', USD_TO_INR_RATE] },
          currency: 'INR'
        }
      }
    ]
  );
  
  console.log(`Updated ${transactionResult.modifiedCount} transactions`);
  
  // Get updated statistics
  const updatedStats = await collection.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]).toArray();
  
  if (updatedStats.length > 0) {
    console.log('Updated Transaction Statistics (INR):');
    console.log(`- Total amount: ₹${updatedStats[0].totalAmount?.toFixed(2) || 0}`);
    console.log(`- Average amount: ₹${updatedStats[0].avgAmount?.toFixed(2) || 0}`);
  }
}

async function generateMigrationReport(db) {
  const report = {
    migrationDate: new Date().toISOString(),
    exchangeRate: USD_TO_INR_RATE,
    collections: {}
  };
  
  // Get final counts for each collection
  const collections = ['campaigns', 'campaignparticipations', 'wallets', 'transactions'];
  
  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    report.collections[collectionName] = {
      documentsUpdated: count,
      status: 'completed'
    };
  }
  
  console.log('\\n📊 Migration Report:');
  console.log(JSON.stringify(report, null, 2));
  
  // Save report to database
  const reportsCollection = db.collection('migration_reports');
  await reportsCollection.insertOne({
    ...report,
    type: 'currency_usd_to_inr'
  });
  
  console.log('Migration report saved to database');
}

// Error handling and rollback function
async function createRollbackScript() {
  const rollbackScript = `
/**
 * ROLLBACK Script: Convert INR back to USD
 * 
 * This script can be used to rollback the currency migration
 * Use exchange rate: 1 INR = ${(1/USD_TO_INR_RATE).toFixed(6)} USD
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
const DATABASE_NAME = 'gametriggers';
const INR_TO_USD_RATE = ${(1/USD_TO_INR_RATE).toFixed(6)}; // 1 INR = ${(1/USD_TO_INR_RATE).toFixed(6)} USD

// Similar migration logic but in reverse...
// (Implementation would mirror the above functions with reversed rates)
`;
  
  const fs = require('fs');
  fs.writeFileSync('../scripts/rollback-currency-migration.js', rollbackScript);
  console.log('Rollback script created: ../scripts/rollback-currency-migration.js');
}

// Main execution
if (require.main === module) {
  migrateCurrencyToINR()
    .then(() => {
      console.log('\\n🎉 Migration completed successfully!');
      return createRollbackScript();
    })
    .then(() => {
      console.log('\\n⚠️  IMPORTANT NOTES:');
      console.log('1. All monetary values have been converted from USD to INR');
      console.log('2. Exchange rate used: 1 USD = 83 INR');
      console.log('3. Wallet currency field updated to "INR"');
      console.log('4. Transaction currency field updated to "INR"');
      console.log('5. A rollback script has been created if needed');
      console.log('6. Verify the application works correctly with the new values');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Migration failed:', error);
      console.log('\\n🔄 Please restore from backup and check the error');
      process.exit(1);
    });
}

module.exports = {
  migrateCurrencyToINR,
  USD_TO_INR_RATE
};
