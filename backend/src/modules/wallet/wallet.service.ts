import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IWallet,
  ITransaction,
  WalletType,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from '@schemas/wallet.schema';
import { IKYC, KYCStatus } from '@schemas/kyc.schema';
import { IUser } from '@schemas/user.schema';

export interface CreateTransactionDto {
  walletId: string;
  transactionType: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  campaignId?: string;
  description: string;
  metadata?: Record<string, string | number | boolean | Date | undefined>;
  createdBy: string;
  expiresAt?: Date;
}

export interface WalletBalance {
  balance: number;
  reservedBalance: number;
  withdrawableBalance: number;
  totalEarnings?: number;
  totalSpent?: number;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<IWallet>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<ITransaction>,
    @InjectModel('KYC') private readonly kycModel: Model<IKYC>,
    @InjectModel('User') private readonly userModel: Model<IUser>,
  ) {}

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId: string, walletType: WalletType) {
    const existingWallet = await this.walletModel.findOne({ userId });
    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    const wallet = new this.walletModel({
      userId,
      walletType,
      balance: 0,
      reservedBalance: 0,
      withdrawableBalance: 0,
      totalEarnings: walletType === WalletType.STREAMER ? 0 : undefined,
      totalSpent: walletType === WalletType.BRAND ? 0 : undefined,
      currency: 'INR',
      isActive: true,
    });

    return await wallet.save();
  }

  /**
   * Get wallet by user ID - creates wallet if it doesn't exist
   */
  async getWalletByUserId(userId: string) {
    let wallet = await this.walletModel.findOne({ userId, isActive: true });

    if (!wallet) {
      // Check if user exists to determine wallet type
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
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

      // Auto-create wallet for existing user
      console.log(`Auto-creating ${walletType} wallet for user: ${user.email}`);
      wallet = await this.createWallet(userId, walletType);
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<WalletBalance> {
    const wallet = await this.getWalletByUserId(userId);
    return {
      balance: wallet.balance,
      reservedBalance: wallet.reservedBalance,
      withdrawableBalance: wallet.withdrawableBalance,
      totalEarnings: wallet.totalEarnings,
      totalSpent: wallet.totalSpent,
    };
  }

  /**
   * Add funds to brand wallet (deposit)
   */
  async addFunds(
    userId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    paymentGatewayTxnId: string,
    createdBy: string,
  ): Promise<ITransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.getWalletByUserId(userId);

    if (wallet.walletType !== WalletType.BRAND) {
      throw new BadRequestException('Only brands can add funds');
    }

    return await this.createTransaction({
      walletId: wallet._id,
      transactionType: TransactionType.DEPOSIT,
      amount,
      paymentMethod,
      description: `Wallet deposit via ${paymentMethod}`,
      metadata: { paymentGatewayTxnId },
      createdBy,
    });
  }

  /**
   * Reserve funds for campaign (when campaign is activated)
   */
  async reserveCampaignFunds(
    userId: string,
    campaignId: string,
    amount: number,
    createdBy: string,
  ): Promise<ITransaction> {
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.walletType !== WalletType.BRAND) {
      throw new BadRequestException('Only brands can reserve campaign funds');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return await this.createTransaction({
      walletId: wallet._id,
      transactionType: TransactionType.CAMPAIGN_RESERVE,
      amount: -amount, // Negative to move from balance to reserved
      campaignId,
      description: `Campaign budget reserved`,
      metadata: { campaignId },
      createdBy,
    });
  }

  /**
   * Charge campaign funds (progressive billing based on milestones)
   */
  async chargeCampaignFunds(
    userId: string,
    campaignId: string,
    amount: number,
    milestoneType: string,
    createdBy: string,
  ): Promise<ITransaction> {
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.reservedBalance < amount) {
      throw new BadRequestException(
        'Insufficient reserved balance for this charge',
      );
    }

    return await this.createTransaction({
      walletId: wallet._id,
      transactionType: TransactionType.CAMPAIGN_CHARGE,
      amount: -amount, // Negative to deduct from reserved balance
      campaignId,
      description: `Campaign charge for ${milestoneType}`,
      metadata: { campaignId, milestoneType },
      createdBy,
    });
  }

  /**
   * Credit earnings to streamer wallet (with hold period)
   */
  async creditEarnings(
    userId: string,
    campaignId: string,
    amount: number,
    holdDays: number = 3,
    createdBy: string,
  ): Promise<ITransaction> {
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.walletType !== WalletType.STREAMER) {
      throw new BadRequestException('Only streamers can receive earnings');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + holdDays);

    // First create earnings hold transaction
    const holdTransaction = await this.createTransaction({
      walletId: wallet._id,
      transactionType: TransactionType.EARNINGS_HOLD,
      amount,
      campaignId,
      description: `Earnings hold for campaign completion`,
      metadata: { campaignId, holdPeriodDays: holdDays },
      createdBy,
      expiresAt,
    });

    return holdTransaction;
  }

  /**
   * Release earnings from hold after validation
   */
  async releaseEarnings(
    transactionId: string,
    createdBy: string,
  ): Promise<ITransaction> {
    const holdTransaction = await this.transactionModel.findById(transactionId);

    if (
      !holdTransaction ||
      holdTransaction.transactionType !== TransactionType.EARNINGS_HOLD
    ) {
      throw new NotFoundException('Hold transaction not found');
    }

    if (holdTransaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Hold transaction is not in completed status',
      );
    }

    return await this.createTransaction({
      walletId: holdTransaction.walletId,
      transactionType: TransactionType.EARNINGS_RELEASE,
      amount: holdTransaction.amount,
      campaignId: holdTransaction.campaignId,
      description: `Earnings released after validation`,
      metadata: {
        originalHoldTransactionId: transactionId,
        campaignId: holdTransaction.campaignId,
      },
      createdBy,
    });
  }

  /**
   * Request withdrawal (for streamers)
   */
  async requestWithdrawal(
    userId: string,
    amount: number,
    createdBy: string,
  ): Promise<ITransaction> {
    const wallet = await this.getWalletByUserId(userId);
    const kyc = await this.kycModel.findOne({ userId });

    if (wallet.walletType !== WalletType.STREAMER) {
      throw new BadRequestException('Only streamers can request withdrawals');
    }

    if (!kyc || kyc.status !== KYCStatus.APPROVED) {
      throw new BadRequestException(
        'KYC verification required for withdrawals',
      );
    }

    if (wallet.withdrawableBalance < amount) {
      throw new BadRequestException('Insufficient withdrawable balance');
    }

    if (amount < kyc.withdrawalSettings.minimumAmount) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₹${kyc.withdrawalSettings.minimumAmount}`,
      );
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWithdrawals = await this.transactionModel.aggregate([
      {
        $match: {
          walletId: wallet._id,
          transactionType: TransactionType.WITHDRAWAL,
          status: {
            $in: [TransactionStatus.COMPLETED, TransactionStatus.PROCESSING],
          },
          createdAt: { $gte: today },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const todayTotal = todayWithdrawals[0]?.total || 0;
    if (todayTotal + amount > kyc.withdrawalSettings.maximumDailyAmount) {
      throw new BadRequestException(
        `Daily withdrawal limit of ₹${kyc.withdrawalSettings.maximumDailyAmount} exceeded`,
      );
    }

    return await this.createTransaction({
      walletId: wallet._id,
      transactionType: TransactionType.WITHDRAWAL,
      amount: -amount, // Negative to deduct from withdrawable balance
      description: `Withdrawal request to ${kyc.bankDetails.bankName}`,
      metadata: {
        bankAccount: kyc.bankDetails.accountNumber,
        ifscCode: kyc.bankDetails.ifscCode,
        accountHolderName: kyc.bankDetails.accountHolderName,
      },
      createdBy,
    });
  }

  /**
   * Create a transaction and update wallet balances (public for webhook usage)
   */
  async createTransaction(dto: CreateTransactionDto): Promise<ITransaction> {
    const wallet = await this.walletModel.findById(dto.walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Calculate new balances based on transaction type
    let newBalance = wallet.balance;
    let newReservedBalance = wallet.reservedBalance;
    let newWithdrawableBalance = wallet.withdrawableBalance;
    let newTotalEarnings = wallet.totalEarnings || 0;
    let newTotalSpent = wallet.totalSpent || 0;

    switch (dto.transactionType) {
      case TransactionType.DEPOSIT:
        newBalance += dto.amount;
        if (wallet.walletType === WalletType.BRAND) {
          newTotalSpent += dto.amount;
        }
        break;

      case TransactionType.CAMPAIGN_RESERVE:
        newBalance += dto.amount; // amount is negative
        newReservedBalance -= dto.amount; // subtract negative = add
        break;

      case TransactionType.CAMPAIGN_CHARGE:
        newReservedBalance += dto.amount; // amount is negative
        break;

      case TransactionType.EARNINGS_HOLD:
        // Earnings go to balance but not withdrawable yet
        newBalance += dto.amount;
        newTotalEarnings += dto.amount;
        break;

      case TransactionType.EARNINGS_RELEASE:
        // Move from balance to withdrawable
        newWithdrawableBalance += dto.amount;
        break;

      case TransactionType.WITHDRAWAL:
        newWithdrawableBalance += dto.amount; // amount is negative
        break;

      default:
        throw new BadRequestException(
          `Unsupported transaction type: ${dto.transactionType}`,
        );
    }

    // Create transaction record
    const transaction = new this.transactionModel({
      walletId: dto.walletId,
      userId: wallet.userId,
      transactionType: dto.transactionType,
      amount: dto.amount,
      currency: wallet.currency,
      status: TransactionStatus.COMPLETED,
      paymentMethod: dto.paymentMethod,
      campaignId: dto.campaignId,
      description: dto.description,
      metadata: dto.metadata,
      balanceAfter: newBalance,
      reservedBalanceAfter: newReservedBalance,
      withdrawableBalanceAfter: newWithdrawableBalance,
      processedAt: new Date(),
      expiresAt: dto.expiresAt,
      createdBy: dto.createdBy,
    });

    // Update wallet balances
    wallet.balance = newBalance;
    wallet.reservedBalance = newReservedBalance;
    wallet.withdrawableBalance = newWithdrawableBalance;
    wallet.totalEarnings = newTotalEarnings;
    wallet.totalSpent = newTotalSpent;

    // Save both in a transaction-like manner
    await Promise.all([transaction.save(), wallet.save()]);

    return transaction;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    transactionType?: TransactionType,
  ) {
    const wallet = await this.getWalletByUserId(userId);

    const filter: Record<string, unknown> = { walletId: wallet._id };
    if (transactionType) {
      filter.transactionType = transactionType;
    }

    const transactions = await this.transactionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('campaignId', 'title')
      .lean();

    const totalCount = await this.transactionModel.countDocuments(filter);

    return {
      transactions,
      totalCount,
      hasMore: offset + transactions.length < totalCount,
    };
  }

  /**
   * Get wallet analytics
   */
  async getWalletAnalytics(userId: string, days: number = 30) {
    const wallet = await this.getWalletByUserId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.transactionModel.aggregate([
      {
        $match: {
          walletId: wallet._id,
          createdAt: { $gte: startDate },
          status: TransactionStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$transactionType',
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    return analytics;
  }

  /**
   * Check if auto top-up should be triggered
   */
  async checkAutoTopup(userId: string): Promise<boolean> {
    const wallet = await this.getWalletByUserId(userId);

    return (
      Boolean(wallet.autoTopupEnabled) &&
      wallet.balance <= (wallet.autoTopupThreshold || 0) &&
      wallet.walletType === WalletType.BRAND
    );
  }

  /**
   * Get reserved funds for a specific campaign
   */
  async getReservedFunds(userId: string, campaignId: string): Promise<number> {
    const wallet = await this.getWalletByUserId(userId);

    const reservedTransactions = await this.transactionModel.find({
      walletId: wallet._id,
      transactionType: TransactionType.CAMPAIGN_RESERVE,
      campaignId: campaignId,
      status: TransactionStatus.PENDING,
    });

    return reservedTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );
  }

  /**
   * Release reserved funds back to available balance
   */
  async releaseReservedFunds(
    userId: string,
    campaignId: string,
    amount: number,
  ): Promise<ITransaction> {
    const wallet = await this.getWalletByUserId(userId);

    // Verify there are enough reserved funds
    const reservedAmount = await this.getReservedFunds(userId, campaignId);
    if (reservedAmount < amount) {
      throw new BadRequestException('Insufficient reserved funds to release');
    }

    // Mark reserved transaction as completed
    await this.transactionModel.updateMany(
      {
        walletId: wallet._id,
        transactionType: TransactionType.CAMPAIGN_RESERVE,
        campaignId: campaignId,
        status: TransactionStatus.PENDING,
      },
      {
        status: TransactionStatus.COMPLETED,
      },
    );

    // Create release transaction
    const transaction = await this.createTransaction({
      walletId: wallet._id.toString(),
      transactionType: TransactionType.CAMPAIGN_REFUND,
      amount,
      campaignId,
      description: `Released reserved funds for campaign ${campaignId}`,
      metadata: { type: 'campaign_funds_release' },
      createdBy: userId,
    });

    // Update wallet balances
    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: {
        balance: amount,
        reservedBalance: -amount,
      },
    });

    return transaction;
  }

  /**
   * Release earnings from hold period - overloaded method for campaign-specific release
   */
  async releaseEarningsForCampaign(
    userId: string,
    campaignId?: string,
  ): Promise<void> {
    const wallet = await this.getWalletByUserId(userId);

    // Find held earnings that are ready to be released (past hold period)
    const query: any = {
      walletId: wallet._id,
      transactionType: TransactionType.EARNINGS_HOLD,
      status: TransactionStatus.PENDING,
      expiresAt: { $lte: new Date() },
    };

    if (campaignId) {
      query.campaignId = campaignId;
    }

    const heldEarnings = await this.transactionModel.find(query);

    if (heldEarnings.length === 0) {
      return;
    }

    const totalAmount = heldEarnings.reduce(
      (sum, earning) => sum + earning.amount,
      0,
    );

    // Update transactions to released status
    await this.transactionModel.updateMany(
      { _id: { $in: heldEarnings.map((e) => e._id) } },
      { status: TransactionStatus.COMPLETED },
    );

    // Update wallet balance
    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: {
        withdrawableBalance: totalAmount,
      },
    });

    // Create release transactions for audit trail
    for (const earning of heldEarnings) {
      await this.createTransaction({
        walletId: wallet._id.toString(),
        transactionType: TransactionType.EARNINGS_RELEASE,
        amount: earning.amount,
        campaignId: earning.campaignId,
        description: `Released earnings from campaign ${earning.campaignId}`,
        metadata: { originalTransactionId: earning._id.toString() },
        createdBy: 'system',
      });
    }
  }

  /**
   * Cancel held earnings (e.g., when campaign is cancelled)
   */
  async cancelHeldEarnings(userId: string, campaignId: string): Promise<void> {
    const wallet = await this.getWalletByUserId(userId);

    const heldEarnings = await this.transactionModel.find({
      walletId: wallet._id,
      transactionType: TransactionType.EARNINGS_HOLD,
      status: TransactionStatus.PENDING,
      campaignId: campaignId,
    });

    if (heldEarnings.length === 0) {
      return;
    }

    const totalAmount = heldEarnings.reduce(
      (sum, earning) => sum + earning.amount,
      0,
    );

    // Update transactions to cancelled status
    await this.transactionModel.updateMany(
      { _id: { $in: heldEarnings.map((e) => e._id) } },
      { status: TransactionStatus.CANCELLED },
    );

    // Create cancellation transactions for audit trail
    for (const earning of heldEarnings) {
      await this.createTransaction({
        walletId: wallet._id.toString(),
        transactionType: TransactionType.EARNINGS_CREDIT,
        amount: -earning.amount,
        campaignId: earning.campaignId,
        description: `Cancelled earnings from campaign ${earning.campaignId}`,
        metadata: { originalTransactionId: earning._id.toString() },
        createdBy: 'system',
      });
    }
  }
}
