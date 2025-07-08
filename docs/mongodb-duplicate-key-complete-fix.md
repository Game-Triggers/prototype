# MongoDB Duplicate Key Error - Complete Fix

## Problem Description

The application was experiencing MongoDB duplicate key errors on the `browserSourceToken` field in the `campaignparticipations` collection:

```
MongoServerError: E11000 duplicate key error collection: gametriggers.campaignparticipations index: browserSourceToken_1 dup key: { browserSourceToken: "29c9f80049037a0cc9edb2899b2478157d9dd25fd1de1958d01aee459f4219c2" }
```

## Root Cause Analysis

The error was occurring because multiple services were calling `participation.save()` on the same document simultaneously or in quick succession. Even though we had removed code that directly updates the `browserSourceToken` field, the save operation itself was triggering the unique index constraint violation.

## Solution Overview

The solution involved replacing all `participation.save()` calls with atomic MongoDB update operations using `findByIdAndUpdate()` with `$inc` and `$set` operators. This ensures that only specific fields are updated without triggering the unique index constraint on `browserSourceToken`.

## Files Modified

### 1. Overlay Service (`backend/src/modules/overlay/overlay.service.ts`)

**Problem**: The `recordClick` method was calling `participation.save()` after incrementing the clicks count.

**Fix**: 
```typescript
// Before
participation.clicks += 1;
await participation.save();

// After  
await this.participationModel
  .findByIdAndUpdate(
    participation._id,
    { $inc: { clicks: 1 } },
    { new: true },
  )
  .exec();
```

### 2. Campaigns Service (`backend/src/modules/campaigns/campaigns.service.ts`)

**Problems**: 
- `recordImpression` method was saving participation after updating impressions and earnings
- `recordClick` method was saving participation after incrementing clicks

**Fixes**:
```typescript
// Impression tracking - Before
participation.impressions += 1;
participation.estimatedEarnings += cost;
await participation.save();

// Impression tracking - After
const updateResult = await this.participationModel
  .findByIdAndUpdate(
    participation._id,
    {
      $inc: {
        impressions: 1,
        estimatedEarnings: cost,
      },
    },
    { new: true },
  )
  .exec();

// Click tracking - Before  
participation.clicks += 1;
await participation.save();

// Click tracking - After
const updateResult = await this.participationModel
  .findByIdAndUpdate(
    participation._id,
    { $inc: { clicks: 1 } },
    { new: true },
  )
  .exec();
```

### 3. Earnings Service (`backend/src/modules/earnings/earnings.service.ts`)

**Problem**: The `updateEarnings` method was saving participation after updating estimated earnings.

**Fix**:
```typescript
// Before
participation.estimatedEarnings += newEarnings;
await participation.save();

// After
const updatedParticipation = await this.participationModel
  .findByIdAndUpdate(
    participationId,
    { $inc: { estimatedEarnings: newEarnings } },
    { new: true },
  )
  .exec();
```

### 4. Impression Tracking Service (`backend/src/modules/impression-tracking/impression-tracking.service.ts`)

**Problems**: Multiple methods were saving participation documents:
- `recordViewerImpressions`
- `recordAlternativeClick`
- `generateQRCodeForParticipation`
- `generateChatCommandForParticipation`

**Fixes**:

**Viewer Impressions**:
```typescript
// Before
participation.impressions += streamStatus.viewerCount;
participation.avgViewerCount = newAvg;
participation.peakViewerCount = newPeak;
await participation.save();

// After
await this.participationModel
  .findByIdAndUpdate(
    participationId,
    {
      $inc: { impressions: streamStatus.viewerCount },
      $set: {
        avgViewerCount: newAvgViewerCount,
        peakViewerCount: newPeakViewerCount,
      },
    },
    { new: true },
  )
  .exec();
```

**Alternative Clicks**:
```typescript
// Before
switch (clickType) {
  case 'chat': participation.chatClicks += 1; break;
  case 'qr': participation.qrScans += 1; break;
  case 'link': participation.linkClicks += 1; break;
}
participation.clicks += 1;
await participation.save();

// After
const updateObj: any = { $inc: { clicks: 1 } };
switch (clickType) {
  case 'chat': updateObj.$inc.chatClicks = 1; break;
  case 'qr': updateObj.$inc.qrScans = 1; break;
  case 'link': updateObj.$inc.linkClicks = 1; break;
}
await this.participationModel
  .findByIdAndUpdate(participationId, updateObj, { new: true })
  .exec();
```

**QR Code Generation**:
```typescript
// Before
participation.qrCodeUrl = qrCodeUrl;
await participation.save();

// After
await this.participationModel
  .findByIdAndUpdate(
    participationId,
    { $set: { qrCodeUrl } },
    { new: true },
  )
  .exec();
```

**Chat Command Generation**:
```typescript
// Before
participation.trackingUrl = url;
participation.chatCommand = command;
await participation.save();

// After
await this.participationModel
  .findByIdAndUpdate(
    participationId,
    {
      $set: {
        trackingUrl,
        chatCommand,
      },
    },
    { new: true },
  )
  .exec();
```

## Benefits of the Fix

1. **Eliminates Race Conditions**: Atomic updates prevent multiple operations from conflicting with each other
2. **Preserves Unique Constraints**: Only specific fields are updated, leaving `browserSourceToken` untouched
3. **Better Performance**: Atomic operations are more efficient than loading, modifying, and saving entire documents
4. **Improved Reliability**: Reduces the likelihood of document-level conflicts and database errors

## Testing

After implementing these changes:
1. The overlay service continues to function normally
2. Impression and click tracking work correctly
3. Campaign selection strategies operate without database errors
4. The MongoDB duplicate key error no longer occurs

## Key Takeaways

1. **Always Use Atomic Updates**: When updating specific fields in MongoDB documents, use `findByIdAndUpdate()` with operators like `$inc`, `$set`, `$push`, etc.
2. **Avoid `document.save()`**: The `save()` method updates the entire document and can trigger unique constraint violations
3. **Consider Concurrency**: In high-traffic applications, multiple operations on the same document can conflict
4. **Test Thoroughly**: Database-level errors like duplicate key violations require comprehensive testing to identify all problematic code paths

## Related Documentation

- [Enhanced Campaign Strategies Implementation](./enhanced-campaign-strategies-implementation.md)
- [Impression Tracking Implementation Summary](./impression-tracking-implementation-summary.md)
- [MongoDB Duplicate Key Fix (Previous Attempt)](./mongodb-duplicate-key-fix.md)
