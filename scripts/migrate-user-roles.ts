#!/usr/bin/env ts-node

/**
 * User Role Migration Script
 * 
 * This script migrates existing users from legacy roles (admin, brand, streamer)
 * to the new Eureka RBAC system with proper portal assignments and permissions.
 */

import { connect, disconnect } from 'mongoose';
import { EurekaRole, RoleManager } from '../schemas/lib/eureka-roles.js';
import { User } from '../schemas/schemas/user.schema.js';

// Migration configuration
interface MigrationConfig {
  dryRun: boolean;
  verbose: boolean;
  batchSize: number;
}

interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  skippedUsers: number;
  errors: Array<{ userId: string; error: string }>;
  roleDistribution: Record<EurekaRole, number>;
}

class UserRoleMigration {
  private config: MigrationConfig;
  private result: MigrationResult;

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      dryRun: false,
      verbose: false,
      batchSize: 100,
      ...config
    };

    this.result = {
      totalUsers: 0,
      migratedUsers: 0,
      skippedUsers: 0,
      errors: [],
      roleDistribution: {} as Record<EurekaRole, number>
    };
  }

  /**
   * Connect to MongoDB
   */
  private async connectToDatabase(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
    
    try {
      await connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  /**
   * Map legacy role to new Eureka role with contextual logic
   */
  private mapLegacyToEurekaRole(legacyRole: string): EurekaRole {
    const role = legacyRole.toLowerCase().trim();
    
    switch (role) {
      case 'admin':
        // Default admin users to Admin Exchange role
        return EurekaRole.ADMIN_EXCHANGE;
        
      case 'brand':
        // Default brand users to Campaign Manager role
        // In production, you might want to check user permissions/context
        return EurekaRole.CAMPAIGN_MANAGER;
        
      case 'streamer':
        // Default streamers to Individual Streamer role
        return EurekaRole.STREAMER_INDIVIDUAL;
        
      default:
        console.warn(`⚠️  Unknown legacy role: ${legacyRole}, defaulting to STREAMER_INDIVIDUAL`);
        return EurekaRole.STREAMER_INDIVIDUAL;
    }
  }

  /**
   * Migrate a batch of users
   */
  private async migrateBatch(users: Array<{ _id: unknown; role?: string; eurekaRole?: string; [key: string]: unknown }>): Promise<void> {
    for (const user of users) {
      try {
        // Skip if user already has Eureka role
        if (user.eurekaRole) {
          this.result.skippedUsers++;
          if (this.config.verbose) {
            console.log(`⏭️  Skipping user ${user._id}: Already has Eureka role ${user.eurekaRole}`);
          }
          continue;
        }

        // Map legacy role to Eureka role
        const legacyRole = user.role || 'streamer'; // Default to streamer if no role
        const eurekaRole = this.mapLegacyToEurekaRole(legacyRole);
        const portal = RoleManager.getPortal(eurekaRole);

        if (this.config.verbose) {
          console.log(`🔄 Migrating user ${user._id}: ${legacyRole} -> ${eurekaRole} (${portal})`);
        }

        // Prepare update data
        const updateData = {
          eurekaRole,
          portal,
          migrationDate: new Date(),
          // Keep legacy role for backward compatibility during transition
          legacyRole: user.role
        };

        if (!this.config.dryRun) {
          // Update the user document
          if (User) {
            await User.findByIdAndUpdate(user._id, updateData);
          }
        }

        // Track statistics
        this.result.migratedUsers++;
        this.result.roleDistribution[eurekaRole] = 
          (this.result.roleDistribution[eurekaRole] || 0) + 1;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.result.errors.push({
          userId: String(user._id),
          error: errorMessage
        });
        
        console.error(`❌ Error migrating user ${user._id}:`, errorMessage);
      }
    }
  }

  /**
   * Run the migration process
   */
  public async migrate(): Promise<MigrationResult> {
    console.log('🚀 Starting User Role Migration...');
    console.log(`📊 Configuration: ${JSON.stringify(this.config, null, 2)}`);

    await this.connectToDatabase();

    try {
      // Get total user count
      if (!User) {
        throw new Error('User model is not available');
      }
      
      this.result.totalUsers = await User.countDocuments();
      console.log(`👥 Found ${this.result.totalUsers} users to process`);

      if (this.result.totalUsers === 0) {
        console.log('ℹ️  No users found to migrate');
        return this.result;
      }

      // Process users in batches
      let skip = 0;
      const { batchSize } = this.config;

      while (skip < this.result.totalUsers) {
        const users = await User.find({})
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (users.length === 0) break;

        console.log(`📦 Processing batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(this.result.totalUsers / batchSize)}`);
        
        await this.migrateBatch(users);
        
        skip += batchSize;
      }

      // Print final results
      this.printResults();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }

    return this.result;
  }

  /**
   * Print migration results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Users: ${this.result.totalUsers}`);
    console.log(`Migrated: ${this.result.migratedUsers}`);
    console.log(`Skipped: ${this.result.skippedUsers}`);
    console.log(`Errors: ${this.result.errors.length}`);
    
    if (this.config.dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes were made to the database');
    }

    console.log('\n📈 Role Distribution:');
    Object.entries(this.result.roleDistribution).forEach(([role, count]) => {
      const portal = RoleManager.getPortal(role as EurekaRole);
      console.log(`  ${role}: ${count} users (${portal} portal)`);
    });

    if (this.result.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.result.errors.forEach(({ userId, error }) => {
        console.log(`  User ${userId}: ${error}`);
      });
    }

    console.log('='.repeat(50));
  }

  /**
   * Rollback migration (restore legacy roles)
   */
  public async rollback(): Promise<void> {
    console.log('🔄 Starting migration rollback...');
    
    await this.connectToDatabase();

    try {
      if (!User) {
        throw new Error('User model is not available');
      }
      
      const result = await User.updateMany(
        { 
          migrationDate: { $exists: true },
          legacyRole: { $exists: true }
        },
        {
          $unset: { 
            eurekaRole: 1,
            portal: 1,
            migrationDate: 1 
          },
          $rename: { legacyRole: 'role' }
        }
      );

      console.log(`✅ Rollback completed: ${result.modifiedCount} users restored`);
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    } finally {
      await disconnect();
    }
  }
}

// CLI execution
// Check if this script is being run directly
if (import.meta.url.startsWith('file:') && process.argv[1]?.endsWith('migrate-user-roles.ts')) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const rollback = args.includes('--rollback');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100');

  const migration = new UserRoleMigration({
    dryRun,
    verbose,
    batchSize
  });

  if (rollback) {
    migration.rollback()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    migration.migrate()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export type { MigrationConfig, MigrationResult };
export { UserRoleMigration };
