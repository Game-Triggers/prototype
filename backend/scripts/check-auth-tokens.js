// Script to check AuthSession collection and tokens
// Place this in a file under backend/scripts
const mongoose = require('mongoose');
require('dotenv').config();

const main = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
    console.log('Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');
    
    // Define the AuthSession schema
    const authSessionSchema = new mongoose.Schema({
      userId: String,
      provider: String,
      token: {
        accessToken: String,
        refreshToken: String,
        expiresAt: Date,
      },
      createdAt: Date,
      updatedAt: Date
    });
    
    // Create the model dynamically
    const AuthSession = mongoose.model('AuthSession', authSessionSchema);
    
    console.log('\n--- Checking AuthSession Collection ---');
    
    // Check if the collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('authsessions')) {
      console.log('AuthSession collection does not exist yet!');
    } else {
      console.log('AuthSession collection exists');
      
      // Count documents
      const count = await AuthSession.countDocuments();
      console.log(`Number of auth sessions: ${count}`);
      
      // List all auth sessions
      if (count > 0) {
        const sessions = await AuthSession.find().lean();
        
        console.log('\n--- Auth Sessions ---');
        sessions.forEach(session => {
          console.log(`User ID: ${session.userId}`);
          console.log(`Provider: ${session.provider}`);
          console.log(`Access Token: ${session.token?.accessToken ? session.token.accessToken.substring(0, 15) + '...' : 'Not set'}`);
          console.log(`Refresh Token: ${session.token?.refreshToken ? session.token.refreshToken.substring(0, 15) + '...' : 'Not set'}`);
          console.log(`Expires: ${session.token?.expiresAt ? session.token.expiresAt : 'Not set'}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

main();
