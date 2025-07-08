# MongoDB Duplicate Key Error Fix - Campaign Selection

## Problem
MongoDB was throwing a duplicate key error:
```
E11000 duplicate key error collection: gametriggers.campaignparticipations index: browserSourceToken_1 dup key
```

This occurred because the overlay service was trying to update multiple campaign participation records with the same `browserSourceToken` (the user's overlay token), but this field has a unique index in MongoDB.

## Root Cause
In the `getOverlayData` method, when a streamer had multiple active campaign participations, the code was attempting to:
```typescript
activeParticipation.browserSourceToken = token;
await activeParticipation.save();
```

This would try to set the same token on multiple participation records, violating the unique constraint.

## Solution
1. **Removed Token Update**: Eliminated the code that was updating `browserSourceToken` on participation records
2. **Consistent Tracking**: Updated impression and click tracking to use the same smart campaign selection logic
3. **Unified Logic**: All three operations (display, impressions, clicks) now use the `selectOptimalCampaign` method

## Changes Made

### 1. Overlay Display (`getOverlayData`)
- Removed the problematic token update
- Campaign selection works without modifying participation records

### 2. Impression Tracking (`recordImpression`)
- Updated to use smart campaign selection instead of "first active participation"
- Ensures impressions are credited to the currently displayed campaign

### 3. Click Tracking (`recordClick`)
- Updated to use smart campaign selection instead of "first active participation"  
- Ensures clicks are credited to the currently displayed campaign

## Benefits
- ✅ **No More Database Errors**: Eliminates the duplicate key constraint violation
- ✅ **Consistent Attribution**: All metrics (impressions, clicks, earnings) are attributed to the correct campaign
- ✅ **Fair Campaign Rotation**: The enhanced strategies work properly across all tracking methods
- ✅ **Simplified Architecture**: Removes unnecessary token synchronization between records

## How It Works Now
1. User's overlay token identifies the streamer
2. Smart selection algorithm chooses the optimal campaign to display
3. The same algorithm determines which campaign receives credit for impressions/clicks
4. No need to modify individual participation records

This fix ensures that the enhanced campaign selection strategies work correctly while maintaining data integrity in MongoDB.
