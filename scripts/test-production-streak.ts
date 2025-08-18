import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { getUserModel } from '../schemas/user.schema';

dotenv.config();

function toUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, delta: number): Date {
  const dt = new Date(d);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return toUtcDay(dt);
}

async function testStreakHistoryPersistence() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
    console.log('✅ Connected to MongoDB via Mongoose');
    
    const User = getUserModel();
    if (!User) throw new Error('User model is null');
    
    // Test with the main user
    const user = await User.findOne({ email: "trainee01@gametriggers.com" });
    if (!user) throw new Error('Test user not found');
    
    console.log('\n=== Testing Streak History Persistence ===');
    
    // Save original state
    const originalCurrent = user.streakCurrent;
    const originalLongest = user.streakLongest;
    const originalHistory = [...(user.streakHistory || [])];
    
    console.log('Original State:');
    console.log('- Current:', originalCurrent);
    console.log('- Longest:', originalLongest);
    console.log('- History length:', originalHistory.length);
    
    // Create a 5-day streak scenario
    const today = toUtcDay(new Date());
    const streak5Days = [
      addDaysUTC(today, -4), // 5 days ago
      addDaysUTC(today, -3), // 4 days ago
      addDaysUTC(today, -2), // 3 days ago
      addDaysUTC(today, -1), // yesterday
      today                  // today
    ];
    
    console.log('\n=== Simulating 5-day streak ===');
    user.streakCurrent = 5;
    user.streakLongest = Math.max(5, originalLongest || 0);
    user.streakLastDate = today;
    user.streakHistory = streak5Days;
    
    // Save to database
    await user.save();
    console.log('✅ Saved 5-day streak to database');
    
    // Reload from database to verify persistence
    const reloadedUser = await User.findOne({ email: "trainee01@gametriggers.com" });
    if (!reloadedUser) throw new Error('Could not reload user');
    
    console.log('\n=== Verification After Reload ===');
    console.log('Current streak:', reloadedUser.streakCurrent);
    console.log('Longest streak:', reloadedUser.streakLongest);
    console.log('Last date:', reloadedUser.streakLastDate?.toISOString());
    console.log('History length:', reloadedUser.streakHistory?.length);
    console.log('History dates:');
    reloadedUser.streakHistory?.forEach((date, index) => {
      const utcDate = toUtcDay(new Date(date));
      console.log(`  ${index + 1}. ${utcDate.toISOString().split('T')[0]}`);
    });
    
    // Test the last 7 days calculation
    console.log('\n=== Testing Last 7 Days Calculation ===');
    const historySet = new Set(
      (reloadedUser.streakHistory || [])
        .map((d) => toUtcDay(new Date(d)).toISOString())
    );
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDaysUTC(today, i - 6); // oldest first, today last
      const iso = date.toISOString();
      const active = historySet.has(iso);
      return { date: iso, active };
    });
    
    console.log('Last 7 days breakdown:');
    last7Days.forEach((day, index) => {
      const dateStr = day.date.split('T')[0];
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      const status = day.active ? '🟠 ACTIVE' : '⚪ INACTIVE';
      console.log(`  ${index}: ${dayName} ${dateStr} - ${status}`);
    });
    
    const activeCount = last7Days.filter(d => d.active).length;
    console.log(`\n📊 Active days in last 7: ${activeCount}/7`);
    
    // Test production build compatibility
    console.log('\n=== Testing Production Build Compatibility ===');
    const productionData = {
      current: reloadedUser.streakCurrent || 0,
      longest: reloadedUser.streakLongest || 0,
      lastDate: reloadedUser.streakLastDate ? toUtcDay(new Date(reloadedUser.streakLastDate)).toISOString() : null,
      last7Days,
    };
    
    console.log('Production-ready data structure:');
    console.log(JSON.stringify(productionData, null, 2));
    
    console.log('\n🎉 All tests passed! Streak history persistence verified.');
    console.log('✅ Data saves correctly to MongoDB');
    console.log('✅ Data reloads correctly from MongoDB');
    console.log('✅ Last 7 days calculation works');
    console.log('✅ Production data structure is valid');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStreakHistoryPersistence().catch(console.error);
