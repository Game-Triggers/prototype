/**
 * Migration script to create wallets for existing users
 * Run this script to ensure all existing users have wallets
 */

import { Model } from 'mongoose';
import { IUser } from '@schemas/user.schema';
import { IWallet, WalletType } from '@schemas/wallet.schema';

export interface MigrationResult {
  totalUsers: number;
  walletsCreated: number;
  walletsExisted: number;
  errors: Array<{ userId: string; error: string }>;
}

export class WalletMigrationService {
  constructor(
    private readonly userModel: Model<IUser>,
    private readonly walletModel: Model<IWallet>,
  ) {}

  /**
   * Create wallets for all existing users who don't have one
   */
  async migrateUserWallets(): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalUsers: 0,
      walletsCreated: 0,
      walletsExisted: 0,
      errors: [],
    };

    try {
      // Get all users
      const users = await this.userModel.find({}).lean();
      result.totalUsers = users.length;

      console.log(`Found ${users.length} users to process...`);

      for (const user of users) {
        try {
          // Check if wallet already exists
          const existingWallet = await this.walletModel.findOne({
            userId: user._id.toString(),
          });

          if (existingWallet) {
            result.walletsExisted++;
            console.log(`✓ Wallet already exists for user: ${user.email}`);
            continue;
          }

          // Determine wallet type based on user role
          let walletType: WalletType;
          switch (user.role) {
            case 'brand':
              walletType = WalletType.BRAND;
              break;
            case 'streamer':
              walletType = WalletType.STREAMER;
              break;
            case 'admin':
              walletType = WalletType.PLATFORM;
              break;
            default:
              walletType = WalletType.STREAMER; // Default fallback
          }

          // Create wallet
          const wallet = new this.walletModel({
            userId: user._id.toString(),
            walletType,
            balance: 0,
            reservedBalance: 0,
            withdrawableBalance: 0,
            heldBalance: 0,
            totalEarnings: walletType === WalletType.STREAMER ? 0 : undefined,
            totalSpent: walletType === WalletType.BRAND ? 0 : undefined,
            currency: 'INR',
            isActive: true,
            autoTopupEnabled: false,
            autoTopupThreshold: 0,
            autoTopupAmount: 0,
          });

          await wallet.save();
          result.walletsCreated++;

          console.log(`✓ Created ${walletType} wallet for user: ${user.email}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({
            userId: user._id.toString(),
            error: errorMessage,
          });
          console.error(
            `✗ Failed to create wallet for user ${user.email}: ${errorMessage}`,
          );
        }
      }

      console.log('\n=== Migration Summary ===');
      console.log(`Total users processed: ${result.totalUsers}`);
      console.log(`Wallets created: ${result.walletsCreated}`);
      console.log(`Wallets already existed: ${result.walletsExisted}`);
      console.log(`Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors encountered:');
        result.errors.forEach((error, index) => {
          console.log(`${index + 1}. User ${error.userId}: ${error.error}`);
        });
      }
    } catch (error) {
      console.error('Fatal migration error:', error);
      throw error;
    }

    return result;
  }

  /**
   * Verify all users have wallets
   */
  async verifyUserWallets(): Promise<boolean> {
    try {
      const userCount = await this.userModel.countDocuments();
      const walletCount = await this.walletModel.countDocuments();

      console.log(`Users: ${userCount}, Wallets: ${walletCount}`);

      if (userCount === walletCount) {
        console.log('✓ All users have wallets');
        return true;
      } else {
        console.log(
          `✗ Missing wallets: ${userCount - walletCount} users don't have wallets`,
        );
        return false;
      }
    } catch (error) {
      console.error('Error verifying wallets:', error);
      return false;
    }
  }

  /**
   * Get users without wallets
   */
  async getUsersWithoutWallets(): Promise<IUser[]> {
    try {
      // Get all user IDs
      const users = await this.userModel.find({}, '_id email role').lean();

      // Get all wallet user IDs
      const wallets = await this.walletModel.find({}, 'userId').lean();
      const walletUserIds = new Set(wallets.map((w) => w.userId));

      // Find users without wallets
      const usersWithoutWallets = users.filter(
        (user) => !walletUserIds.has(user._id.toString()),
      );

      return usersWithoutWallets;
    } catch (error) {
      console.error('Error finding users without wallets:', error);
      return [];
    }
  }
}
