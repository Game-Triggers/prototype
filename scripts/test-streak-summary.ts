import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { getUserModel } from '../schemas/user.schema';

dotenv.config();

// Replicate the exact logic from UsersService
function toUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, delta: number): Date {
  const dt = new Date(d);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return toUtcDay(dt);
}

async function testStreakSummary() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
    console.log('Connected to MongoDB via Mongoose');
    
    const User = getUserModel();
    if (!User) throw new Error('User model is null');
    
    // Find the test user
    const user = await User.findOne({ email: "trainee01@gametriggers.com" });
    if (!user) throw new Error('Test user not found');
    
    console.log('\n=== Raw Database Data ===');
    console.log('streakCurrent:', user.streakCurrent);
    console.log('streakLongest:', user.streakLongest);
    console.log('streakLastDate:', user.streakLastDate);
    console.log('streakHistory:', user.streakHistory);
    
    // Replicate the getStreakSummary logic exactly
    const today = toUtcDay(new Date());
    console.log('\n=== Processing Logic ===');
    console.log('Today UTC:', today.toISOString());
    
    const historySet = new Set(
      (user.streakHistory || [])
        .map((d) => toUtcDay(new Date(d)).toISOString())
    );
    
    console.log('History Set:', Array.from(historySet));
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDaysUTC(today, i - 6); // oldest first, today last
      const iso = date.toISOString();
      const active = historySet.has(iso);
      return { date: iso, active };
    });
    
    console.log('\n=== Last 7 Days Result ===');
    last7Days.forEach((day, index) => {
      const dateStr = day.date.split('T')[0];
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      console.log(`${index}: ${dayName} ${dateStr} - ${day.active ? '🟠 ACTIVE' : '⚪ INACTIVE'}`);
    });
    
    const summary = {
      current: user.streakCurrent || 0,
      longest: user.streakLongest || 0,
      lastDate: user.streakLastDate ? toUtcDay(new Date(user.streakLastDate)).toISOString() : null,
      last7Days,
    };
    
    console.log('\n=== Final Summary Object ===');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStreakSummary().catch(console.error);
