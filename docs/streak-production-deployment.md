# Streak System Production Deployment Guide

## Overview
The streak system is fully implemented and production-ready. This guide ensures proper deployment and migration.

## Pre-Deployment Checklist

### ✅ Database Migration
- [x] User schema includes streak fields (`streakCurrent`, `streakLongest`, `streakLastDate`, `streakHistory`)
- [x] Migration script created (`scripts/migrate-streak-production.js`)
- [x] Database indexes for performance (`streakLongest`, `streakCurrent`)
- [x] All existing users migrated with default values

### ✅ Backend Implementation
- [x] NestJS endpoints: `GET/POST /api/v1/users/me/streak`
- [x] Streak calculation logic (once per UTC day)
- [x] History tracking (last ~60 days, array of UTC dates)
- [x] Proper error handling and validation

### ✅ Frontend Implementation
- [x] StreakBadge component with 7-day visualization
- [x] Campaign page integration (triggers on visit)
- [x] Event-based real-time updates
- [x] localStorage caching for persistence
- [x] Responsive design and accessibility

### ✅ API Integration
- [x] Next.js API proxy routes (`/api/users/me/streak`)
- [x] Authentication via NextAuth JWT tokens
- [x] Proper error handling and fallbacks

## Deployment Commands

### Development Environment
```bash
# Install dependencies
npm install
npm run nest:install

# Run migrations
npm run migrate:streak

# Start development server
npm run dev:unified
```

### Production Deployment
```bash
# Full production build with migration
npm run build:production

# Or step by step:
npm run migrate:streak    # Run database migrations
npm run build            # Build Next.js and NestJS
npm run start:unified    # Start production server

# Quick deploy command
npm run deploy
```

## Environment Variables Required

### Essential
```env
MONGODB_URI=mongodb://localhost:27017/gametriggers
NEXTAUTH_SECRET=your-secure-secret
JWT_SECRET=your-jwt-secret
```

### Optional (with defaults)
```env
NODE_ENV=production
PORT=3000
NEST_PORT=3001
```

## Database Schema Verification

### User Document Structure
```javascript
{
  // ... existing fields ...
  
  // Streak tracking (automatically added by migration)
  "streakCurrent": 0,        // Current consecutive days
  "streakLongest": 0,        // Longest streak ever achieved
  "streakLastDate": null,    // Last date streak was updated (UTC)
  "streakHistory": [],       // Array of UTC dates when active
  
  // Timestamps
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Database Indexes
```javascript
// Performance indexes (created automatically)
{ "streakLongest": -1 }    // For leaderboards
{ "streakCurrent": -1 }    // For current streak queries
{ "updatedAt": 1 }         // For general queries
```

## Production Verification Steps

### 1. Database Migration
```bash
# Verify all users have streak fields
npm run migrate:streak
```

### 2. API Endpoints
Test endpoints are accessible:
- `GET /api/v1/users/me/streak` - Returns streak summary
- `POST /api/v1/users/me/streak/ping` - Increments daily streak

### 3. Frontend Integration
- StreakBadge appears in navbar
- Circles show orange for active days
- Counts update when visiting campaign pages
- Data persists across page refreshes

### 4. Performance Verification
- Database queries use indexes
- API responses are fast (<100ms)
- UI updates are immediate

## Troubleshooting

### Migration Issues
```bash
# Force re-run migration
npm run migrate:streak

# Check database directly
npx tsx scripts/verify-streak-fields.ts
```

### Data Not Showing
1. **Check authentication**: User must be logged in
2. **Verify migration**: Run `npm run migrate:streak`
3. **Clear cache**: Hard refresh browser (Cmd+Shift+R)
4. **Check logs**: Server logs will show API calls

### Performance Issues
1. **Verify indexes**: Check MongoDB has streak indexes
2. **Check queries**: Use MongoDB profiler
3. **Monitor memory**: Watch for memory leaks

## Rollback Plan

### If Issues Occur
1. **Database rollback**: Streak fields are optional, system works without them
2. **Feature toggle**: Remove StreakBadge from navbar temporarily
3. **API disable**: Return empty data from streak endpoints

### Safe Rollback Commands
```bash
# Remove streak fields (if needed)
db.users.updateMany({}, { $unset: { 
  streakCurrent: "", 
  streakLongest: "", 
  streakLastDate: "", 
  streakHistory: "" 
}})

# Remove indexes (if needed)
db.users.dropIndex("streak_longest_desc")
db.users.dropIndex("streak_current_desc")
```

## Monitoring

### Key Metrics
- **Streak API calls**: Monitor `/api/users/me/streak` usage
- **Database performance**: Query execution times
- **User engagement**: Average streak lengths
- **Error rates**: Failed API calls or migrations

### Health Checks
- Database connection and schema
- API endpoint response times
- Frontend component rendering
- User streak data accuracy

## Summary

✅ **Production Ready**: All components implemented and tested
✅ **Migration Safe**: Backward compatible, safe rollback available
✅ **Performance Optimized**: Proper indexing and caching
✅ **User Friendly**: Real-time updates, persistent data
✅ **Scalable**: Efficient queries, proper data structures

The streak system is ready for production deployment with automated migration and comprehensive monitoring.
