import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function debugStreakCircles() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Find the test user and show detailed streak data
    const user = await users.findOne(
      { email: "trainee01@gametriggers.com" }
    );
    
    console.log('\n=== Current User Streak Data ===');
    console.log('Email:', user?.email);
    console.log('Current Streak:', user?.streakCurrent);
    console.log('Longest Streak:', user?.streakLongest);
    console.log('Last Streak Date:', user?.streakLastDate);
    console.log('Streak History:', user?.streakHistory);
    
    // Show what the last 7 days should look like
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    console.log('\n=== Last 7 Days Analysis ===');
    console.log('Today UTC:', todayUtc.toISOString());
    
    const historySet = new Set(
      (user?.streakHistory || []).map((d: Date) => {
        const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        return utc.toISOString();
      })
    );
    
    console.log('History Set:', Array.from(historySet));
    
    const last7Days = [];
    for (let i = -6; i <= 0; i++) {
      const date = new Date(todayUtc);
      date.setUTCDate(todayUtc.getUTCDate() + i);
      const iso = date.toISOString();
      const active = historySet.has(iso);
      last7Days.push({ date: iso, active, dayName: date.toLocaleDateString('en-US', { weekday: 'short' }) });
    }
    
    console.log('\n=== Last 7 Days Breakdown ===');
    last7Days.forEach((day, index) => {
      console.log(`${index}: ${day.dayName} ${day.date.split('T')[0]} - ${day.active ? '🟠 ACTIVE' : '⚪ INACTIVE'}`);
    });
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await client.close();
  }
}

// Run the debug
debugStreakCircles().catch(console.error);
