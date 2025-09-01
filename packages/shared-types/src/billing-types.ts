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