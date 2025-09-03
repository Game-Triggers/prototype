"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYC = exports.KYCSchema = exports.DocumentType = exports.KYCStatus = void 0;
exports.getKYCModel = getKYCModel;
const mongoose_1 = require("mongoose");
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["NOT_STARTED"] = "not_started";
    KYCStatus["PENDING"] = "pending";
    KYCStatus["UNDER_REVIEW"] = "under_review";
    KYCStatus["APPROVED"] = "approved";
    KYCStatus["REJECTED"] = "rejected";
    KYCStatus["EXPIRED"] = "expired";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["PAN"] = "pan";
    DocumentType["AADHAAR"] = "aadhaar";
    DocumentType["BANK_STATEMENT"] = "bank_statement";
    DocumentType["CANCELLED_CHEQUE"] = "cancelled_cheque";
    DocumentType["PASSPORT"] = "passport";
    DocumentType["DRIVING_LICENSE"] = "driving_license";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
const kycDocumentSchema = new mongoose_1.Schema({
    documentType: {
        type: String,
        enum: Object.values(DocumentType),
        required: true
    },
    documentNumber: { type: String, required: true },
    documentUrl: { type: String, required: true },
    verificationStatus: {
        type: String,
        enum: Object.values(KYCStatus),
        default: KYCStatus.PENDING
    },
    verifiedAt: { type: Date },
    rejectionReason: { type: String }
});
const bankDetailsSchema = new mongoose_1.Schema({
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    branchName: { type: String, required: true },
    accountType: {
        type: String,
        enum: ['savings', 'current'],
        default: 'savings'
    },
    upiId: { type: String },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
});
const kycSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(KYCStatus),
        default: KYCStatus.NOT_STARTED
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    expiresAt: { type: Date },
    // Personal Information
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String, default: 'India' }
    },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    // Documents
    documents: [kycDocumentSchema],
    // Bank Details
    bankDetails: { type: bankDetailsSchema, required: true },
    // Verification Details
    verificationProvider: { type: String },
    verificationId: { type: String },
    verificationScore: { type: Number },
    // Admin Notes
    adminNotes: { type: String },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    // Withdrawal Settings
    withdrawalSettings: {
        minimumAmount: { type: Number, default: 500 }, // ₹500 minimum
        maximumDailyAmount: { type: Number, default: 50000 }, // ₹50k daily limit
        maximumMonthlyAmount: { type: Number, default: 500000 }, // ₹5L monthly limit
        autoWithdrawalEnabled: { type: Boolean, default: false },
        autoWithdrawalThreshold: { type: Number }
    }
}, { timestamps: true });
// Create indexes
kycSchema.index({ userId: 1 }, { unique: true });
kycSchema.index({ status: 1 });
kycSchema.index({ submittedAt: -1 });
kycSchema.index({ 'bankDetails.accountNumber': 1 });
kycSchema.index({ 'bankDetails.ifscCode': 1 });
// Export schema
exports.KYCSchema = kycSchema;
// Model function
function getKYCModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.KYC || (0, mongoose_1.model)('KYC', kycSchema);
    }
    return null;
}
exports.KYC = getKYCModel();
//# sourceMappingURL=kyc.schema.js.map