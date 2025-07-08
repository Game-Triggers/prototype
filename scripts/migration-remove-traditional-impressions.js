/**
 * Migration Script: Remove Traditional Impressions
 * 
 * This script migrates the database to remove traditional impression tracking
 * and makes viewer-based impressions the primary impression metric.
 * 
 * IMPORTANT: 
 * - Run this script during a maintenance window
 * - Ensure you have a database backup before running
 * - Test on staging environment first
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
const DATABASE_NAME = 'gametriggers';
const COLLECTION_NAME = 'campaignparticipations';

async function migrateTraditionalImpressions() {
  console.log('Starting traditional impression removal migration...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Step 1: Get count of documents to migrate
    const totalDocs = await collection.countDocuments();
    console.log(`Total documents to migrate: ${totalDocs}`);
    
    // Step 2: Get current statistics
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalTraditionalImpressions: { $sum: '$impressions' },
          totalViewerImpressions: { $sum: '$viewerImpressions' },
          docsWithTraditionalImpressions: {
            $sum: { $cond: [{ $gt: ['$impressions', 0] }, 1, 0] }
          },
          docsWithViewerImpressions: {
            $sum: { $cond: [{ $gt: ['$viewerImpressions', 0] }, 1, 0] }
          }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      console.log('Current statistics:');
      console.log(`- Traditional impressions total: ${stats[0].totalTraditionalImpressions || 0}`);
      console.log(`- Viewer impressions total: ${stats[0].totalViewerImpressions || 0}`);
      console.log(`- Documents with traditional impressions: ${stats[0].docsWithTraditionalImpressions || 0}`);
      console.log(`- Documents with viewer impressions: ${stats[0].docsWithViewerImpressions || 0}`);
    }
    
    // Step 3: Create backup field (temporary storage for traditional impressions)
    console.log('Creating backup of traditional impressions...');
    await collection.updateMany(
      {},
      {
        $set: {
          _traditionalImpressionsBackup: '$impressions',
          _migrationTimestamp: new Date()
        }
      }
    );
    
    // Step 4: Replace impressions with viewerImpressions
    console.log('Replacing traditional impressions with viewer impressions...');
    const migrationResult = await collection.updateMany(
      {},
      [
        {
          $set: {
            impressions: {
              $cond: [
                { $ifNull: ['$viewerImpressions', false] },
                '$viewerImpressions',
                0
              ]
            }
          }
        }
      ]
    );
    
    console.log(`Migration result: ${migrationResult.modifiedCount} documents updated`);
    
    // Step 5: Remove viewerImpressions field
    console.log('Removing viewerImpressions field...');
    await collection.updateMany(
      {},
      {
        $unset: {
          viewerImpressions: ''
        }
      }
    );
    
    // Step 6: Verify migration
    console.log('Verifying migration...');
    const verificationStats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          docsWithImpressions: {
            $sum: { $cond: [{ $gt: ['$impressions', 0] }, 1, 0] }
          },
          docsWithViewerImpressions: {
            $sum: { $cond: [{ $exists: ['$viewerImpressions'] }, 1, 0] }
          },
          docsWithBackup: {
            $sum: { $cond: [{ $exists: ['$_traditionalImpressionsBackup'] }, 1, 0] }
          }
        }
      }
    ]).toArray();
    
    if (verificationStats.length > 0) {
      console.log('Post-migration statistics:');
      console.log(`- Total impressions (now viewer-based): ${verificationStats[0].totalImpressions || 0}`);
      console.log(`- Documents with impressions: ${verificationStats[0].docsWithImpressions || 0}`);
      console.log(`- Documents with viewerImpressions field (should be 0): ${verificationStats[0].docsWithViewerImpressions || 0}`);
      console.log(`- Documents with backup field: ${verificationStats[0].docsWithBackup || 0}`);
    }
    
    // Step 7: Update schema indexes if needed
    console.log('Updating indexes...');
    try {
      // Drop old index on viewerImpressions if it exists
      await collection.dropIndex('viewerImpressions_1');
      console.log('Dropped viewerImpressions index');
    } catch (error) {
      console.log('viewerImpressions index did not exist or could not be dropped');
    }
    
    // Ensure index on impressions field exists
    await collection.createIndex({ impressions: 1 });
    console.log('Created/verified impressions index');
    
    console.log('Migration completed successfully!');
    console.log('');
    console.log('IMPORTANT NOTES:');
    console.log('- Traditional impression data is backed up in _traditionalImpressionsBackup field');
    console.log('- You can remove backup fields after 30 days if migration is successful');
    console.log('- Update your application code to remove references to viewerImpressions');
    console.log('- Deploy updated application code that only uses impressions field');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Script to clean up backup fields (run after 30 days if migration is successful)
async function cleanupBackupFields() {
  console.log('Cleaning up backup fields...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.updateMany(
      {},
      {
        $unset: {
          _traditionalImpressionsBackup: '',
          _migrationTimestamp: ''
        }
      }
    );
    
    console.log(`Cleanup result: ${result.modifiedCount} documents cleaned`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Rollback script (use only if migration needs to be reverted)
async function rollbackMigration() {
  console.log('Rolling back migration...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Step 1: Restore traditional impressions from backup
    await collection.updateMany(
      { _traditionalImpressionsBackup: { $exists: true } },
      [
        {
          $set: {
            viewerImpressions: '$impressions',
            impressions: '$_traditionalImpressionsBackup'
          }
        }
      ]
    );
    
    // Step 2: Remove backup fields
    await collection.updateMany(
      {},
      {
        $unset: {
          _traditionalImpressionsBackup: '',
          _migrationTimestamp: ''
        }
      }
    );
    
    console.log('Rollback completed successfully!');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Main execution
if (require.main === module) {
  const operation = process.argv[2];
  
  switch (operation) {
    case 'migrate':
      migrateTraditionalImpressions().catch(console.error);
      break;
    case 'cleanup':
      cleanupBackupFields().catch(console.error);
      break;
    case 'rollback':
      rollbackMigration().catch(console.error);
      break;
    default:
      console.log('Usage:');
      console.log('  node migration-remove-traditional-impressions.js migrate   - Run the migration');
      console.log('  node migration-remove-traditional-impressions.js cleanup   - Clean up backup fields');
      console.log('  node migration-remove-traditional-impressions.js rollback  - Rollback the migration');
      process.exit(1);
  }
}

module.exports = {
  migrateTraditionalImpressions,
  cleanupBackupFields,
  rollbackMigration
};
