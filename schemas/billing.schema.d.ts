import { Schema, Model } from 'mongoose';
export declare enum DisputeType {
    PAYMENT_NOT_RECEIVED = "payment_not_received",
    WRONG_AMOUNT = "wrong_amount",
    CAMPAIGN_NOT_DELIVERED = "campaign_not_delivered",
    TECHNICAL_ISSUE = "technical_issue",
    BILLING_ERROR = "billing_error",
    FRAUDULENT_TRANSACTION = "fraudulent_transaction",
    REFUND_REQUEST = "refund_request",
    OTHER = "other"
}
export declare enum DisputeStatus {
    OPEN = "open",
    UNDER_REVIEW = "under_review",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    REJECTED = "rejected",
    ESCALATED = "escalated",
    CLOSED = "closed"
}
export declare enum DisputePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export interface IDisputeComment {
    _id?: string;
    commentBy: string;
    comment: string;
    attachments?: string[];
    isInternal: boolean;
    createdAt: Date;
}
export interface IDispute {
    _id?: string;
    disputeId: string;
    raisedBy: string;
    disputeType: DisputeType;
    status: DisputeStatus;
    priority: DisputePriority;
    transactionId?: string;
    campaignId?: string;
    walletId?: string;
    subject: string;
    description: string;
    attachments?: string[];
    disputeAmount?: number;
    currency: string;
    resolution?: string;
    resolutionAmount?: number;
    resolvedBy?: string;
    resolvedAt?: Date;
    assignedTo?: string;
    assignedAt?: Date;
    escalatedAt?: Date;
    comments: IDisputeComment[];
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare enum InvoiceStatus {
    DRAFT = "draft",
    SENT = "sent",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export interface IInvoiceLineItem {
    campaignId: string;
    campaignName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    taxAmount?: number;
    metadata?: Record<string, unknown>;
}
export interface IInvoice {
    _id?: string;
    invoiceNumber: string;
    brandId: string;
    invoiceDate: Date;
    dueDate: Date;
    status: InvoiceStatus;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    lineItems: IInvoiceLineItem[];
    paymentMethod?: string;
    paidAt?: Date;
    paymentTransactionId?: string;
    billingAddress: {
        companyName: string;
        contactName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        gstNumber?: string;
    };
    notes?: string;
    terms?: string;
    invoicePdfUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const DisputeSchema: Schema<IDispute, Model<IDispute, any, any, any, import("mongoose").Document<unknown, any, IDispute> & IDispute & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IDispute, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IDispute>> & import("mongoose").FlatRecord<IDispute> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare const InvoiceSchema: Schema<IInvoice, Model<IInvoice, any, any, any, import("mongoose").Document<unknown, any, IInvoice> & IInvoice & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IInvoice, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IInvoice>> & import("mongoose").FlatRecord<IInvoice> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare function getDisputeModel(): Model<IDispute>;
export declare function getInvoiceModel(): Model<IInvoice>;
export declare const Dispute: Model<IDispute, {}, {}, {}, import("mongoose").Document<unknown, {}, IDispute> & IDispute & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare const Invoice: Model<IInvoice, {}, {}, {}, import("mongoose").Document<unknown, {}, IInvoice> & IInvoice & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
