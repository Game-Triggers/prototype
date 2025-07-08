import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from '../wallet/wallet.service';
import { KYCService } from '../wallet/kyc.service';
import {
  IWallet,
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '@schemas/wallet.schema';
import { IKYC, KYCStatus } from '@schemas/kyc.schema';
import { IUser, UserRole } from '@schemas/user.schema';
import { ICampaign } from '@schemas/campaign.schema';

export interface FinanceOverview {
  totalVolume: number;
  pendingWithdrawals: number;
  totalReserved: number;
  platformRevenue: number;
  activeUsers: number;
  flaggedTransactions: number;
}

export interface WithdrawalRequest {
  _id: string;
  userId: string;
  userName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  bankDetails?: any;
  kycStatus: string;
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
}

export interface TransactionWithUser extends ITransaction {
  userName: string;
  userRole: string;
  campaignName?: string;
}

@Injectable()
export class AdminFinanceService {
  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<IWallet>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<ITransaction>,
    @InjectModel('User') private readonly userModel: Model<IUser>,
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('KYC') private readonly kycModel: Model<IKYC>,
    private readonly walletService: WalletService,
    private readonly kycService: KYCService,
  ) {}

  /**
   * Get finance overview statistics
   */
  async getFinanceOverview(): Promise<FinanceOverview> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Debug: Check total transactions
      const totalTransactionsCount =
        await this.transactionModel.countDocuments();

      // Debug: Check transactions by type
      const transactionsByType = await this.transactionModel.aggregate([
        {
          $group: {
            _id: '$transactionType',
            count: { $sum: 1 },
          },
        },
      ]);

      // Calculate total volume (all completed transactions, last 30 days)
      const totalVolumeResult = await this.transactionModel.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            $and: [
              {
                $or: [
                  { status: TransactionStatus.COMPLETED },
                  { status: 'COMPLETED' },
                ],
              },
              {
                $or: [
                  {
                    transactionType: {
                      $in: [
                        TransactionType.DEPOSIT,
                        TransactionType.CAMPAIGN_CHARGE,
                        TransactionType.EARNINGS_CREDIT,
                        TransactionType.CAMPAIGN_RESERVE,
                      ],
                    },
                  },
                  {
                    type: {
                      $in: [
                        'deposit',
                        'DEPOSIT',
                        'campaign_charge',
                        'CAMPAIGN_CHARGE',
                        'earnings_credit',
                        'EARNINGS_CREDIT',
                        'campaign_reserve',
                        'CAMPAIGN_RESERVE',
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: { $abs: '$amount' } },
          },
        },
      ]);

      // Calculate pending withdrawals (all pending withdrawal requests)
      const pendingWithdrawalsResult = await this.transactionModel.aggregate([
        {
          $match: {
            transactionType: TransactionType.WITHDRAWAL,
            status: {
              $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING],
            },
          },
        },
        {
          $group: {
            _id: null,
            pendingWithdrawals: { $sum: { $abs: '$amount' } },
          },
        },
      ]);

      // Calculate total reserved funds from wallet reservedBalance
      const totalReservedFromWallets = await this.walletModel.aggregate([
        {
          $group: {
            _id: null,
            totalReserved: { $sum: '$reservedBalance' },
          },
        },
      ]);

      // Alternative: Calculate reserved from transactions
      const totalReservedFromTransactions =
        await this.transactionModel.aggregate([
          {
            $match: {
              transactionType: {
                $in: [
                  TransactionType.CAMPAIGN_RESERVE,
                  TransactionType.EARNINGS_HOLD,
                  TransactionType.DISPUTE_HOLD,
                ],
              },
              status: {
                $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalReserved: { $sum: { $abs: '$amount' } },
            },
          },
        ]);

      // Calculate platform revenue (commission from completed transactions)
      const platformRevenueResult = await this.transactionModel.aggregate([
        {
          $match: {
            transactionType: TransactionType.PLATFORM_FEE,
            status: TransactionStatus.COMPLETED,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            platformRevenue: { $sum: { $abs: '$amount' } },
          },
        },
      ]);

      // Count active users (users with any activity in last 30 days)
      const activeUsersResult = await this.userModel.countDocuments({
        $or: [
          { lastLoginAt: { $gte: thirtyDaysAgo } },
          { createdAt: { $gte: thirtyDaysAgo } },
        ],
      });

      // Alternative active users from transactions
      const activeUsersFromTransactions = await this.transactionModel.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: '$userId',
            },
          },
          {
            $count: 'activeUsers',
          },
        ],
      );

      // Count flagged transactions (failed or disputed)
      const flaggedTransactionsResult =
        await this.transactionModel.countDocuments({
          status: {
            $in: [TransactionStatus.FAILED, TransactionStatus.DISPUTED],
          },
          createdAt: { $gte: thirtyDaysAgo },
        });

      const result = {
        totalVolume: totalVolumeResult[0]?.totalVolume || 0,
        pendingWithdrawals:
          pendingWithdrawalsResult[0]?.pendingWithdrawals || 0,
        totalReserved: Math.max(
          totalReservedFromWallets[0]?.totalReserved || 0,
          totalReservedFromTransactions[0]?.totalReserved || 0,
        ),
        platformRevenue: platformRevenueResult[0]?.platformRevenue || 0,
        activeUsers: Math.max(
          activeUsersResult,
          activeUsersFromTransactions[0]?.activeUsers || 0,
        ),
        flaggedTransactions: flaggedTransactionsResult || 0,
      };

      return result;
    } catch (error) {
      console.error(
        '[AdminFinanceService] Error in getFinanceOverview:',
        error,
      );
      throw error;
    }
  }

  /**
   * Get transactions with user details
   */
  async getTransactionsWithUsers(filters: any = {}): Promise<{
    transactions: TransactionWithUser[];
    totalCount: number;
  }> {
    try {
      const {
        status,
        userRole,
        transactionType,
        dateRange = '7d',
        page = 1,
        limit = 50,
      } = filters;

      // Build match criteria - simplified approach
      const matchCriteria: any = {};

      // For now, let's get all transactions and filter manually if needed
      // This helps us debug the exact field structure

      // Date range filter
      const now = new Date();
      const daysAgo = parseInt(dateRange.replace('d', ''));
      if (daysAgo && daysAgo > 0) {
        matchCriteria.createdAt = {
          $gte: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        };
      }

      // First, get a simple count of transactions matching the criteria
      const simpleCount =
        await this.transactionModel.countDocuments(matchCriteria);

      // Use the working aggregation pipeline that we tested in MongoDB
      const transactions = await this.transactionModel.aggregate([
        { $match: matchCriteria },
        {
          $addFields: {
            userObjectId: { $toObjectId: '$userId' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userObjectId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            userName: {
              $ifNull: [
                '$user.name',
                { $ifNull: ['$user.email', 'Unknown User'] },
              ],
            },
            userRole: { $ifNull: ['$user.role', 'unknown'] },
            transactionType: { $ifNull: ['$transactionType', '$type'] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);

      const totalCount =
        await this.transactionModel.countDocuments(matchCriteria);

      return {
        transactions: transactions as TransactionWithUser[],
        totalCount,
      };
    } catch (error) {
      return {
        transactions: [],
        totalCount: 0,
      };
    }
  }

  /**
   * Get withdrawal requests with user and KYC details
   */
  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      console.log('[AdminFinanceService] Getting withdrawal requests...');

      // First check how many withdrawal transactions exist
      const withdrawalCount = await this.transactionModel.countDocuments({
        transactionType: TransactionType.WITHDRAWAL,
      });
      const pendingCount = await this.transactionModel.countDocuments({
        transactionType: TransactionType.WITHDRAWAL,
        status: {
          $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING],
        },
      });

      const withdrawals = await this.transactionModel.aggregate([
        {
          $match: {
            transactionType: TransactionType.WITHDRAWAL,
            // Include more statuses to see all withdrawals
            status: {
              $in: [
                TransactionStatus.PENDING,
                TransactionStatus.PROCESSING,
                TransactionStatus.COMPLETED,
                TransactionStatus.FAILED,
              ],
            },
          },
        },
        {
          $addFields: {
            // Convert userId to ObjectId - handle both string and ObjectId cases
            userObjectId: {
              $cond: {
                if: { $eq: [{ $type: '$userId' }, 'string'] },
                then: { $toObjectId: '$userId' },
                else: '$userId',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userObjectId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'kycs',
            localField: 'userObjectId',
            foreignField: 'userId',
            as: 'kyc',
          },
        },
        {
          $addFields: {
            userName: {
              $ifNull: [
                '$user.name',
                { $ifNull: ['$user.email', 'Unknown User'] },
              ],
            },
            kycStatus: { $arrayElemAt: ['$kyc.status', 0] },
            bankDetails: { $arrayElemAt: ['$kyc.bankDetails', 0] },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return withdrawals.map((withdrawal) => ({
        _id: withdrawal._id.toString(),
        userId: withdrawal.userId.toString(),
        userName: withdrawal.userName || 'Unknown User',
        amount: withdrawal.amount,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod || 'bank_transfer',
        bankDetails: withdrawal.bankDetails,
        kycStatus: withdrawal.kycStatus || 'pending',
        requestedAt: withdrawal.createdAt.toISOString(),
        processedAt: withdrawal.processedAt?.toISOString(),
        adminNotes: withdrawal.metadata?.adminNotes,
      }));
    } catch (error) {
      console.error(
        '[AdminFinanceService] Error in getWithdrawalRequests:',
        error,
      );
      return [];
    }
  }

  /**
   * Process withdrawal request (approve/reject)
   */
  async processWithdrawalRequest(
    withdrawalId: string,
    action: 'approve' | 'reject',
    adminId: string,
    notes?: string,
  ): Promise<ITransaction> {
    const transaction = await this.transactionModel.findById(withdrawalId);
    if (!transaction) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (transaction.transactionType !== TransactionType.WITHDRAWAL) {
      throw new ForbiddenException('Invalid transaction type');
    }

    const newStatus =
      action === 'approve'
        ? TransactionStatus.PROCESSING
        : TransactionStatus.FAILED;
    const updatedTransaction = await this.transactionModel.findByIdAndUpdate(
      withdrawalId,
      {
        status: newStatus,
        processedAt: new Date(),
        approvedBy: adminId,
        'metadata.adminNotes': notes,
        'metadata.adminAction': action,
      },
      { new: true },
    );

    if (action === 'approve') {
      // For approved withdrawals, you would typically integrate with payment gateway here
      // For now, we'll mark it as completed
      await this.transactionModel.findByIdAndUpdate(withdrawalId, {
        status: TransactionStatus.COMPLETED,
      });

      // Update wallet balance
      const wallet = await this.walletModel.findOne({
        userId: transaction.userId,
      });
      if (wallet) {
        await this.walletModel.findByIdAndUpdate(wallet._id, {
          $inc: { withdrawableBalance: -transaction.amount },
        });
      }
    }

    return updatedTransaction!;
  }

  /**
   * Get dispute statistics and actual disputes
   */
  async getDisputeStatistics(): Promise<any> {
    try {
      console.log('[AdminFinanceService] Getting disputes...');

      // Since we don't have a dedicated disputes collection yet,
      // we'll look for disputed transactions
      const disputedTransactions = await this.transactionModel.aggregate([
        {
          $match: {
            status: TransactionStatus.DISPUTED,
          },
        },
        {
          $addFields: {
            // Convert userId to ObjectId - handle both string and ObjectId cases
            userObjectId: {
              $cond: {
                if: { $eq: [{ $type: '$userId' }, 'string'] },
                then: { $toObjectId: '$userId' },
                else: '$userId',
              },
            },
            // Convert campaignId to ObjectId if it exists and is a string
            campaignObjectId: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$campaignId', null] },
                    { $eq: [{ $type: '$campaignId' }, 'string'] },
                  ],
                },
                then: { $toObjectId: '$campaignId' },
                else: '$campaignId',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userObjectId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'campaigns',
            localField: 'campaignObjectId',
            foreignField: '_id',
            as: 'campaign',
          },
        },
        {
          $addFields: {
            userName: {
              $ifNull: [
                '$user.name',
                { $ifNull: ['$user.email', 'Unknown User'] },
              ],
            },
            campaignName: { $arrayElemAt: ['$campaign.title', 0] },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      // Also check for failed transactions that might be disputes
      const failedTransactions = await this.transactionModel.aggregate([
        {
          $match: {
            status: TransactionStatus.FAILED,
            'metadata.disputeReason': { $exists: true },
          },
        },
        {
          $addFields: {
            // Convert userId to ObjectId - handle both string and ObjectId cases
            userObjectId: {
              $cond: {
                if: { $eq: [{ $type: '$userId' }, 'string'] },
                then: { $toObjectId: '$userId' },
                else: '$userId',
              },
            },
            // Convert campaignId to ObjectId if it exists and is a string
            campaignObjectId: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$campaignId', null] },
                    { $eq: [{ $type: '$campaignId' }, 'string'] },
                  ],
                },
                then: { $toObjectId: '$campaignId' },
                else: '$campaignId',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userObjectId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'campaigns',
            localField: 'campaignObjectId',
            foreignField: '_id',
            as: 'campaign',
          },
        },
        {
          $addFields: {
            userName: {
              $ifNull: [
                '$user.name',
                { $ifNull: ['$user.email', 'Unknown User'] },
              ],
            },
            campaignName: { $arrayElemAt: ['$campaign.title', 0] },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      const allDisputes = [...disputedTransactions, ...failedTransactions];

      const disputes = allDisputes.map((dispute) => ({
        _id: dispute._id.toString(),
        transactionId: dispute._id.toString(),
        userId: dispute.userId.toString(),
        userName: dispute.userName || 'Unknown User',
        campaignId: dispute.campaignId?.toString(),
        campaignName: dispute.campaignName || 'N/A',
        amount: dispute.amount,
        status: dispute.status,
        reason: dispute.metadata?.disputeReason || 'Transaction failed',
        description:
          dispute.description ||
          dispute.metadata?.description ||
          'No description available',
        evidenceUrls: dispute.metadata?.evidenceUrls || [],
        createdAt: dispute.createdAt.toISOString(),
        resolvedAt: dispute.resolvedAt?.toISOString(),
        resolution: dispute.metadata?.resolution,
      }));

      console.log('[AdminFinanceService] Retrieved disputes:', disputes.length);

      return {
        disputes,
        totalDisputes: disputes.length,
        pendingDisputes: disputes.filter((d) => d.status === 'disputed').length,
        resolvedDisputes: disputes.filter((d) => d.resolvedAt).length,
      };
    } catch (error) {
      console.error(
        '[AdminFinanceService] Error in getDisputeStatistics:',
        error,
      );
      return {
        disputes: [],
        totalDisputes: 0,
        pendingDisputes: 0,
        resolvedDisputes: 0,
      };
    }
  }

  /**
   * Get audit trail for a specific transaction
   */
  async getTransactionAuditTrail(transactionId: string): Promise<any[]> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate('userId campaignId');
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Return audit events for this transaction
    return [
      {
        event: 'transaction_created',
        timestamp: transaction.createdAt,
        actor: 'system',
        details: `Transaction created by ${transaction.createdBy}`,
      },
      ...(transaction.processedAt
        ? [
            {
              event: 'transaction_processed',
              timestamp: transaction.processedAt,
              actor: transaction.approvedBy || 'system',
              details: `Transaction processed with status: ${transaction.status}`,
            },
          ]
        : []),
    ];
  }

  /**
   * Generate finance report
   */
  async generateFinanceReport(
    startDate: Date,
    endDate: Date,
    reportType: 'summary' | 'detailed' = 'summary',
  ): Promise<any> {
    const matchCriteria = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: TransactionStatus.COMPLETED,
    };

    if (reportType === 'summary') {
      return await this.transactionModel.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: '$transactionType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]);
    } else {
      return await this.transactionModel
        .find(matchCriteria)
        .populate('userId', 'name email role')
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 });
    }
  }

  /**
   * Debug method to check database contents
   */
  async getDebugData(): Promise<any> {
    try {
      const walletCount = await this.walletModel.countDocuments();
      const transactionCount = await this.transactionModel.countDocuments();
      const userCount = await this.userModel.countDocuments();

      const sampleWallets = await this.walletModel.find().limit(3).lean();
      const sampleTransactions = await this.transactionModel
        .find()
        .limit(10)
        .lean();

      const walletStats = await this.walletModel.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' },
            totalReserved: { $sum: '$reservedBalance' },
            avgBalance: { $avg: '$balance' },
          },
        },
      ]);

      const transactionStats = await this.transactionModel.aggregate([
        {
          $group: {
            _id: '$transactionType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]);

      // Test the actual queries used in the endpoints
      const testTransactionsQuery = await this.transactionModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            userName: {
              $ifNull: [
                '$user.name',
                { $ifNull: ['$user.email', 'Unknown User'] },
              ],
            },
            userRole: '$user.role',
          },
        },
        { $limit: 5 },
      ]);

      const testWithdrawalsQuery = await this.transactionModel.aggregate([
        {
          $match: {
            transactionType: TransactionType.WITHDRAWAL,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            userName: {
              $ifNull: [
                '$user.name',
                { $ifNull: ['$user.email', 'Unknown User'] },
              ],
            },
          },
        },
        { $limit: 5 },
      ]);

      return {
        counts: {
          wallets: walletCount,
          transactions: transactionCount,
          users: userCount,
        },
        sampleWallets,
        sampleTransactions,
        walletStats: walletStats[0] || {},
        transactionStats,
        testQueries: {
          transactions: testTransactionsQuery,
          withdrawals: testWithdrawalsQuery,
        },
      };
    } catch (error) {
      console.error('[AdminFinanceService] Error in getDebugData:', error);
      return {
        error: error.message,
        counts: { wallets: 0, transactions: 0, users: 0 },
      };
    }
  }
}
