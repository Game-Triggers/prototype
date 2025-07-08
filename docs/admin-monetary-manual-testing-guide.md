# Admin Monetary Features - Manual Testing Guide

This document outlines all implemented admin monetary features and how to test them manually since we're using NextAuth for authentication.

## ✅ Implemented Admin API Endpoints

All endpoints are available under `/api/nest/admin/` and require admin authentication.

### 🏦 Wallet Management

#### 1. Adjust Wallet Balance
- **Endpoint**: `POST /api/nest/admin/wallets/:userId/adjust`
- **Purpose**: Admin can add or subtract funds from any user's wallet
- **Body**:
  ```json
  {
    "amount": 5000,        // Positive to add, negative to subtract
    "reason": "Test adjustment"
  }
  ```
- **Response**: Updated wallet and transaction details

#### 2. Freeze Wallet
- **Endpoint**: `POST /api/nest/admin/wallets/:userId/freeze`
- **Purpose**: Prevent all wallet operations for a user
- **Body**:
  ```json
  {
    "reason": "Suspicious activity"
  }
  ```

#### 3. Unfreeze Wallet
- **Endpoint**: `POST /api/nest/admin/wallets/:userId/unfreeze`
- **Purpose**: Re-enable wallet operations
- **Body**:
  ```json
  {
    "reason": "Investigation complete"
  }
  ```

#### 4. Get Wallet Details
- **Endpoint**: `GET /api/nest/admin/wallets/:userId/details`
- **Purpose**: View complete wallet information including transaction history

### 🎯 Campaign Management

#### 5. Force Complete Campaign
- **Endpoint**: `POST /api/nest/admin/campaigns/:campaignId/force-complete`
- **Purpose**: Admin forcefully completes a campaign and processes earnings
- **Body**:
  ```json
  {
    "reason": "Campaign goals met",
    "processEarnings": true
  }
  ```

#### 6. Force Cancel Campaign
- **Endpoint**: `POST /api/nest/admin/campaigns/:campaignId/force-cancel`
- **Purpose**: Admin cancels campaign with optional refund
- **Body**:
  ```json
  {
    "reason": "Policy violation",
    "refundFunds": true
  }
  ```

#### 7. Override Campaign Budget
- **Endpoint**: `PUT /api/nest/admin/campaigns/:campaignId/override-budget`
- **Purpose**: Admin adjusts campaign budget without charging brand
- **Body**:
  ```json
  {
    "newBudget": 75000,
    "reason": "Compensation for technical issues"
  }
  ```

#### 8. Emergency Campaign Control
- **Endpoint**: `POST /api/nest/admin/campaigns/:campaignId/emergency-control`
- **Purpose**: Emergency pause/activate/suspend campaigns
- **Body**:
  ```json
  {
    "action": "pause",     // pause, activate, suspend
    "reason": "Emergency maintenance"
  }
  ```

### 📊 Reporting & Analytics

#### 9. Campaign Financial Overview
- **Endpoint**: `GET /api/nest/admin/campaigns/:campaignId/financial-overview`
- **Purpose**: Detailed financial breakdown of a campaign

#### 10. Financial Dashboard
- **Endpoint**: `GET /api/nest/admin/dashboard/financial`
- **Purpose**: Platform-wide financial metrics

#### 11. Audit Reports
- **Endpoint**: `GET /api/nest/admin/reports/audit`
- **Purpose**: Generate audit reports
- **Query params**: `startDate`, `endDate`, `type`

## 🧪 Manual Testing Steps

### Prerequisites
1. Start the development server: `npm run dev:unified`
2. Ensure MongoDB is running with test data
3. Log in as admin user through the UI

### Test Scenario 1: Wallet Adjustment
1. Navigate to admin dashboard
2. Find a brand or streamer user
3. Use browser dev tools or API client (Postman/Insomnia) to call:
   ```
   POST /api/nest/admin/wallets/{userId}/adjust
   Content-Type: application/json
   Cookie: [session cookies from browser]
   
   {
     "amount": 10000,
     "reason": "Test credit adjustment"
   }
   ```
4. Verify wallet balance updated in database
5. Check transaction history shows admin adjustment

### Test Scenario 2: Campaign Force Complete
1. Create an active campaign with streamers
2. Let some impressions/earnings accumulate
3. Use API call to force complete:
   ```
   POST /api/nest/admin/campaigns/{campaignId}/force-complete
   
   {
     "reason": "Manual completion test",
     "processEarnings": true
   }
   ```
4. Verify:
   - Campaign status changed to COMPLETED
   - Streamer earnings processed
   - Brand reserved funds released
   - Transactions created

### Test Scenario 3: Emergency Controls
1. Find an active campaign
2. Emergency pause:
   ```
   POST /api/nest/admin/campaigns/{campaignId}/emergency-control
   
   {
     "action": "pause",
     "reason": "Emergency test"
   }
   ```
3. Verify campaign stops accepting impressions
4. Resume with action: "activate"

## 🔍 Database Verification

After each test, verify in MongoDB:

```javascript
// Check wallet balance
db.wallets.findOne({userId: ObjectId("USER_ID")})

// Check transactions
db.transactions.find({
  walletId: "WALLET_ID",
  description: /admin/i
}).sort({createdAt: -1})

// Check campaign status
db.campaigns.findOne({_id: ObjectId("CAMPAIGN_ID")})

// Check participations
db.campaignparticipations.find({
  campaignId: ObjectId("CAMPAIGN_ID")
})
```

## 🚨 Error Scenarios to Test

1. **Insufficient Funds**: Try negative adjustment exceeding wallet balance
2. **Invalid User**: Use non-existent userId
3. **Invalid Campaign**: Use non-existent campaignId
4. **Permission Denied**: Try calls without admin role
5. **Frozen Wallet**: Try operations on frozen wallet

## 📋 Test Checklist

- [ ] Wallet balance adjustment (positive)
- [ ] Wallet balance adjustment (negative)
- [ ] Wallet freeze/unfreeze
- [ ] Force complete campaign with earnings
- [ ] Force cancel campaign with refund
- [ ] Budget override
- [ ] Emergency pause/resume
- [ ] Financial dashboard data
- [ ] Audit report generation
- [ ] Error handling for edge cases

## 🎯 Expected Outcomes

All admin monetary operations should:
1. Create proper audit trail (transactions)
2. Emit events for notifications
3. Update wallet balances atomically
4. Maintain data consistency
5. Log admin actions
6. Handle errors gracefully
7. Respect business rules (e.g., can't create negative balance)

## 🔧 Integration Status

✅ **Fully Implemented**:
- AdminWalletService with all wallet operations
- AdminCampaignService with campaign controls
- Admin API controller with all endpoints
- Database transaction handling
- Event emission for audit trails
- Error handling and validation

✅ **Database Integration**:
- MongoDB schemas updated
- Transaction recording
- Wallet balance management
- Campaign status tracking

⚠️ **Requires Manual Testing**:
- UI integration (admin dashboard)
- NextAuth session handling
- Real-time notifications
- Comprehensive error scenarios

The admin monetary system is fully implemented in the backend and ready for manual testing through authenticated API calls or UI integration.
