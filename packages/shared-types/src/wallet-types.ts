export enum WalletType {
  BRAND = "brand",
  STREAMER = "streamer",
  PLATFORM = "platform",
}

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  CAMPAIGN_RESERVE = "campaign_reserve",
  CAMPAIGN_CHARGE = "campaign_charge",
  CAMPAIGN_REFUND = "campaign_refund",
  EARNINGS_CREDIT = "earnings_credit",
  EARNINGS_HOLD = "earnings_hold",
  EARNINGS_RELEASE = "earnings_release",
  PLATFORM_FEE = "platform_fee",
  DISPUTE_HOLD = "dispute_hold",
  DISPUTE_RELEASE = "dispute_release",
}

export enum TransactionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
    DISPUTED = 'disputed'
}

export enum PaymentMethod {
    UPI = 'upi',
    CARD = 'card',
    NETBANKING = 'netbanking',
    BANK_TRANSFER = 'bank_transfer',
    WALLET = 'wallet'
}

export interface IWallet {
    _id?: string;
    userId: string;
    walletType: WalletType;
    balance: number; // Available balance
    reservedBalance: number; // Funds reserved for campaigns
    withdrawableBalance: number; // Funds available for withdrawal
    heldBalance?: number;
    totalEarnings?: number; // Total earnings ever made
    totalSpent?: number; // Total amount ever spent
    currency: string; // e.g., USD, INR
    isActive?: boolean;
    autoTopUpEnabled?: boolean;
    autoTopUpThreshold?: number; // e.g., if balance falls below this amount,
    autoTopUpAmount?: number; // e.g., top up by this amount
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITransaction {
    _id?: string;
    walledId: string;
    userId: string;
    transactionType: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    paymentMethod?: PaymentMethod;
    externalTransactionId?: string; // e.g., payment gateway transaction ID
    description?: string;
    metadata?: any; // Additional data related to the transaction
    balanceAfter: number; // Wallet balance after this transaction
    resevedBalanceAfter: number; // Reserved balance after this transaction
    withdrawableBalanceAfter: number; // Withdrawable balance after this transaction
    processdAt?: Date;
    expiresAt?: Date;
    createdBy: string;

    createdAt?: Date;
    updatedAt?: Date;
}