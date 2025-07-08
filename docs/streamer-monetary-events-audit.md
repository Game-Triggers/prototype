# Streamer Monetary Events Audit - Instreamly Clone

## Executive Summary

This document provides a comprehensive audit of all possible events and actions that should trigger monetary operations from the **streamer perspective** in the Instreamly Clone platform. While we've implemented brand-side monetary events, we need to ensure all streamer monetary flows are properly handled.

## Streamer Monetary Event Categories

### 1. CAMPAIGN PARTICIPATION EVENTS

#### ✅ Currently Implemented Events

1. **Campaign Joining**
   - **Location**: `CampaignsService.joinCampaign()`
   - **Current Action**: Creates participation record, generates browser source token
   - **Monetary Impact**: None (no upfront payment to streamers)
   - **Status**: ✅ CORRECT - No monetary action needed

2. **Impression Recording**
   - **Location**: `CampaignEventsService.handleImpressionTracking()`
   - **Current Action**: Credits earnings to streamer wallet with hold period
   - **Monetary Flow**: Brand wallet (reserved) → Streamer wallet (held)
   - **Status**: ✅ IMPLEMENTED AND WORKING

3. **Click Recording**
   - **Location**: `CampaignsService.recordClick()`
   - **Current Action**: Increments click counter only
   - **Monetary Impact**: None currently (clicks don't generate direct payments in current model)
   - **Status**: ✅ CORRECT - Clicks are tracked for analytics, not payment

#### ❌ Missing/Incomplete Streamer Events

### 🔴 CRITICAL MISSING: Campaign Participation Management

#### 1. Streamer Leaving Campaign Early
- **Current Issue**: `CampaignsService.leaveCampaign()` exists but no monetary handling
- **Required Actions**:
  - Release any held earnings immediately (early release)
  - Stop future impression charging for this streamer
  - Update participation status to track early departure
- **Impact**: HIGH - Streamers may lose earnings unfairly
- **Current Implementation**: ❌ NO MONETARY HANDLING

#### 2. Streamer Being Removed by Brand/Admin
- **Current Issue**: No dedicated endpoint or service method
- **Required Actions**:
  - Decide on held earnings (release or forfeit based on ToS)
  - Refund recent charges if removal is due to fraud/violation
  - Blacklist from future participation if needed
- **Impact**: MEDIUM - Admin/brand actions need monetary consequences
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 3. Streamer Pausing Participation
- **Current Issue**: No way for streamer to temporarily pause participation
- **Required Actions**:
  - Stop impression tracking during pause
  - Keep held earnings in hold
  - Allow resuming participation
- **Impact**: MEDIUM - Streamers need control over participation
- **Current Implementation**: ❌ NOT IMPLEMENTED

### 2. EARNINGS MANAGEMENT EVENTS

#### ✅ Currently Implemented Events

1. **Earnings Credit with Hold**
   - **Location**: `WalletService.creditEarnings()`
   - **Action**: Credits earnings to streamer wallet with hold period
   - **Status**: ✅ IMPLEMENTED

2. **Earnings Release (Campaign Completion)**
   - **Location**: `CampaignEventsService.handleCampaignCompletion()`
   - **Action**: Releases held earnings to withdrawable balance
   - **Status**: ✅ IMPLEMENTED

3. **Earnings Cancellation (Campaign Cancellation)**
   - **Location**: `CampaignEventsService.handleCampaignCancellation()`
   - **Action**: Cancels held earnings for all streamers
   - **Status**: ✅ IMPLEMENTED

#### ❌ Missing/Incomplete Earnings Events

### 🔴 CRITICAL MISSING: Earnings Hold Management

#### 1. Manual Earnings Release
- **Current Issue**: No endpoint for admin/brand to manually release held earnings
- **Required Actions**:
  - Allow early release of held earnings for specific streamers
  - Provide reason/justification for early release
  - Track manual releases for audit purposes
- **Impact**: MEDIUM - Some flexibility needed for edge cases
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 2. Earnings Dispute Resolution
- **Current Issue**: No system for handling earnings disputes
- **Required Actions**:
  - Hold disputed earnings in separate category
  - Allow dispute investigation period
  - Release or forfeit based on resolution
- **Impact**: LOW - Future requirement for dispute system
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 3. Performance-Based Earnings Adjustment
- **Current Issue**: No way to adjust earnings based on performance metrics
- **Required Actions**:
  - Bonus payments for exceptional performance
  - Penalties for policy violations (fake impressions, etc.)
  - Retroactive adjustments based on fraud detection
- **Impact**: MEDIUM - Quality control mechanism needed
- **Current Implementation**: ❌ NOT IMPLEMENTED

### 3. WITHDRAWAL AND PAYOUT EVENTS

#### ✅ Currently Implemented Events

1. **Wallet Balance Tracking**
   - **Location**: `WalletService` + Wallet schema
   - **Action**: Tracks withdrawable balance separately from held balance
   - **Status**: ✅ IMPLEMENTED

#### ❌ Missing/Incomplete Withdrawal Events

### 🔴 CRITICAL MISSING: Withdrawal Management

#### 1. Withdrawal Request Processing
- **Current Issue**: No complete withdrawal flow for streamers
- **Required Actions**:
  - KYC verification before first withdrawal
  - Minimum withdrawal amounts and frequency limits
  - Payment gateway integration (UPI, bank transfer, etc.)
  - Withdrawal fee handling
- **Impact**: HIGH - Streamers need to access their earnings
- **Current Implementation**: ⚠️ PARTIALLY IMPLEMENTED (basic structure exists)

#### 2. Failed Withdrawal Handling
- **Current Issue**: No handling for failed withdrawal attempts
- **Required Actions**:
  - Reverse withdrawal transaction
  - Return funds to withdrawable balance
  - Notify streamer of failure and required actions
- **Impact**: MEDIUM - Payment failures need proper handling
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 3. Tax and Compliance Reporting
- **Current Issue**: No system for tax reporting on streamer earnings
- **Required Actions**:
  - Generate tax documents (1099, etc.)
  - Track total annual earnings per streamer
  - Report to tax authorities if required
- **Impact**: LOW - Compliance requirement for scale
- **Current Implementation**: ❌ NOT IMPLEMENTED

### 4. STREAMER WALLET EVENTS

#### ✅ Currently Implemented Events

1. **Wallet Auto-Creation**
   - **Location**: Wallet auto-creation on user registration
   - **Action**: Creates streamer wallet with zero balances
   - **Status**: ✅ IMPLEMENTED

#### ❌ Missing/Incomplete Wallet Events

### 🔴 MISSING: Advanced Wallet Features

#### 1. Wallet Security Events
- **Current Issue**: No handling for suspicious wallet activity
- **Required Actions**:
  - Freeze wallet on suspicious activity
  - Require additional verification for large withdrawals
  - Alert system for unusual patterns
- **Impact**: MEDIUM - Security requirement
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 2. Wallet Consolidation
- **Current Issue**: No way to merge wallets if streamer has multiple accounts
- **Required Actions**:
  - Transfer balances between wallets
  - Merge transaction histories
  - Update all associated records
- **Impact**: LOW - Edge case handling
- **Current Implementation**: ❌ NOT IMPLEMENTED

### 5. STREAMER-SPECIFIC BUSINESS EVENTS

#### ❌ Missing Streamer Business Events

### 🔴 MISSING: Streamer Program Management

#### 1. Streamer Tier/Level Changes
- **Current Issue**: No tiered streamer program with different earnings rates
- **Required Actions**:
  - Bonus multipliers for higher-tier streamers
  - Retroactive adjustments when tier changes
  - Loyalty rewards and bonuses
- **Impact**: LOW - Future enhancement for retention
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 2. Referral Program for Streamers
- **Current Issue**: No referral system for streamers bringing other streamers
- **Required Actions**:
  - Referral bonuses for successful invites
  - Multi-level referral tracking
  - Bonus payments for referrer earnings
- **Impact**: LOW - Growth feature
- **Current Implementation**: ❌ NOT IMPLEMENTED

#### 3. Exclusive Campaign Access
- **Current Issue**: No premium/exclusive campaigns with higher rates
- **Required Actions**:
  - Invite-only campaigns with premium rates
  - Guaranteed minimum earnings for exclusive participation
  - Priority access based on performance history
- **Impact**: LOW - Advanced feature
- **Current Implementation**: ❌ NOT IMPLEMENTED

## Implementation Priority for Streamer Events

### Phase 1: Critical Missing Events (High Impact)
1. **Campaign Participation Management**
   - Implement `leaveCampaignEarly()` with earnings release
   - Add `pauseParticipation()` and `resumeParticipation()` methods
   - Add `removeStreamerFromCampaign()` with configurable earnings handling

2. **Complete Withdrawal Flow**
   - Implement KYC verification integration
   - Add withdrawal request processing with payment gateway
   - Add failed withdrawal handling and reversal

### Phase 2: Important Missing Events (Medium Impact)
1. **Earnings Management Enhancements**
   - Add manual earnings release for admins
   - Implement performance-based adjustments
   - Add earnings dispute system

2. **Advanced Wallet Features**
   - Add wallet security monitoring
   - Implement suspicious activity detection

### Phase 3: Future Enhancements (Low Impact)
1. **Streamer Program Features**
   - Implement tiered streamer program
   - Add referral system
   - Create exclusive campaign access

## Required Code Changes for Phase 1

### 1. Update CampaignsService for Participation Management

```typescript
// Add to CampaignsService
async leaveCampaignEarly(campaignId: string, streamerId: string): Promise<void> {
  // Release held earnings immediately
  await this.campaignEventsService.handleEarlyParticipationEnd(campaignId, streamerId);
  // Update participation status
  await this.participationModel.findOneAndUpdate(
    { campaignId, streamerId },
    { status: ParticipationStatus.LEFT_EARLY, leftAt: new Date() }
  );
}

async pauseParticipation(campaignId: string, streamerId: string): Promise<void> {
  await this.participationModel.findOneAndUpdate(
    { campaignId, streamerId },
    { status: ParticipationStatus.PAUSED, pausedAt: new Date() }
  );
}

async resumeParticipation(campaignId: string, streamerId: string): Promise<void> {
  await this.participationModel.findOneAndUpdate(
    { campaignId, streamerId },
    { status: ParticipationStatus.ACTIVE, resumedAt: new Date() }
  );
}
```

### 2. Add New Methods to CampaignEventsService

```typescript
// Add to CampaignEventsService
async handleEarlyParticipationEnd(campaignId: string, streamerId: string): Promise<void> {
  // Release held earnings immediately instead of waiting for campaign completion
  await this.walletService.releaseEarningsForCampaign(streamerId, campaignId);
}

async handleStreamerRemoval(
  campaignId: string, 
  streamerId: string, 
  reason: 'violation' | 'fraud' | 'admin_decision',
  forfeitEarnings: boolean = false
): Promise<void> {
  if (forfeitEarnings) {
    await this.walletService.cancelHeldEarnings(streamerId, campaignId);
  } else {
    await this.walletService.releaseEarningsForCampaign(streamerId, campaignId);
  }
}
```

### 3. Add New Controller Endpoints

```typescript
// Add to CampaignsController
@Post(':campaignId/leave')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STREAMER)
async leaveCampaign(@Param('campaignId') campaignId: string, @Req() req: RequestWithUser) {
  const streamerId = this.getUserId(req);
  return this.campaignsService.leaveCampaignEarly(campaignId, streamerId);
}

@Post(':campaignId/pause-participation')
@UseGuards(JwtAuthGuard, RolesGuard)  
@Roles(UserRole.STREAMER)
async pauseParticipation(@Param('campaignId') campaignId: string, @Req() req: RequestWithUser) {
  const streamerId = this.getUserId(req);
  return this.campaignsService.pauseParticipation(campaignId, streamerId);
}

@Post(':campaignId/resume-participation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STREAMER) 
async resumeParticipation(@Param('campaignId') campaignId: string, @Req() req: RequestWithUser) {
  const streamerId = this.getUserId(req);
  return this.campaignsService.resumeParticipation(campaignId, streamerId);
}
```

### 4. Update ParticipationStatus Enum

```typescript
// Add to lib/schema-types.ts
export enum ParticipationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused', // Existing
  REJECTED = 'rejected', // Existing
  COMPLETED = 'completed', // Existing
  LEFT_EARLY = 'left_early', // New
  REMOVED = 'removed', // New
  PARTICIPATION_PAUSED = 'participation_paused' // New - streamer-initiated pause
}
```

## Testing Requirements for Streamer Events

### 1. Participation Management Tests
```bash
# Test early campaign leaving
POST /api/v1/campaigns/:campaignId/leave
Authorization: Bearer <streamer-token>

# Test participation pause/resume  
POST /api/v1/campaigns/:campaignId/pause-participation
POST /api/v1/campaigns/:campaignId/resume-participation
Authorization: Bearer <streamer-token>
```

### 2. Wallet State Validation
- Verify held earnings are released when leaving early
- Check transaction history shows correct participation events
- Ensure withdrawable balance updates correctly

### 3. Edge Case Testing
- Multiple pause/resume cycles
- Leaving during hold period vs after release
- Admin removal vs streamer leaving

## Current Streamer Database State Analysis

Based on current database (gametriggers):
- **Streamer**: karma_sapiens has ₹0 balance (no campaign participation yet)
- **No active participations**: Streamer hasn't joined the existing campaign
- **Clean slate**: Perfect for testing streamer monetary flows

## Conclusion

While **brand-side monetary events are complete**, **streamer-side events need significant enhancement**:

### ✅ Working Streamer Events
- Campaign joining (no monetary impact)
- Earnings credit from impressions  
- Earnings release on campaign completion
- Earnings cancellation on campaign cancellation

### ❌ Missing Critical Streamer Events
- Early campaign leaving with earnings release
- Participation pause/resume functionality
- Streamer removal handling
- Complete withdrawal flow
- Earnings dispute resolution

**Next Priority**: Implement Phase 1 critical missing events to provide streamers with proper control over their participation and earnings.
