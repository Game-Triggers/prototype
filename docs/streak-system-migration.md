# Streak System Database Schema Migration

## Overview
This document describes the migration and setup of the streak tracking system in the GameTriggers platform.

## Problem
The streak tracking fields (`streakCurrent`, `streakLongest`, `streakLastDate`, `streakHistory`) were added to the user schema, but existing users in the database didn't have these fields because MongoDB doesn't automatically backfill new schema fields.

## Solution
We implemented a comprehensive migration and indexing strategy to ensure all users have the streak fields and the database is optimized for streak queries.

## Files Modified

### 1. User Schema (`schemas/user.schema.ts`)
- **Added streak fields to IUser interface:**
  - `streakCurrent?: number` - Current consecutive days streak
  - `streakLongest?: number` - Longest streak ever achieved
  - `streakLastDate?: Date | null` - Last date streak was updated
  - `streakHistory?: Date[]` - Array of UTC dates when user was active

- **Added streak fields to Mongoose schema:**
  - All fields with appropriate defaults (0 for numbers, null for date, [] for array)

- **Added database indexes:**
  - `streakLongest: -1` - For leaderboard queries (descending order)
  - `streakCurrent: -1` - For current streak queries
  - Existing `updatedAt: 1` index maintained

### 2. Migration Scripts Created

#### `scripts/migrate-user-streak-fields.ts`
- Migrates all existing users to have streak fields
- Adds default values (0, 0, null, []) to users missing these fields
- Safe to run multiple times (only updates users missing fields)

#### `scripts/create-streak-indexes.ts`
- Creates MongoDB indexes for optimal streak query performance
- Creates individual indexes on `streakLongest` and `streakCurrent`
- Creates compound index for complex streak queries

#### `scripts/verify-streak-fields.ts`
- Verifies all users have streak fields
- Shows streak data for specific users
- Provides summary of all users' streak status

#### `scripts/test-streak-functionality.ts`
- Tests the streak functionality using Mongoose
- Simulates streak updates and verifies database persistence
- Confirms the schema works correctly with the application logic

## Database Changes Made

### Users Collection Updates
- **Before:** 4 users without streak fields
- **After:** All 4 users have streak fields with default values

### Indexes Created
```javascript
// Individual indexes for performance
{ "streakLongest": -1 }
{ "streakCurrent": -1 }

// Compound index for complex queries
{ "streakLongest": -1, "streakCurrent": -1, "updatedAt": -1 }
```

### Sample User Document (After Migration)
```javascript
{
  "_id": ObjectId("689476c84f54670ae4833249"),
  "email": "trainee01@gametriggers.com",
  "name": "bondsinghjha",
  // ... other existing fields ...
  "streakCurrent": 1,
  "streakLongest": 1,
  "streakLastDate": ISODate("2025-08-18T00:00:00.000Z"),
  "streakHistory": [ISODate("2025-08-18T00:00:00.000Z")],
  "updatedAt": ISODate("2025-08-18T05:52:33.403Z")
}
```

## Backend Integration

### Users Service (`backend/src/modules/users/users.service.ts`)
- `pingDailyStreak(userId)` - Updates streak once per UTC day
- `getStreakSummary(userId)` - Returns current streak status
- Both methods work with the new schema fields

### API Endpoints
- `POST /api/v1/users/me/streak/ping` - Increment streak for today
- `GET /api/v1/users/me/streak` - Get streak summary

### Frontend Integration
- Next.js API proxy at `/api/users/me/streak`
- StreakBadge component displays and updates streak data
- LocalStorage caching for persistence across page refreshes

## Verification Steps

1. **Run Migration (Done):**
   ```bash
   npx tsx scripts/migrate-user-streak-fields.ts
   ```

2. **Create Indexes (Done):**
   ```bash
   npx tsx scripts/create-streak-indexes.ts
   ```

3. **Verify Installation (Done):**
   ```bash
   npx tsx scripts/verify-streak-fields.ts
   ```

4. **Test Functionality (Done):**
   ```bash
   npx tsx scripts/test-streak-functionality.ts
   ```

## Current Status
✅ **COMPLETED** - All users now have streak fields in the database
✅ **COMPLETED** - Database indexes created for optimal performance
✅ **COMPLETED** - Schema migration verified and tested
✅ **COMPLETED** - Streak functionality working correctly

## Next Steps
- The streak system is now fully operational
- Users can visit campaign detail pages to increment their daily streak
- The StreakBadge component will display current and longest streaks
- All database operations are optimized with proper indexing

## Troubleshooting
If streak fields are still not visible:
1. Check you're connected to the correct database (`gametriggers`)
2. Verify the migration scripts ran successfully
3. Confirm the application is using the same MONGODB_URI
4. Test the streak endpoints directly via API calls
