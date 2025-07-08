# Payment & Earnings System Test Cases

## Overview
This document provides comprehensive test cases for the Gametriggers payment and earnings system. All tests use mock implementations, so no real payment gateways are required.

## Prerequisites
1. Development server running (`npm run dev:unified`)
2. At least 3 test users:
   - 1 Brand user
   - 1 Streamer user  
   - 1 Admin user

## Test Environment Setup

### 1. Create Test Users
Use the registration endpoint or admin panel to create:

**Brand User:**
```json
{
  "email": "brand@test.com",
  "name": "Test Brand",
  "role": "brand"
}
```

**Streamer User:**
```json
{
  "email": "streamer@test.com", 
  "name": "Test Streamer",
  "role": "streamer"
}
```

**Admin User:**
```json
{
  "email": "admin@test.com",
  "name": "Test Admin", 
  "role": "admin"
}
```

## Test Cases

### A. Wallet Management Tests

#### Test A1: Wallet Creation
**Objective:** Verify wallets are automatically created for new users
**Steps:**
1. Register a new brand user
2. Check wallet creation via: `GET /api/wallet/balance`
**Expected Result:**
- Brand wallet created with balance: 0
- Wallet type: "brand"
- All balance fields initialized to 0

#### Test A2: Brand Wallet Top-up
**Objective:** Test adding funds to brand wallet
**Steps:**
1. Login as brand user
2. Create payment intent: `POST /api/payments/create-intent`
   ```json
   {
     "amount": 10000,
     "currency": "inr",
     "paymentMethod": "card"
   }
   ```
3. Mock payment completion: `POST /api/payments/confirm`
4. Check wallet balance: `GET /api/wallet/balance`

**Expected Result:**
- Payment intent created with mock client secret
- Wallet balance updated to ₹10,000
- Transaction recorded in history

#### Test A3: Streamer Wallet Check
**Objective:** Verify streamer wallet initialization
**Steps:**
1. Login as streamer user
2. Check wallet: `GET /api/wallet/balance`
**Expected Result:**
- Streamer wallet with balance: 0
- Wallet type: "streamer"
- totalEarnings: 0

### B. Campaign & Earnings Tests

#### Test B1: Campaign Budget Reservation
**Objective:** Test campaign fund reservation when activated
**Steps:**
1. Login as brand user (ensure wallet has ₹10,000)
2. Create a campaign with ₹5,000 budget
3. Activate the campaign
4. Check wallet balance: `GET /api/wallet/balance`
5. Check transaction history: `GET /api/wallet/transactions`

**Expected Result:**
- Available balance: ₹5,000
- Reserved balance: ₹5,000
- Transaction type: "campaign_reserve"

#### Test B2: Milestone Completion & Earnings
**Objective:** Test earnings credit when streamers hit milestones
**Steps:**
1. Simulate milestone completion (via campaign events service)
2. As streamer, check wallet: `GET /api/wallet/balance`
3. Check transaction history: `GET /api/wallet/transactions`

**Expected Result:**
- Streamer heldBalance increased
- Transaction type: "earnings_hold"
- Hold period: 3 days default

#### Test B3: Earnings Release
**Objective:** Test earnings release after hold period
**Steps:**
1. Manually trigger earnings release (admin action)
2. Check streamer wallet balance
3. Check transaction history

**Expected Result:**
- heldBalance decreased
- withdrawableBalance increased
- Transaction type: "earnings_release"

### C. Withdrawal Tests

#### Test C1: Withdrawal Request
**Objective:** Test streamer withdrawal request
**Steps:**
1. Login as streamer (ensure withdrawableBalance > 0)
2. Create withdrawal request: `POST /api/wallet/withdraw`
   ```json
   {
     "amount": 1000,
     "bankAccount": "1234567890",
     "ifscCode": "HDFC0000123",
     "accountHolderName": "Test Streamer"
   }
   ```
3. Check wallet balance
4. Check transaction history

**Expected Result:**
- Withdrawal request created
- Amount deducted from withdrawableBalance
- Transaction status: "pending"

#### Test C2: Admin Withdrawal Approval
**Objective:** Test admin approving withdrawals
**Steps:**
1. Login as admin
2. View pending withdrawals: `GET /api/admin/finance/withdrawals`
3. Approve withdrawal: `PUT /api/admin/finance/withdrawals/{id}`
4. Check updated transaction status

**Expected Result:**
- Withdrawal status: "completed"
- Mock payout processed
- Transaction updated with approval details

### D. KYC Integration Tests

#### Test D1: KYC Submission
**Objective:** Test KYC document submission
**Steps:**
1. Login as streamer
2. Submit KYC: `POST /api/kyc/submit`
   ```json
   {
     "documentType": "pan",
     "documentNumber": "ABCDE1234F",
     "personalInfo": {
       "fullName": "Test Streamer",
       "address": "Test Address",
       "phone": "9876543210"
     }
   }
   ```
