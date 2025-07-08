import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from './wallet.service';
import {
  IWallet,
  TransactionType,
  TransactionStatus,
} from '@schemas/wallet.schema';
import { IUser } from '@schemas/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AdminWalletService {
  private readonly logger = new Logger(AdminWalletService.name);

  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<IWallet>,
    @InjectModel('User') private readonly userModel: Model<IUser>,
    private readonly walletService: WalletService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Admin manually adjusts wallet balance (add or remove funds)
   */
  async adjustWalletBalance(
    userId: string,
    adjustmentAmount: number,
    reason: string,
    adminId: string,
  ): Promise<{ wallet: IWallet; transaction: any }> {
    try {
      this.logger.log(
        `Admin ${adminId} adjusting wallet balance for user ${userId}: ${adjustmentAmount}`,
      );

      // Verify target user exists
      const targetUser = await this.userModel.findById(userId);
      if (!targetUser) {
        throw new NotFoundException(`User not found: ${userId}`);
      }

      // Get user's wallet
      const wallet = await this.walletModel.findOne({ userId });
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user: ${userId}`);
      }

      // Validate adjustment amount
      if (adjustmentAmount === 0) {
        throw new BadRequestException('Adjustment amount cannot be zero');
      }

      // For negative adjustments, ensure sufficient balance
      if (adjustmentAmount < 0 && wallet.balance < Math.abs(adjustmentAmount)) {
        throw new BadRequestException(
          'Insufficient balance for negative adjustment',
        );
      }

      // Perform the adjustment
      const transactionType =
        adjustmentAmount > 0
          ? TransactionType.DEPOSIT
          : TransactionType.WITHDRAWAL;

      const description = `Admin adjustment: ${reason}`;

      // Create transaction record first
      const transaction = await this.walletService.createTransaction({
        walletId: wallet._id.toString(),
        createdBy: adminId,
        transactionType,
        amount: Math.abs(adjustmentAmount),
        description,
        metadata: {
          adminId,
          adminAction: true,
          adjustmentReason: reason,
          oldBalance: wallet.balance,
        },
      });

      // Update wallet balance
      const updatedWallet = await this.walletModel.findByIdAndUpdate(
        wallet._id,
        {
          $inc: {
            balance: adjustmentAmount,
            withdrawableBalance: adjustmentAmount > 0 ? adjustmentAmount : 0,
          },
        },
        { new: true },
      );

      if (!updatedWallet) {
        throw new NotFoundException('Failed to update wallet balance');
      }

      this.logger.log(
        `Successfully adjusted wallet balance for user ${userId}. New balance: ${updatedWallet.balance}`,
      );

      // Emit event for notifications and audit
      this.eventEmitter.emit('admin.wallet.adjusted', {
        adminId,
        userId,
        adjustmentAmount,
        reason,
        oldBalance: wallet.balance,
        newBalance: updatedWallet.balance,
      });

      return { wallet: updatedWallet, transaction };
    } catch (error) {
      this.logger.error(
        `Failed to adjust wallet balance: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin freezes wallet to prevent transactions
   */
  async freezeWallet(
    userId: string,
    reason: string,
    adminId: string,
  ): Promise<IWallet> {
    try {
      this.logger.log(
        `Admin ${adminId} freezing wallet for user ${userId}: ${reason}`,
      );

      // Verify target user exists
      const targetUser = await this.userModel.findById(userId);
      if (!targetUser) {
        throw new NotFoundException(`User not found: ${userId}`);
      }

      // Get and update wallet
      const wallet = await this.walletModel.findOneAndUpdate(
        { userId },
        {
          isFrozen: true,
          frozenAt: new Date(),
          frozenBy: adminId,
          frozenReason: reason,
        },
        { new: true },
      );

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user: ${userId}`);
      }

      this.logger.log(`Successfully froze wallet for user ${userId}`);

      // Emit event for notifications and audit
      this.eventEmitter.emit('admin.wallet.frozen', {
        adminId,
        userId,
        reason,
      });

      return wallet;
    } catch (error) {
      this.logger.error(
        `Failed to freeze wallet: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin unfreezes wallet to restore normal operations
   */
  async unfreezeWallet(userId: string, adminId: string): Promise<IWallet> {
    try {
      this.logger.log(`Admin ${adminId} unfreezing wallet for user ${userId}`);

      // Verify target user exists
      const targetUser = await this.userModel.findById(userId);
      if (!targetUser) {
        throw new NotFoundException(`User not found: ${userId}`);
      }

      // Get and update wallet
      const wallet = await this.walletModel.findOneAndUpdate(
        { userId },
        {
          $unset: {
            isFrozen: '',
            frozenAt: '',
            frozenBy: '',
            frozenReason: '',
          },
        },
        { new: true },
      );

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user: ${userId}`);
      }

      this.logger.log(`Successfully unfroze wallet for user ${userId}`);

      // Emit event for notifications and audit
      this.eventEmitter.emit('admin.wallet.unfrozen', {
        adminId,
        userId,
      });

      return wallet;
    } catch (error) {
      this.logger.error(
        `Failed to unfreeze wallet: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin force processes a withdrawal (override normal rules)
   */
  async forceProcessWithdrawal(
    withdrawalId: string,
    adminId: string,
    reason: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Admin ${adminId} force processing withdrawal ${withdrawalId}: ${reason}`,
      );

      // This would integrate with the withdrawal system once it's fully implemented
      // For now, we'll create a placeholder that can be expanded

      // Find the withdrawal request (assuming we have a withdrawals collection)
      // const withdrawal = await this.withdrawalModel.findById(withdrawalId);

      // Force process the withdrawal
      // Implementation would depend on payment gateway integration

      this.logger.log(`Force withdrawal processing not fully implemented yet`);

      // Emit event for audit
      this.eventEmitter.emit('admin.withdrawal.forced', {
        adminId,
        withdrawalId,
        reason,
      });

      return {
        message: 'Force withdrawal processing - implementation pending',
      };
    } catch (error) {
      this.logger.error(
        `Failed to force process withdrawal: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin gets detailed wallet information for investigation
   */
  async getWalletDetails(userId: string, adminId: string): Promise<any> {
    try {
      this.logger.log(
        `Admin ${adminId} requesting wallet details for user ${userId}`,
      );

      const wallet = await this.walletModel.findOne({ userId });
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user: ${userId}`);
      }

      // Get recent transactions
      const recentTransactions = await this.walletService.getTransactionHistory(
        userId,
        20, // limit
        0, // offset
      );

      // Get user info
      const user = await this.userModel
        .findById(userId)
        .select('name email role');

      return {
        wallet,
        user,
        recentTransactions,
        investigationTimestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get wallet details: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
