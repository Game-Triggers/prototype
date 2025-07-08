# Currency Migration Guide: USD to INR

## Overview
This guide helps you migrate all monetary values in the Instreamly database from USD to INR using the exchange rate of 1 USD = 83 INR.

## Pre-Migration Checklist

### 1. Backup Database
```bash
# Create a backup before running migration
mongodump --uri="mongodb://localhost:27017/gametriggers" --out="./backup-$(date +%Y%m%d-%H%M%S)"
```

### 2. Stop Application
Stop the Instreamly application to prevent data inconsistency during migration:
```bash
# Stop the development server
npm run stop
# Or kill the process if running
taskkill /f /im node.exe
```

### 3. Set Environment Variables
Ensure your MongoDB connection string is set:
```bash
# Windows
set MONGODB_URI=mongodb://localhost:27017/gametriggers

# Linux/Mac
export MONGODB_URI=mongodb://localhost:27017/gametriggers
```

## Running the Migration

### Step 1: Run the Migration Script
```bash
cd scripts
node migrate-currency-usd-to-inr.js
```

### Step 2: Verify the Migration
```bash
node verify-currency-migration.js
```

## What the Migration Does

### Collections Updated:
1. **campaigns** - Converts `budget`, `remainingBudget`, `paymentRate`
2. **campaignparticipations** - Converts `estimatedEarnings`
3. **wallets** - Converts all balance fields and sets `currency: 'INR'`
4. **transactions** - Converts `amount` and sets `currency: 'INR'`

### Exchange Rate Applied:
- **1 USD = 83 INR** (as configured in currency-config.ts)
- All monetary values are multiplied by 83

## Expected Results

### Before Migration (USD):
- Campaign budget: $1,000
- CPM rate: $20
- Wallet balance: $100
- Transaction amount: $50

### After Migration (INR):
- Campaign budget: ₹83,000
- CPM rate: ₹1,660
- Wallet balance: ₹8,300
- Transaction amount: ₹4,150

## Verification Steps

### 1. Check Migration Report
The script creates a migration report in the `migration_reports` collection.

### 2. Sample Data Verification
```javascript
// Check a few campaigns
db.campaigns.find().limit(3).pretty()

// Check wallet currencies
db.wallets.find({}, {currency: 1, balance: 1}).limit(5).pretty()

// Check transaction currencies
db.transactions.find({}, {currency: 1, amount: 1}).limit(5).pretty()
```

### 3. Application Testing
1. Start the application: `npm run dev:unified`
2. Create a new campaign - should show INR defaults (₹1,000 budget)
3. Check dashboard - all amounts should display in INR
4. Verify analytics show proper INR formatting

## Rollback Plan

If you need to rollback:

### 1. Restore from Backup
```bash
# Stop application first
mongorestore --uri="mongodb://localhost:27017/gametriggers" --drop ./backup-YYYYMMDD-HHMMSS/
```

### 2. Alternative: Use Rollback Script
A rollback script is automatically generated during migration:
```bash
node rollback-currency-migration.js
```

## Post-Migration Tasks

### 1. Update Application Configuration
Ensure your `.env` file has:
```
NEXT_PUBLIC_PLATFORM_CURRENCY=INR
```

### 2. Test Critical Flows
- [ ] Campaign creation
- [ ] Payment processing
- [ ] Earnings calculation
- [ ] Analytics display
- [ ] Wallet operations

### 3. Monitor Application
- Check logs for any currency-related errors
- Verify all amounts display correctly in UI
- Test payment flows end-to-end

## Troubleshooting

### Common Issues:

1. **"Cannot connect to MongoDB"**
   - Check MongoDB is running: `mongod --version`
   - Verify connection string in MONGODB_URI

2. **"Some values seem low for INR"**
   - Check if migration ran completely
   - Verify exchange rate is 83.0
   - Run verification script again

3. **"Application shows mixed currencies"**
   - Clear browser cache
   - Restart application
   - Check environment variables

### Getting Help:
- Review migration logs in console output
- Check the migration_reports collection for details
- Verify database backup is available for rollback

## Summary

This migration converts all USD monetary values to INR using a 83:1 exchange rate. The process is designed to be safe with comprehensive verification and rollback options. Always test on a staging environment first and ensure you have a reliable backup before running in production.
