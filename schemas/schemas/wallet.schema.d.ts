import { Schema, Model } from 'mongoose';
export declare enum WalletType {
    BRAND = "brand",
    STREAMER = "streamer",
    PLATFORM = "platform"
}
export declare enum TransactionType {
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
    DISPUTE_RELEASE = "dispute_release"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    DISPUTED = "disputed"
}
export declare enum PaymentMethod {
    UPI = "upi",
    CARD = "card",
    NETBANKING = "netbanking",
    BANK_TRANSFER = "bank_transfer",
    WALLET = "wallet"
}
export interface IWallet {
    _id?: string;
    userId: string;
    walletType: WalletType;
    balance: number;
    reservedBalance: number;
    withdrawableBalance: number;
    heldBalance?: number;
    totalEarnings?: number;
    totalSpent?: number;
    currency: string;
    isActive: boolean;
    autoTopupEnabled?: boolean;
    autoTopupThreshold?: number;
    autoTopupAmount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
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
    expiresAt?: Date;
    createdBy: string;
    approvedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const WalletSchema: Schema<IWallet, Model<IWallet, any, any, any, import("mongoose").Document<unknown, any, IWallet, any, {}> & IWallet & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IWallet, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IWallet>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<IWallet> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare const TransactionSchema: Schema<ITransaction, Model<ITransaction, any, any, any, import("mongoose").Document<unknown, any, ITransaction, any, {}> & ITransaction & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ITransaction, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ITransaction>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ITransaction> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare function getWalletModel(): Model<IWallet>;
export declare function getTransactionModel(): Model<ITransaction>;
export declare const Wallet: Model<IWallet, {}, {}, {}, import("mongoose").Document<unknown, {}, IWallet, {}, {}> & IWallet & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare const Transaction: Model<ITransaction, {}, {}, {}, import("mongoose").Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=wallet.schema.d.ts.map