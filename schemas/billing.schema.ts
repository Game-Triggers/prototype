import { Schema, model, Model, models } from 'mongoose';

export enum DisputeType {
  PAYMENT_NOT_RECEIVED = 'payment_not_received',
  WRONG_AMOUNT = 'wrong_amount',
  CAMPAIGN_NOT_DELIVERED = 'campaign_not_delivered',
  TECHNICAL_ISSUE = 'technical_issue',
  BILLING_ERROR = 'billing_error',
  FRAUDULENT_TRANSACTION = 'fraudulent_transaction',
  REFUND_REQUEST = 'refund_request',
  OTHER = 'other'
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  CLOSED = 'closed'
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface IDisputeComment {
  _id?: string;
  commentBy: string;
  comment: string;
  attachments?: string[];
  isInternal: boolean; // Admin-only comments
  createdAt: Date;
}

export interface IDispute {
  _id?: string;
  disputeId: string; // Unique dispute reference number
  raisedBy: string; // User ID
  disputeType: DisputeType;
  status: DisputeStatus;
  priority: DisputePriority;
  
  // Related entities
  transactionId?: string;
  campaignId?: string;
  walletId?: string;
  
  // Dispute details
  subject: string;
  description: string;
  attachments?: string[];
  disputeAmount?: number;
  currency: string;
  
  // Resolution
  resolution?: string;
  resolutionAmount?: number;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Timeline
  assignedTo?: string;
  assignedAt?: Date;
  escalatedAt?: Date;
  
  // Communication
  comments: IDisputeComment[];
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Invoice Schema for Brand Billing
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
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
  invoiceNumber: string; // Unique invoice number
  brandId: string;
  
  // Invoice details
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  
  // Amounts
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  
  // Line items
  lineItems: IInvoiceLineItem[];
  
  // Payment details
  paymentMethod?: string;
  paidAt?: Date;
  paymentTransactionId?: string;
  
  // Billing address
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
  
  // Notes and terms
  notes?: string;
  terms?: string;
  
  // File references
  invoicePdfUrl?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Schemas
const disputeCommentSchema = new Schema<IDisputeComment>({
  commentBy: { type: String, required: true },
  comment: { type: String, required: true },
  attachments: [{ type: String }],
  isInternal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const disputeSchema = new Schema<IDispute>(
  {
    disputeId: { type: String, required: true, unique: true },
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
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet' },
    
    // Dispute details
    subject: { type: String, required: true },
    description: { type: String, required: true },
    attachments: [{ type: String }],
    disputeAmount: { type: Number },
    currency: { type: String, default: 'INR' },
    
    // Resolution
    resolution: { type: String },
    resolutionAmount: { type: Number },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    
    // Timeline
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
    escalatedAt: { type: Date },
    
    // Communication
    comments: [disputeCommentSchema],
    
    // Metadata
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  campaignId: { type: String, required: true },
  campaignName: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} }
});

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
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
  },
  { timestamps: true }
);

// Create indexes
disputeSchema.index({ disputeId: 1 });
disputeSchema.index({ raisedBy: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ assignedTo: 1 });
disputeSchema.index({ createdAt: -1 });

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ brandId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1 });

// Export schemas
export const DisputeSchema = disputeSchema;
export const InvoiceSchema = invoiceSchema;

// Model functions
export function getDisputeModel(): Model<IDispute> {
  if (typeof window === 'undefined') {
    return models.Dispute || model<IDispute>('Dispute', disputeSchema);
  }
  return null as unknown as Model<IDispute>;
}

export function getInvoiceModel(): Model<IInvoice> {
  if (typeof window === 'undefined') {
    return models.Invoice || model<IInvoice>('Invoice', invoiceSchema);
  }
  return null as unknown as Model<IInvoice>;
}

export const Dispute = getDisputeModel();
export const Invoice = getInvoiceModel();
