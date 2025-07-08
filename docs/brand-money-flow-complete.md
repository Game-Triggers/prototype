# 💰 Brand Money Flow - Complete Financial Journey

## 📋 Overview

This document traces the complete financial journey of money for brands in the Instreamly platform, from wallet funding through campaign completion and everything in between.

---

## 🚀 Phase 1: Initial Wallet Funding

### Step 1: Brand Deposits Money
```
Brand Action: Add ₹100,000 to wallet
Payment Method: UPI/Card/Net Banking
```

**Database Changes:**
```javascript
// Wallet Update
wallet.balance += 100000              // ₹1,00,000 available balance
wallet.availableBalance = 100000      // ₹1,00,000 available for campaigns

// Transaction Record
{
  type: "DEPOSIT",
  amount: 100000,
  status: "completed",
  description: "Wallet deposit via UPI",
  paymentMethod: "upi"
}
```

**Wallet State After Deposit:**
```javascript
{
  balance: 100000,           // ₹1,00,000 total
  reservedBalance: 0,        // ₹0 locked in campaigns
  availableBalance: 100000,  // ₹1,00,000 available
  totalSpent: 100000         // ₹1,00,000 lifetime deposits
}
```

---

## 🎯 Phase 2: Campaign Creation & Budget Reservation

### Step 2: Brand Creates Campaign
```
Campaign Details:
- Budget: ₹25,000
- Payment Type: CPM (Cost Per Thousand Impressions)  
- Rate: ₹1,660 per 1,000 impressions
- Expected Impressions: ~15,060 (₹25,000 ÷ ₹1.66)
```

### Step 3: Campaign Activation (Budget Reservation)
```
System Action: Reserve ₹25,000 from available balance
Trigger: Campaign status changes to "ACTIVE"
```

**Database Changes:**
```javascript
// Wallet Update (Brand)
wallet.balance -= 25000               // ₹75,000 remaining
wallet.reservedBalance += 25000       // ₹25,000 locked for campaign
wallet.availableBalance = 75000       // ₹75,000 still available

// Transaction Record
{
  type: "CAMPAIGN_RESERVE",
  amount: -25000,                     // Negative = deduction
  campaignId: "campaign_123",
  status: "pending",
  description: "Campaign budget reserved"
}

// Campaign Record
{
  budget: 25000,                      // ₹25,000 total budget
  remainingBudget: 25000,            // ₹25,000 still available
  status: "ACTIVE"
}
```

**Wallet State After Reservation:**
```javascript
{
  balance: 75000,            // ₹75,000 available for new campaigns
  reservedBalance: 25000,    // ₹25,000 locked in active campaign
  availableBalance: 75000,   // ₹75,000 available for withdrawal
  totalSpent: 100000         // ₹1,00,000 (no change - just reserved)
}
```

---

## 📺 Phase 3: Streamer Participation & Real-Time Charging

### Step 4: Streamers Join Campaign
```
Streamers add browser source to OBS/Streamlabs
Ads start displaying to viewers
Real-time impression tracking begins
```

### Step 5: Per-Impression Charging
```
Each 1000 impressions triggers:
- Cost calculation: ₹1,660 (CPM rate)
- Brand charge: ₹1,660 from reserved funds
- Streamer earning: ₹1,411 (85% of ₹1,660)
- Platform commission: ₹249 (15% of ₹1,660)
```

**Per-Impression Database Changes:**
```javascript
// Brand Wallet (per 1000 impressions)
wallet.reservedBalance -= 1660        // ₹1,660 charged from reserved

// Campaign Update
campaign.remainingBudget -= 1660      // ₹1,660 deducted from budget

// Streamer Wallet (85% to streamer)
streamerWallet.balance += 1411        // ₹1,411 earnings
streamerWallet.heldBalance += 1411    // Held for 3-7 days
streamerWallet.totalEarnings += 1411  // Lifetime earnings

// Platform Wallet (15% commission)
platformWallet.balance += 249         // ₹249 commission

// Transaction Records (3 transactions per milestone)
[
  {
    type: "CAMPAIGN_CHARGE",
    amount: -1660,
    userId: "brand_id",
    description: "CPM charge for 1000 impressions"
  },
  {
    type: "EARNINGS_HOLD",
    amount: 1411,
    userId: "streamer_id", 
    description: "Earnings for 1000 impressions (held)"
  },
  {
    type: "PLATFORM_FEE",
    amount: 249,
    userId: "platform",
    description: "Platform commission (15%)"
  }
]
```

**Example: After 10,000 impressions (10 charging cycles):**
```javascript
// Brand Wallet
{
  balance: 75000,            // ₹75,000 (unchanged - using reserved)
  reservedBalance: 8400,     // ₹25,000 - ₹16,600 = ₹8,400 remaining
  availableBalance: 75000,   // ₹75,000 still available
  totalSpent: 100000         // ₹1,00,000 (reserves don't count as spent yet)
}

// Campaign Status  
{
  budget: 25000,             // ₹25,000 original budget
  remainingBudget: 8400,     // ₹8,400 remaining 
  spent: 16600,              // ₹16,600 spent on impressions
  status: "ACTIVE"
}

// Streamer Wallet (per participating streamer)
{
  balance: 14110,            // ₹14,110 total earnings
  heldBalance: 14110,        // ₹14,110 in hold period
  withdrawableBalance: 0,    // ₹0 (still in hold)
  totalEarnings: 14110       // ₹14,110 lifetime earnings
}

// Platform Wallet
{
  balance: 2490,             // ₹2,490 commission earned
  totalEarnings: 2490        // ₹2,490 lifetime revenue
}
```

---

## ⏰ Phase 4: Earnings Release (After Hold Period)

