# Database Name Change: instreamly → gametriggers

This document outlines the changes made to update the database name from "instreamly" to "gametriggers".

## Files Updated

### Configuration Files
- `.env.example` - Updated default MongoDB URI

### Migration Scripts
- `scripts/verify-currency-migration.js`
- `scripts/migration-remove-traditional-impressions.js`
- `scripts/migrate-currency-usd-to-inr.js`

### Backend Scripts
- `backend/scripts/migrate-wallets-simple.js`
- `backend/scripts/migrate-wallets.js`
- `backend/scripts/test-auto-wallet.js`
- `backend/scripts/migrate-wallets-cjs.js`
- `backend/scripts/check-auth-tokens.js`
- `backend/src/scripts/create-super-admin.ts`

### Documentation
- `docs/currency-migration-guide.md`

## What You Need to Do

### 1. Update Your Environment File
If you have a `.env` or `.env.local` file, update the MongoDB URI:

```bash
# Old
MONGODB_URI=mongodb://localhost:27017/instreamly

# New
MONGODB_URI=mongodb://localhost:27017/gametriggers
```

### 2. If You Have Existing Data
If you already have data in the "instreamly" database and want to migrate it to "gametriggers":

#### Option A: Rename the Database (Recommended)
```bash
# Connect to MongoDB shell
mongosh

# Switch to admin database
use admin

# Copy the database
db.runCommand({
  copydb: 1,
  fromdb: "instreamly",
  todb: "gametriggers"
})

# Drop the old database (optional)
use instreamly
db.dropDatabase()
```

#### Option B: Export/Import Data
```bash
# Export existing data
mongodump --uri="mongodb://localhost:27017/instreamly" --out="./backup-migration"

# Import to new database
mongorestore --uri="mongodb://localhost:27017/gametriggers" --drop ./backup-migration/instreamly/
```

### 3. Restart Your Application
After updating your environment file:

```bash
npm run dev:unified
```

## Notes
- All hardcoded database references have been updated
- Your existing MongoDB connection configuration in `backend/src/app.module.ts` will automatically use the new database name from the environment variable
- No code changes are needed beyond updating the environment file
