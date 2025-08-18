import mongoose from 'mongoose';
import { getUserModel } from '../schemas/user.schema';

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prototype');
    console.log('Connected to MongoDB');

    const User = getUserModel();
    if (!User) {
      console.error('User model not available');
      return;
    }
    
    // Check existing users
    const users = await User.find({}, { email: 1, name: 1, role: 1, authProvider: 1, password: 1 });
    
    console.log('=== Existing Users ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Auth Provider: ${user.authProvider}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Check the trainee01 user specifically
    const traineeUser = await User.findOne({ email: 'trainee01@gametriggers.com' });
    if (traineeUser) {
      console.log('=== Trainee01 User Details ===');
      console.log('Email:', traineeUser.email);
      console.log('Name:', traineeUser.name);
      console.log('Role:', traineeUser.role);
      console.log('Auth Provider:', traineeUser.authProvider);
      console.log('Has Password:', traineeUser.password ? 'Yes' : 'No');
      console.log('Streak Current:', traineeUser.streakCurrent);
      console.log('Streak Longest:', traineeUser.streakLongest);
      console.log('Streak History Length:', traineeUser.streakHistory?.length || 0);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
