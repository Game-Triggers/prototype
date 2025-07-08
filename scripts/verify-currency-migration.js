/**
 * Verification Script: Check USD to INR Migration
 * 
 * This script verifies that the currency migration from USD to INR was successful
 * and provides detailed statistics about the converted data.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
const DATABASE_NAME = 'gametriggers';
const EXPECTED_USD_TO_INR_RATE = 83.0;

async function verifyCurrencyMigration() {
  console.log('Starting currency migration verification...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    console.log('\\n=== Verification Report ===');
    
    // Check campaigns
    await verifyCampaigns(db);
    
    // Check campaign participations
    await verifyCampaignParticipations(db);
    
    // Check wallets
    await verifyWallets(db);
    
    // Check transactions
    await verifyTransactions(db);
    
    // Check migration report
    await checkMigrationReport(db);
    
    console.log('\\n✅ Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

async function verifyCampaigns(db) {
  console.log('\\n📋 Campaigns Verification:');
  const collection = db.collection('campaigns');
  
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgBudget: { $avg: '$budget' },
        avgPaymentRate: { $avg: '$paymentRate' },
        minBudget: { $min: '$budget' },
        maxBudget: { $max: '$budget' },
        minPaymentRate: { $min: '$paymentRate' },
        maxPaymentRate: { $max: '$paymentRate' }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    const s = stats[0];
    console.log(`- Total campaigns: ${s.count}`);
    console.log(`- Average budget: ₹${s.avgBudget?.toFixed(2) || 0}`);
    console.log(`- Budget range: ₹${s.minBudget?.toFixed(2) || 0} - ₹${s.maxBudget?.toFixed(2) || 0}`);
    console.log(`- Average payment rate: ₹${s.avgPaymentRate?.toFixed(2) || 0}`);
    console.log(`- Payment rate range: ₹${s.minPaymentRate?.toFixed(2) || 0} - ₹${s.maxPaymentRate?.toFixed(2) || 0}`);
    
    // Check if values look reasonable for INR (should be much higher than USD values)
    if (s.avgBudget > 1000) {
      console.log('✅ Budget values appear to be in INR range');
    } else {
      console.log('⚠️  Budget values seem low for INR - may not be migrated');
    }
  }
}

async function verifyCampaignParticipations(db) {
  console.log('\\n🎯 Campaign Participations Verification:');
  const collection = db.collection('campaignparticipations');
  
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
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
    const s = stats[0];
    console.log(`- Total participations: ${s.count}`);
    console.log(`- Total earnings: ₹${s.totalEarnings?.toFixed(2) || 0}`);
    console.log(`- Average earnings: ₹${s.avgEarnings?.toFixed(2) || 0}`);
    console.log(`- Max earnings: ₹${s.maxEarnings?.toFixed(2) || 0}`);
    console.log(`- Participations with earnings: ${s.participationsWithEarnings}`);
    
    if (s.avgEarnings > 50 || s.totalEarnings === 0) {
      console.log('✅ Earnings values appear to be in INR range');
    } else {
      console.log('⚠️  Earnings values seem low for INR - may not be migrated');
    }
  }
}

async function verifyWallets(db) {
  console.log('\\n💰 Wallets Verification:');
  const collection = db.collection('wallets');
  
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalBalance: { $sum: '$balance' },
        avgBalance: { $avg: '$balance' },
        walletsWithINRCurrency: {
          $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, 1, 0] }
        },
        walletsWithUSDCurrency: {
          $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, 1, 0] }
        }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    const s = stats[0];
    console.log(`- Total wallets: ${s.count}`);
    console.log(`- Total balance: ₹${s.totalBalance?.toFixed(2) || 0}`);
    console.log(`- Average balance: ₹${s.avgBalance?.toFixed(2) || 0}`);
    console.log(`- Wallets with INR currency: ${s.walletsWithINRCurrency}`);
    console.log(`- Wallets with USD currency: ${s.walletsWithUSDCurrency}`);
    
    if (s.walletsWithINRCurrency === s.count) {
      console.log('✅ All wallets have INR currency');
    } else {
      console.log('⚠️  Some wallets may not have been migrated to INR');
    }
  }
  
  // Check for specific wallet types
  const typeStats = await collection.aggregate([
    {
      $group: {
        _id: '$walletType',
        count: { $sum: 1 },
        avgBalance: { $avg: '$balance' },
        totalBalance: { $sum: '$balance' }
      }
    }
  ]).toArray();
  
  console.log('\\nBy wallet type:');
  typeStats.forEach(stat => {
    console.log(`- ${stat._id}: ${stat.count} wallets, avg: ₹${stat.avgBalance?.toFixed(2) || 0}, total: ₹${stat.totalBalance?.toFixed(2) || 0}`);
  });
}

async function verifyTransactions(db) {
  console.log('\\n💳 Transactions Verification:');
  const collection = db.collection('transactions');
  
  const stats = await collection.aggregate([
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        transactionsWithINRCurrency: {
          $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, 1, 0] }
        },
        transactionsWithUSDCurrency: {
          $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, 1, 0] }
        }
      }
    }
  ]).toArray();
  
  if (stats.length > 0) {
    const s = stats[0];
    console.log(`- Total transactions: ${s.count}`);
    console.log(`- Total amount: ₹${s.totalAmount?.toFixed(2) || 0}`);
    console.log(`- Average amount: ₹${s.avgAmount?.toFixed(2) || 0}`);
    console.log(`- Transactions with INR currency: ${s.transactionsWithINRCurrency}`);
    console.log(`- Transactions with USD currency: ${s.transactionsWithUSDCurrency}`);
    
    if (s.transactionsWithINRCurrency === s.count) {
      console.log('✅ All transactions have INR currency');
    } else {
      console.log('⚠️  Some transactions may not have been migrated to INR');
    }
  }
  
  // Check by transaction type
  const typeStats = await collection.aggregate([
    {
      $group: {
        _id: '$transactionType',
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]).toArray();
  
  console.log('\\nBy transaction type:');
  typeStats.forEach(stat => {
    console.log(`- ${stat._id}: ${stat.count} transactions, avg: ₹${stat.avgAmount?.toFixed(2) || 0}, total: ₹${stat.totalAmount?.toFixed(2) || 0}`);
  });
}

async function checkMigrationReport(db) {
  console.log('\\n📊 Migration Report Check:');
  
  const reportsCollection = db.collection('migration_reports');
  const report = await reportsCollection.findOne(
    { type: 'currency_usd_to_inr' },
    { sort: { migrationDate: -1 } } // Get the latest report
  );
  
  if (report) {
    console.log(`- Migration date: ${report.migrationDate}`);
    console.log(`- Exchange rate used: ${report.exchangeRate}`);
    console.log('- Collections updated:');
    Object.entries(report.collections).forEach(([name, info]) => {
      console.log(`  • ${name}: ${info.documentsUpdated} documents (${info.status})`);
    });
    console.log('✅ Migration report found');
  } else {
    console.log('⚠️  No migration report found');
  }
}

// Sample data comparison
async function compareWithExpectedValues(db) {
  console.log('\\n🔍 Sample Data Check:');
  
  // Get a few sample campaigns
  const campaigns = await db.collection('campaigns').find({}).limit(3).toArray();
  
  if (campaigns.length > 0) {
    console.log('Sample campaigns:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. "${campaign.title}": Budget ₹${campaign.budget}, Payment Rate ₹${campaign.paymentRate}`);
    });
  }
  
  // Get a few sample wallets
  const wallets = await db.collection('wallets').find({}).limit(3).toArray();
  
  if (wallets.length > 0) {
    console.log('\\nSample wallets:');
    wallets.forEach((wallet, index) => {
      console.log(`${index + 1}. ${wallet.walletType}: Balance ₹${wallet.balance}, Currency ${wallet.currency}`);
    });
  }
}

// Main execution
if (require.main === module) {
  verifyCurrencyMigration()
    .then(() => {
      console.log('\\n🎉 Verification completed successfully!');
      console.log('\\n💡 Next steps:');
      console.log('1. Test the application UI to ensure amounts display correctly');
      console.log('2. Create a few test campaigns to verify calculations');
      console.log('3. Check analytics dashboards for proper currency display');
      console.log('4. Verify payment flows work with INR amounts');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyCurrencyMigration
};