### Step 6: Hold Period Completion (3-7 days later)
```
System Action: Release held earnings to withdrawable balance
Trigger: Automated process or admin approval
```

**Database Changes:**
```javascript
// Streamer Wallet
streamerWallet.heldBalance -= 14110       // ₹14,110 released from hold
streamerWallet.withdrawableBalance += 14110 // ₹14,110 now withdrawable

// Transaction Record
{
  type: "EARNINGS_RELEASE",
  amount: 14110,
  userId: "streamer_id",
  description: "Earnings released after hold period"
}
```

**Streamer Wallet After Release:**
```javascript
{
  balance: 14110,            // ₹14,110 total balance
  heldBalance: 0,            // ₹0 in hold (released)
  withdrawableBalance: 14110, // ₹14,110 available for withdrawal
  totalEarnings: 14110       // ₹14,110 lifetime earnings
}
```

---

## 🏁 Phase 5: Campaign Completion & Fund Release

### Step 7: Campaign Ends
```
Scenarios:
1. Budget fully spent (remainingBudget = 0)
2. Campaign end date reached
3. Manual campaign termination by brand
```

### Step 8: Remaining Budget Release
```
If campaign ends with remaining budget (e.g., ₹8,400):
System releases unused reserved funds back to brand
```

**Database Changes:**
```javascript
// Brand Wallet (if ₹8,400 unused)
wallet.balance += 8400                // ₹8,400 returned to available
wallet.reservedBalance -= 8400        // ₹8,400 no longer reserved
wallet.availableBalance += 8400       // ₹8,400 available again

// Campaign Update
campaign.status = "COMPLETED"
campaign.finalSpent = 16600           // ₹16,600 actual spending

// Transaction Record
{
  type: "CAMPAIGN_REFUND",
  amount: 8400,
  campaignId: "campaign_123",
  description: "Unused campaign budget returned"
}
```

**Final Brand Wallet State:**
```javascript
{
  balance: 83400,            // ₹75,000 + ₹8,400 refund
  reservedBalance: 0,        // ₹0 (campaign completed)
  availableBalance: 83400,   // ₹83,400 available
  totalSpent: 116600         // ₹1,00,000 + ₹16,600 actual campaign spend
}
```

---

## 💸 Phase 6: Streamer Withdrawals

### Step 9: Streamer Requests Withdrawal
```
Streamer Action: Request withdrawal of ₹14,110
Requirements: KYC completed, minimum amount met
```

**Database Changes:**
```javascript
// Streamer Wallet
streamerWallet.withdrawableBalance -= 14110  // ₹14,110 withdrawn
streamerWallet.balance -= 14110              // ₹14,110 deducted

// Transaction Record
{
  type: "WITHDRAWAL",
  amount: -14110,
  userId: "streamer_id",
  status: "processing",
  description: "Bank transfer withdrawal",
  bankDetails: { /* account info */ }
}
```

**Final Streamer Wallet State:**
```javascript
{
  balance: 0,                // ₹0 current balance
  heldBalance: 0,            // ₹0 in hold
  withdrawableBalance: 0,    // ₹0 available
  totalEarnings: 14110,      // ₹14,110 lifetime earnings
  totalWithdrawn: 14110      // ₹14,110 lifetime withdrawals
}
```

---

## 📊 Complete Money Flow Summary

### Money Distribution (₹16,600 campaign spend):
```
Original Brand Payment: ₹16,600 (100%)
├── Streamer Earnings:  ₹14,110 (85%)
└── Platform Commission: ₹2,490 (15%)

Total Processed: ₹16,600 ✅
Brand Refund: ₹8,400 (unused budget)
```

### Transaction Types Created:
1. **DEPOSIT**: Brand adds money to wallet
2. **CAMPAIGN_RESERVE**: Budget locked for campaign
3. **CAMPAIGN_CHARGE**: Per-impression charges from reserved funds
4. **EARNINGS_HOLD**: Streamer earnings (held period)
5. **PLATFORM_FEE**: Platform commission extraction
6. **EARNINGS_RELEASE**: Earnings become withdrawable
7. **CAMPAIGN_REFUND**: Unused budget returned
8. **WITHDRAWAL**: Streamer cashes out earnings

### Key Financial Controls:
- ✅ **Budget Validation**: Cannot spend more than reserved
- ✅ **Hold Period**: Protects against fraud/disputes
- ✅ **Commission Extraction**: Automatic 15% platform fee
- ✅ **Refund Mechanism**: Unused budgets returned
- ✅ **Audit Trail**: Every rupee tracked with transactions

---

## 🚨 Special Scenarios

### Auto Top-up (Optional)
```javascript
// If brand enables auto top-up
if (wallet.balance < wallet.autoTopupThreshold) {
  // Automatically add funds when balance is low
  await addFunds(wallet.autoTopupAmount);
}
```

### Campaign Cancellation
```javascript
// If campaign cancelled mid-way
const unusedBudget = campaign.remainingBudget;
const heldEarnings = getTotalHeldEarnings(campaignId);

// Refund unused budget to brand
await releaseReservedFunds(brandId, unusedBudget);

// Cancel held streamer earnings
await cancelHeldEarnings(campaignId);
```

### Low Budget Warning
```javascript
// When campaign budget < 10% remaining
if (campaign.remainingBudget < campaign.budget * 0.1) {
  // Notify brand to add more budget or campaign will pause
  await sendLowBudgetAlert(campaign.brandId);
}
```

---

## 🎯 Next Steps for Testing

1. **Create a test campaign** with the funded brand wallet
2. **Simulate streamer participation** and impression tracking
3. **Verify real-time charging** and money movement
4. **Test hold period** and earnings release
5. **Complete campaign lifecycle** including refunds

The system is now ready for end-to-end testing with ₹100,000 in the brand wallet! 🚀
