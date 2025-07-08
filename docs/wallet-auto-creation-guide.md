# Wallet Auto-Creation for Existing Users - Implementation Guide

## Overview

This document explains the complete solution for handling existing users who don't have wallets in the Instreamly-Clone platform. The solution includes both **migration** for existing users and **auto-creation** for future access patterns.

## Problem Statement

When implementing the payments & earnings system, we discovered that existing users in the database don't have wallets. This creates issues when:
- Users try to access wallet-related features
- Payment operations are attempted
- Earnings need to be tracked

## Solution Architecture

### 1. Migration Service
**File:** `backend/src/services/wallet-migration.service.ts`

A comprehensive service that:
- Scans all existing users in the database
- Creates wallets for users who don't have one
- Sets appropriate wallet types based on user roles
- Provides verification and reporting

### 2. Auto-Creation Logic
**File:** `backend/src/modules/wallet/wallet.service.ts` (in `getWalletByUserId` method)

The WalletService automatically creates wallets when:
- A user accesses any wallet-related functionality
- No existing wallet is found for the user
- User exists in the database

### 3. Migration Scripts
**Files:** 
- `backend/scripts/migrate-wallets-cjs.js` (CommonJS version)
- `backend/scripts/migrate-wallets-simple.js` (ES modules version)

Standalone scripts to run the migration outside the application context.

## Implementation Details

### Wallet Type Mapping

The system determines wallet types based on user roles:

```typescript
switch (user.role) {
  case 'brand':
    walletType = WalletType.BRAND;        // For advertisers/sponsors
    break;
  case 'streamer':
    walletType = WalletType.STREAMER;     // For content creators
    break;
  case 'admin':
    walletType = WalletType.PLATFORM;     // For platform administrators
    break;
  default:
    walletType = WalletType.STREAMER;     // Safe default
}
```

### Wallet Initialization

New wallets are created with these default values:

```typescript
{
  userId: user._id.toString(),
  walletType: [determined by role],
  balance: 0,
  reservedBalance: 0,
  withdrawableBalance: 0,
  heldBalance: 0,
  totalEarnings: [0 for streamers, undefined for others],
  totalSpent: [0 for brands, undefined for others],
  currency: 'INR',
  isActive: true,
  autoTopupEnabled: false,
  autoTopupThreshold: 0,
  autoTopupAmount: 0
}
```

## Database Current State

### Users (5 total):
1. **admin@gametriggers.com** (admin) → PLATFORM wallet
2. **kyadav.9643@gmail.com** (streamer) → STREAMER wallet  
3. **himanshu.yadav@acme.in** (brand) → BRAND wallet
4. **streammaster@example.com** (streamer) → STREAMER wallet
5. **gamergirl@example.com** (streamer) → STREAMER wallet

### Wallets (5 total):
All users now have corresponding wallets with correct types and zero balances.

## Usage Guide

### Running Migration (One-time)

```bash
# Navigate to backend directory
cd backend

# Run the migration script
node scripts/migrate-wallets-cjs.js
```

**Expected Output:**
```
🚀 Starting Wallet Migration...
✓ Connected to MongoDB
📊 Found 5 users to process...
✓ Wallet already exists for user: [email]
=== Migration Summary ===
Total users processed: 5
Wallets created: 0
Wallets already existed: 5
Errors: 0
✅ Migration successful! All users have wallets.
```

### Auto-Creation in Action

When any wallet-related API endpoint is called:

1. **Frontend calls:** `GET /api/nest/wallet/balance`
2. **WalletService.getWalletByUserId()** is invoked
3. **If wallet doesn't exist:**
   - User is fetched from database
   - Wallet type is determined by role
   - New wallet is created automatically
   - Wallet is returned to the API
4. **If wallet exists:** Returns existing wallet

### API Endpoints That Trigger Auto-Creation

All wallet endpoints automatically trigger wallet creation:

- `GET /api/nest/wallet/balance` - Get wallet balance
- `GET /api/nest/wallet/transactions` - Get transaction history
- `POST /api/nest/wallet/add-funds` - Add funds to wallet
- `POST /api/nest/wallet/reserve-funds` - Reserve campaign funds
- `GET /api/nest/wallet/analytics` - Get wallet analytics

## Testing

### 1. Migration Test

```bash
node scripts/migrate-wallets-cjs.js
```

### 2. Auto-Creation Test

```bash
node scripts/test-auto-wallet.js
```

### 3. API Test

```bash
# Test with existing user
curl -X GET "http://localhost:3000/api/nest/wallet/balance" \
  -H "Authorization: Bearer [user_token]"
```

## Error Handling

### Migration Errors
- **User not found:** Skipped with log
- **Duplicate wallet:** Detected and skipped
- **Database errors:** Logged and counted

### Auto-Creation Errors
- **User not found:** Throws `NotFoundException`
- **Database errors:** Bubble up to API layer
- **Invalid role:** Defaults to STREAMER wallet

## Monitoring & Logging

### Migration Logs
```
✓ Created STREAMER wallet for user: user@example.com (streamer)
✗ Failed to create wallet for user user@example.com: [error message]
```

### Auto-Creation Logs
```
Auto-creating STREAMER wallet for user: user@example.com
```

## Best Practices

### 1. Run Migration First
Always run the migration script before deploying wallet features to production.

### 2. Monitor Auto-Creation
Watch application logs for auto-creation events to ensure smooth operation.

### 3. Backup Before Migration
Create database backup before running migration scripts.

### 4. Test in Staging
Test both migration and auto-creation in staging environment first.

## Future Considerations

### 1. Performance
- Auto-creation adds database operations to first-time wallet access
- Consider pre-creating wallets during user registration

### 2. Scale
- For large user bases, run migration in batches
- Monitor database performance during migration

### 3. Audit Trail
- Consider adding audit logs for wallet creation events
- Track auto-creation metrics for monitoring

## Troubleshooting

### Common Issues

1. **Migration script fails with import errors**
   - Use CommonJS version: `migrate-wallets-cjs.js`
   - Ensure MongoDB connection string is correct

2. **Auto-creation not working**
   - Check user authentication in API calls
   - Verify user exists in database
   - Check application logs for errors

3. **Duplicate wallet errors**
   - Run verification: `scripts/test-auto-wallet.js`
   - Check for orphaned wallets

### Database Queries for Manual Verification

```javascript
// Check users without wallets
const users = await User.find({});
const wallets = await Wallet.find({});
const walletUserIds = new Set(wallets.map(w => w.userId));
const usersWithoutWallets = users.filter(u => !walletUserIds.has(u._id.toString()));

// Check wallet types distribution
await Wallet.aggregate([
  { $group: { _id: "$walletType", count: { $sum: 1 } } }
]);
```

## Conclusion

The wallet auto-creation solution ensures that:
- ✅ All existing users have wallets
- ✅ New users get wallets automatically when needed
- ✅ Correct wallet types are assigned based on user roles
- ✅ System is resilient to edge cases
- ✅ Migration is idempotent and safe to re-run

The implementation handles both the immediate need (existing users) and future scalability (auto-creation for ongoing operations).
