"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = exports.Dispute = exports.InvoiceSchema = exports.DisputeSchema = exports.InvoiceStatus = exports.DisputePriority = exports.DisputeStatus = exports.DisputeType = void 0;
exports.getDisputeModel = getDisputeModel;
exports.getInvoiceModel = getInvoiceModel;
const mongoose_1 = require("mongoose");
var DisputeType;
(function (DisputeType) {
    DisputeType["PAYMENT_NOT_RECEIVED"] = "payment_not_received";
    DisputeType["WRONG_AMOUNT"] = "wrong_amount";
    DisputeType["CAMPAIGN_NOT_DELIVERED"] = "campaign_not_delivered";
    DisputeType["TECHNICAL_ISSUE"] = "technical_issue";
    DisputeType["BILLING_ERROR"] = "billing_error";
    DisputeType["FRAUDULENT_TRANSACTION"] = "fraudulent_transaction";
    DisputeType["REFUND_REQUEST"] = "refund_request";
    DisputeType["OTHER"] = "other";
})(DisputeType || (exports.DisputeType = DisputeType = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPEN"] = "open";
    DisputeStatus["UNDER_REVIEW"] = "under_review";
    DisputeStatus["INVESTIGATING"] = "investigating";
    DisputeStatus["RESOLVED"] = "resolved";
    DisputeStatus["REJECTED"] = "rejected";
    DisputeStatus["ESCALATED"] = "escalated";
    DisputeStatus["CLOSED"] = "closed";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
var DisputePriority;
(function (DisputePriority) {
    DisputePriority["LOW"] = "low";
    DisputePriority["MEDIUM"] = "medium";
    DisputePriority["HIGH"] = "high";
    DisputePriority["URGENT"] = "urgent";
})(DisputePriority || (exports.DisputePriority = DisputePriority = {}));
// Invoice Schema for Brand Billing
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
    InvoiceStatus["REFUNDED"] = "refunded";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
// Schemas
const disputeCommentSchema = new mongoose_1.Schema({
    commentBy: { type: String, required: true },
    comment: { type: String, required: true },
    attachments: [{ type: String }],
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const disputeSchema = new mongoose_1.Schema({
    disputeId: { type: String, required: true },
    raisedBy: { type: String, required: true },
    disputeType: {
        type: String,
        enum: Object.values(DisputeType),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(DisputeStatus),
        default: DisputeStatus.OPEN
    },
    priority: {
        type: String,
        enum: Object.values(DisputePriority),
        default: DisputePriority.MEDIUM
    },
    // Related entities
    transactionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Transaction' },
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Campaign' },
    walletId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Wallet' },
    // Dispute details
    subject: { type: String, required: true },
    description: { type: String, required: true },
    attachments: [{ type: String }],
    disputeAmount: { type: Number },
    currency: { type: String, default: 'INR' },
    // Resolution
    resolution: { type: String },
    resolutionAmount: { type: Number },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    // Timeline
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
    escalatedAt: { type: Date },
    // Communication
    comments: [disputeCommentSchema],
    // Metadata
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
const invoiceLineItemSchema = new mongoose_1.Schema({
    campaignId: { type: String, required: true },
    campaignName: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} }
});
const invoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true },
    brandId: { type: String, required: true },
    // Invoice details
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: Object.values(InvoiceStatus),
        default: InvoiceStatus.DRAFT
    },
    // Amounts
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    // Line items
    lineItems: [invoiceLineItemSchema],
    // Payment details
    paymentMethod: { type: String },
    paidAt: { type: Date },
    paymentTransactionId: { type: String },
    // Billing address
    billingAddress: {
        companyName: { type: String, required: true },
        contactName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'India' },
        gstNumber: { type: String }
    },
    // Notes and terms
    notes: { type: String },
    terms: { type: String },
    // File references
    invoicePdfUrl: { type: String }
}, { timestamps: true });
// Create indexes
disputeSchema.index({ disputeId: 1 }, { unique: true });
disputeSchema.index({ raisedBy: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ assignedTo: 1 });
disputeSchema.index({ createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ brandId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1 });
// Export schemas
exports.DisputeSchema = disputeSchema;
exports.InvoiceSchema = invoiceSchema;
// Model functions
function getDisputeModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.Dispute || (0, mongoose_1.model)('Dispute', disputeSchema);
    }
    return null;
}
function getInvoiceModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.Invoice || (0, mongoose_1.model)('Invoice', invoiceSchema);
    }
    return null;
}
exports.Dispute = getDisputeModel();
exports.Invoice = getInvoiceModel();
//# sourceMappingURL=billing.schema.js.map