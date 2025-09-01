import { Schema, model, Model, models } from 'mongoose';

export enum WalletType {
  BRAND = 'brand',
  STREAMER = 'streamer',
  PLATFORM = 'platform'
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  CAMPAIGN_RESERVE = 'campaign_reserve',
  CAMPAIGN_CHARGE = 'campaign_charge',
  CAMPAIGN_REFUND = 'campaign_refund',
  EARNINGS_CREDIT = 'earnings_credit',
  EARNINGS_HOLD = 'earnings_hold',
  EARNINGS_RELEASE = 'earnings_release',
  PLATFORM_FEE = 'platform_fee',
  DISPUTE_HOLD = 'dispute_hold',
  DISPUTE_RELEASE = 'dispute_release'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet'
}

// Wallet Schema
export interface IWallet {
  _id?: string;
  userId: string;
  walletType: WalletType;
  balance: number;
  reservedBalance: number;
  withdrawableBalance: number;
  heldBalance?: number; // For earnings in hold period
  totalEarnings?: number; // For streamers
  totalSpent?: number; // For brands
  currency: string;
  isActive: boolean;
  autoTopupEnabled?: boolean;
  autoTopupThreshold?: number;
  autoTopupAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true },
    walletType: { 
      type: String, 
      enum: Object.values(WalletType), 
      required: true 
    },
    balance: { type: Number, default: 0, min: 0 },
    reservedBalance: { type: Number, default: 0, min: 0 },
    withdrawableBalance: { type: Number, default: 0, min: 0 },
    heldBalance: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true },
    autoTopupEnabled: { type: Boolean, default: false },
    autoTopupThreshold: { type: Number, default: 0 },
    autoTopupAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Transaction Schema
export interface ITransaction {
  _id?: string;
  walletId: string;
  userId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  campaignId?: string;
  description: string;
  metadata?: {
    paymentGatewayTxnId?: string;
    campaignName?: string;
    milestoneType?: string;
    kycVerified?: boolean;
    adminApproved?: boolean;
    [key: string]: string | number | boolean | Date | undefined;
  };
  balanceAfter: number;
  reservedBalanceAfter: number;
  withdrawableBalanceAfter: number;
  processedAt?: Date;
  expiresAt?: Date; // For holds and reserves
  createdBy: string;
  approvedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    walletId: { type: String, required: true },
    userId: { type: String, required: true },
    transactionType: { 
      type: String, 
      enum: Object.values(TransactionType), 
      required: true 
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
      type: String, 
      enum: Object.values(TransactionStatus), 
      default: TransactionStatus.PENDING 
    },
    paymentMethod: { 
      type: String, 
      enum: Object.values(PaymentMethod) 
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    balanceAfter: { type: Number, required: true },
    reservedBalanceAfter: { type: Number, required: true },
    withdrawableBalanceAfter: { type: Number, required: true },
    processedAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: String, required: true },
    approvedBy: { type: String },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
walletSchema.index({ userId: 1 });
walletSchema.index({ walletType: 1 });
walletSchema.index({ isActive: 1 });

transactionSchema.index({ walletId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ campaignId: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export schemas
export const WalletSchema = walletSchema;
export const TransactionSchema = transactionSchema;

// Model functions
export function getWalletModel(): Model<IWallet> {
  if (typeof window === 'undefined') {
    return models.Wallet || model<IWallet>('Wallet', walletSchema);
  }
  return null as unknown as Model<IWallet>;
}

export function getTransactionModel(): Model<ITransaction> {
  if (typeof window === 'undefined') {
    return models.Transaction || model<ITransaction>('Transaction', transactionSchema);
  }
  return null as unknown as Model<ITransaction>;
}

export const Wallet = getWalletModel();
export const Transaction = getTransactionModel();
