# Migration Scripts Usage Guide

This document explains how to use the migration scripts added to package.json for the Eureka RBAC system.

## Available Scripts

### User Role Migration

#### 1. Dry Run Migration (Recommended First Step)
```bash
npm run migrate:users:dry-run
```
- **Purpose**: Test the migration without making any database changes
- **Output**: Shows what would be migrated and statistics
- **Safe**: No actual changes are made to the database

#### 2. Full Migration
```bash
npm run migrate:users
```
- **Purpose**: Execute the actual user role migration
- **Action**: Migrates all users from legacy roles to Eureka RBAC system
- **Warning**: Makes permanent changes to the database

#### 3. Custom Migration with Options
```bash
npm run migrate:users -- --verbose --batch-size=50
```
- **Options**:
  - `--verbose`: Detailed logging for each user migration
  - `--batch-size=N`: Process users in batches of N (default: 100)
  - `--dry-run`: Test mode without changes

#### 4. Rollback Migration
```bash
npm run migrate:users:rollback
```
- **Purpose**: Revert the migration back to legacy roles
- **Use Case**: If issues are discovered after migration
- **Action**: Restores original role system

### Database Schema Updates

#### 5. Update Database Schema
```bash
npm run db:update-schema
```
- **Purpose**: Add required indexes and schema updates for Eureka RBAC
- **Action**: Creates necessary database indexes for performance
- **Requirement**: Should be run before user migration

### Validation and Testing

#### 6. Test Migration System
```bash
npm run test:migration
```
- **Purpose**: Run comprehensive tests on the migration system
- **Coverage**: Tests migration scripts, validation, and system integration
- **Use**: Validate system health before production deployment

#### 7. Validate Role System
```bash
npm run validate:roles
```
- **Purpose**: Validate role configurations and permission mappings
- **Use**: Ensure role system integrity and consistency

## Migration Workflow (Recommended Order)

### 1. Pre-Migration Setup
```bash
# Install dependencies (if not already done)
npm install

# Build TypeScript schemas to JavaScript (REQUIRED)
npm run build:schemas

# Test script configuration
npm run test:scripts

# Update database schema
npm run db:update-schema
```

### 2. Testing Phase
```bash
# Test the migration system
npm run test:migration

# Run a dry-run to see what would be migrated
npm run migrate:users:dry-run

# Validate role configurations
npm run validate:roles
```

### 3. Production Migration
```bash
# Create database backup (recommended)
# mongodump --uri="your-mongodb-connection-string" --out=backup-pre-eureka

# Execute the actual migration
npm run migrate:users -- --verbose

# Verify migration results
npm run test:migration
```

### 4. Post-Migration (if needed)
```bash
# If issues arise, rollback the migration
npm run migrate:users:rollback

# Restore from backup if necessary
# mongorestore --uri="your-mongodb-connection-string" backup-pre-eureka/
```

## Script Examples

### Example 1: Safe Testing
```bash
# Test everything without making changes
npm run migrate:users:dry-run
npm run test:migration
npm run validate:roles
```

### Example 2: Production Migration
```bash
# Full migration with detailed logging
npm run migrate:users -- --verbose --batch-size=100
```

### Example 3: Custom Batch Processing
```bash
# Process users in smaller batches for large databases
npm run migrate:users -- --batch-size=50 --verbose
```

### Example 4: Emergency Rollback
```bash
# Quickly revert to legacy system
npm run migrate:users:rollback
```

## Output Examples

### Dry Run Output
```
🚀 Starting User Role Migration...
📊 Configuration: {
  "dryRun": true,
  "verbose": true,
  "batchSize": 100
}
✅ Connected to MongoDB
👥 Found 250 users to process
📦 Processing batch 1/3
🔄 Migrating user 507f1f77bcf86cd799439011: admin -> admin_exchange (ADMIN)
🔄 Migrating user 507f1f77bcf86cd799439012: brand -> campaign_manager (BRAND)
...
🔍 DRY RUN MODE - No changes were made to the database
📈 Role Distribution:
  admin_exchange: 15 users (ADMIN portal)
  campaign_manager: 89 users (BRAND portal)
  streamer_individual: 146 users (PUBLISHER portal)
```

### Migration Output
```
🚀 Starting User Role Migration...
✅ Connected to MongoDB
👥 Found 250 users to process
📦 Processing batch 1/3
...
📊 MIGRATION RESULTS
==================================================
Total Users: 250
Migrated: 245
Skipped: 5
Errors: 0
📈 Role Distribution:
  admin_exchange: 15 users (ADMIN portal)
  campaign_manager: 89 users (BRAND portal)
  streamer_individual: 146 users (PUBLISHER portal)
==================================================
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Ensure ts-node is installed: `npm install ts-node --save-dev`
   - Check TypeScript configuration in tsconfig.json

2. **Database Connection Issues**
   - Verify MONGODB_URI environment variable
   - Ensure MongoDB is running and accessible

3. **Migration Failures**
   - Check error logs for specific user issues
   - Use --verbose flag for detailed debugging
   - Consider smaller batch sizes for large databases

4. **Permission Issues**
   - Ensure database user has read/write permissions
   - Check MongoDB connection string permissions

### Getting Help

For issues with migration scripts:
1. Check the error logs and output messages
2. Run with --verbose flag for detailed information
3. Test with --dry-run first to identify issues
4. Verify database connectivity and permissions

## Safety Notes

- ⚠️ **Always backup your database before running migrations**
- ✅ **Always run dry-run tests first**
- 🔍 **Monitor migration progress and logs**
- 🔄 **Have rollback plan ready**
- 📊 **Validate results after migration**

The migration scripts are designed to be safe and recoverable, but proper testing and backup procedures are essential for production deployments.
