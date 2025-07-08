"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.Wallet = exports.TransactionSchema = exports.WalletSchema = exports.PaymentMethod = exports.TransactionStatus = exports.TransactionType = exports.WalletType = void 0;
exports.getWalletModel = getWalletModel;
exports.getTransactionModel = getTransactionModel;
const mongoose_1 = require("mongoose");
var WalletType;
(function (WalletType) {
    WalletType["BRAND"] = "brand";
    WalletType["STREAMER"] = "streamer";
    WalletType["PLATFORM"] = "platform";
})(WalletType || (exports.WalletType = WalletType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["CAMPAIGN_RESERVE"] = "campaign_reserve";
    TransactionType["CAMPAIGN_CHARGE"] = "campaign_charge";
    TransactionType["CAMPAIGN_REFUND"] = "campaign_refund";
    TransactionType["EARNINGS_CREDIT"] = "earnings_credit";
    TransactionType["EARNINGS_HOLD"] = "earnings_hold";
    TransactionType["EARNINGS_RELEASE"] = "earnings_release";
    TransactionType["PLATFORM_FEE"] = "platform_fee";
    TransactionType["DISPUTE_HOLD"] = "dispute_hold";
    TransactionType["DISPUTE_RELEASE"] = "dispute_release";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["PROCESSING"] = "processing";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["CANCELLED"] = "cancelled";
    TransactionStatus["DISPUTED"] = "disputed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["UPI"] = "upi";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["NETBANKING"] = "netbanking";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["WALLET"] = "wallet";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
const walletSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const transactionSchema = new mongoose_1.Schema({
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
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Campaign' },
    description: { type: String, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    balanceAfter: { type: Number, required: true },
    reservedBalanceAfter: { type: Number, required: true },
    withdrawableBalanceAfter: { type: Number, required: true },
    processedAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: String, required: true },
    approvedBy: { type: String },
}, { timestamps: true });
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
exports.WalletSchema = walletSchema;
exports.TransactionSchema = transactionSchema;
function getWalletModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.Wallet || (0, mongoose_1.model)('Wallet', walletSchema);
    }
    return null;
}
function getTransactionModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.Transaction || (0, mongoose_1.model)('Transaction', transactionSchema);
    }
    return null;
}
exports.Wallet = getWalletModel();
exports.Transaction = getTransactionModel();
//# sourceMappingURL=wallet.schema.js.map