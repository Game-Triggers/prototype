#!/usr/bin/env node

/**
 * Database Migration Script: instreamly → gametriggers
 * 
 * This script safely migrates all data from the 'instreamly' database 
 * to the new 'gametriggers' database.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const SOURCE_DB = 'instreamly';
const TARGET_DB = 'gametriggers';

async function migrateDatabase() {
  console.log('🚀 Starting database migration...');
  console.log(`📊 Source: ${SOURCE_DB}`);
  console.log(`🎯 Target: ${TARGET_DB}`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);
    
    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections to migrate:`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📦 Migrating collection: ${collectionName}`);
      
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Get document count
      const totalDocs = await sourceCollection.countDocuments();
      console.log(`   📄 Documents to migrate: ${totalDocs}`);
      
      if (totalDocs === 0) {
        console.log(`   ⏭️  Skipping empty collection`);
        continue;
      }
      
      // Check if target collection already exists and has data
      const existingDocs = await targetCollection.countDocuments();
      if (existingDocs > 0) {
        console.log(`   ⚠️  Target collection already has ${existingDocs} documents`);
        console.log(`   🗑️  Dropping target collection to ensure clean migration`);
        await targetCollection.drop();
      }
      
      // Stream documents in batches to handle large collections efficiently
      const batchSize = 1000;
      let processedDocs = 0;
      
      const cursor = sourceCollection.find({}).batchSize(batchSize);
      const documents = [];
      
      for await (const doc of cursor) {
        documents.push(doc);
        
        // Insert in batches
        if (documents.length === batchSize) {
          await targetCollection.insertMany(documents);
          processedDocs += documents.length;
          documents.length = 0; // Clear array
          console.log(`   📊 Progress: ${processedDocs}/${totalDocs} documents migrated`);
        }
      }
      
      // Insert remaining documents
      if (documents.length > 0) {
        await targetCollection.insertMany(documents);
        processedDocs += documents.length;
      }
      
      console.log(`   ✅ Completed: ${processedDocs} documents migrated`);
      
      // Copy indexes
      console.log(`   🔍 Copying indexes...`);
      const indexes = await sourceCollection.indexes();
      
      for (const index of indexes) {
        // Skip the default _id index
        if (index.name === '_id_') continue;
        
        try {
          await targetCollection.createIndex(index.key, {
            name: index.name,
            ...index
          });
          console.log(`   📌 Index copied: ${index.name}`);
        } catch (error) {
          console.log(`   ⚠️  Index copy failed for ${index.name}: ${error.message}`);
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Verification:');
    const sourceStats = await sourceDb.stats();
    const targetStats = await targetDb.stats();
    
    console.log(`📊 Source database size: ${(sourceStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Target database size: ${(targetStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file to use gametriggers database');
    console.log('2. Test your application with the new database');
    console.log('3. Once verified, you can safely drop the old instreamly database');
    console.log('\n⚠️  To drop old database (only after verification):');
    console.log('   mongosh --eval "use instreamly; db.dropDatabase()"');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Check if we should automatically drop the source database
const args = process.argv.slice(2);
const shouldDropSource = args.includes('--drop-source');

if (shouldDropSource) {
  console.log('⚠️  --drop-source flag detected');
  console.log('⚠️  The source database will be dropped after successful migration');
  console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...');
  
  setTimeout(async () => {
    await migrateDatabase();
    
    if (shouldDropSource) {
      console.log('\n🗑️  Dropping source database...');
      const client = new MongoClient(MONGODB_URI);
      try {
        await client.connect();
        await client.db(SOURCE_DB).dropDatabase();
        console.log('✅ Source database dropped successfully');
      } catch (error) {
        console.error('❌ Failed to drop source database:', error);
      } finally {
        await client.close();
      }
    }
  }, 5000);
} else {
  migrateDatabase();
}