3. Check KYC status: `GET /api/kyc/status`

**Expected Result:**
- KYC status: "submitted"
- Document details saved
- Withdrawal limits applied

#### Test D2: KYC Approval Impact
**Objective:** Test withdrawal limits after KYC approval
**Steps:**
1. Admin approves KYC (mock)
2. Streamer attempts large withdrawal
3. Check if withdrawal limit increased

**Expected Result:**
- Higher withdrawal limits enabled
- KYC verified flag in transactions

### E. Admin Finance Dashboard Tests

#### Test E1: Finance Overview
**Objective:** Test admin finance dashboard data
**Steps:**
1. Login as admin
2. Get finance overview: `GET /api/admin/finance/overview`

**Expected Result:**
- Total platform revenue
- Pending withdrawals count
- Active campaigns count
- Transaction summaries

#### Test E2: Transaction Monitoring
**Objective:** Test admin transaction monitoring
**Steps:**
1. Get all transactions: `GET /api/admin/finance/transactions`
2. Filter by transaction type
3. Filter by date range

**Expected Result:**
- Paginated transaction list
- Filtering and sorting working
- All transaction details visible

### F. Error Handling Tests

#### Test F1: Insufficient Balance
**Objective:** Test campaign activation with insufficient funds
**Steps:**
1. Brand user with ₹1,000 balance
2. Try to activate campaign with ₹5,000 budget

**Expected Result:**
- Error: "Insufficient wallet balance"
- Campaign remains in draft status

#### Test F2: Invalid Withdrawal Amount
**Objective:** Test withdrawal validation
**Steps:**
1. Streamer with ₹1,000 withdrawable balance
2. Try to withdraw ₹2,000

**Expected Result:**
- Error: "Insufficient withdrawable balance"
- No transaction created

#### Test F3: Unauthorized Access
**Objective:** Test role-based access control
**Steps:**
1. Streamer user tries to access: `GET /api/admin/finance/overview`

**Expected Result:**
- Error: 403 Forbidden
- Access denied message

### G. Integration Tests

#### Test G1: Complete Campaign Flow
**Objective:** End-to-end campaign with earnings
**Steps:**
1. Brand adds ₹10,000 to wallet
2. Creates and activates campaign (₹5,000)
3. Streamer participates and hits milestones
4. Earnings credited with hold period
5. Earnings released after validation
6. Streamer withdraws earnings
7. Admin approves withdrawal

**Expected Result:**
- All balances updated correctly
- Complete audit trail in transactions
- Proper state transitions

#### Test G2: Auto Top-up Simulation
**Objective:** Test auto top-up functionality
**Steps:**
1. Enable auto top-up for brand wallet
2. Set threshold: ₹1,000, top-up: ₹5,000
3. Spend down to ₹500
4. Trigger auto top-up check

**Expected Result:**
- Auto top-up triggered
- Payment intent created automatically
- Wallet topped up to ₹5,500

## API Endpoint Reference

### Wallet Endpoints
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/withdraw` - Create withdrawal request

### Payment Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/upi` - Process UPI payment

### KYC Endpoints
- `GET /api/kyc/status` - Get KYC status
- `POST /api/kyc/submit` - Submit KYC documents

### Admin Endpoints
- `GET /api/admin/finance/overview` - Finance dashboard
- `GET /api/admin/finance/transactions` - All transactions
- `GET /api/admin/finance/withdrawals` - Pending withdrawals
- `PUT /api/admin/finance/withdrawals/{id}` - Approve/reject withdrawal

## Testing Tools

### Postman Collection
Import the provided Postman collection for easy API testing:
- Environment variables for different user tokens
- Pre-configured requests for all endpoints
- Automated test scripts

### Mock Data
Use the provided mock data generators:
- User factory for test accounts
- Campaign factory for test campaigns
- Transaction factory for test data

## Expected Results Summary

### Successful Test Run Should Show:
1. ✅ All wallets created automatically
2. ✅ Payment intents created with mock data
3. ✅ Campaign fund reservations working
4. ✅ Earnings credited with hold periods
5. ✅ Withdrawals processed with admin approval
6. ✅ KYC integration functional
7. ✅ Admin dashboard showing correct data
8. ✅ Error handling for edge cases
9. ✅ Role-based access control working
10. ✅ Complete audit trail maintained

### Common Issues to Check:
- User authentication tokens
- Proper role assignments
- Wallet initialization
- Transaction state consistency
- Error message clarity

## Performance Considerations
- Test with multiple concurrent users
- Check database query performance
- Verify memory usage during heavy operations
- Test webhook handling under load

This test suite covers all major functionality of the payment and earnings system using mock implementations.
