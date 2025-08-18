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

async function simulateMultiDayStreak() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
    console.log('Connected to MongoDB via Mongoose');
    
    const User = getUserModel();
    if (!User) throw new Error('User model is null');
    
    // Find the test user
    const user = await User.findOne({ email: "trainee01@gametriggers.com" });
    if (!user) throw new Error('Test user not found');
    
    console.log('\n=== Simulating 3-day streak ===');
    
    const today = toUtcDay(new Date());
    const yesterday = addDaysUTC(today, -1);
    const dayBefore = addDaysUTC(today, -2);
    
    // Add multiple days to history
    const historyDates = [dayBefore, yesterday, today];
    
    user.streakCurrent = 3;
    user.streakLongest = 3;
    user.streakLastDate = today;
    user.streakHistory = historyDates;
    
    await user.save();
    
    console.log('Updated user with 3-day streak');
    console.log('Streak History:', user.streakHistory.map(d => d.toISOString()));
    
    // Test the summary logic
    const historySet = new Set(
      user.streakHistory.map((d) => toUtcDay(new Date(d)).toISOString())
    );
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDaysUTC(today, i - 6);
      const iso = date.toISOString();
      const active = historySet.has(iso);
      return { date: iso, active };
    });
    
    console.log('\n=== 7-Day Activity with 3-day streak ===');
    last7Days.forEach((day, index) => {
      const dateStr = day.date.split('T')[0];
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      console.log(`${index}: ${dayName} ${dateStr} - ${day.active ? '🟠 ACTIVE' : '⚪ INACTIVE'}`);
    });
    
    console.log('\n✅ Test completed - You should now see 3 orange circles in the UI!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

simulateMultiDayStreak().catch(console.error);
