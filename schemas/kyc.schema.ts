import { Schema, model, Model, models } from 'mongoose';

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum DocumentType {
  PAN = 'pan',
  AADHAAR = 'aadhaar',
  BANK_STATEMENT = 'bank_statement',
  CANCELLED_CHEQUE = 'cancelled_cheque',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license'
}

export interface IKYCDocument {
  documentType: DocumentType;
  documentNumber: string;
  documentUrl: string;
  verificationStatus: KYCStatus;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
  upiId?: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface IKYC {
  _id?: string;
  userId: string;
  status: KYCStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;
  
  // Personal Information
  fullName: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phoneNumber: string;
  email: string;
  
  // Documents
  documents: IKYCDocument[];
  
  // Bank Details
  bankDetails: IBankDetails;
  
  // Verification Details
  verificationProvider?: string; // e.g., 'signzy', 'onfido'
  verificationId?: string;
  verificationScore?: number;
  
  // Admin Notes
  adminNotes?: string;
  reviewedBy?: string;
  
  // Withdrawal Settings
  withdrawalSettings: {
    minimumAmount: number;
    maximumDailyAmount: number;
    maximumMonthlyAmount: number;
    autoWithdrawalEnabled: boolean;
    autoWithdrawalThreshold?: number;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

const kycDocumentSchema = new Schema<IKYCDocument>({
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

const bankDetailsSchema = new Schema<IBankDetails>({
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

const kycSchema = new Schema<IKYC>(
  {
    userId: { 
      type: String, 
      required: true, 
      unique: true 
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
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    
    // Withdrawal Settings
    withdrawalSettings: {
      minimumAmount: { type: Number, default: 500 }, // ₹500 minimum
      maximumDailyAmount: { type: Number, default: 50000 }, // ₹50k daily limit
      maximumMonthlyAmount: { type: Number, default: 500000 }, // ₹5L monthly limit
      autoWithdrawalEnabled: { type: Boolean, default: false },
      autoWithdrawalThreshold: { type: Number }
    }
  },
  { timestamps: true }
);

// Create indexes
kycSchema.index({ userId: 1 });
kycSchema.index({ status: 1 });
kycSchema.index({ submittedAt: -1 });
kycSchema.index({ 'bankDetails.accountNumber': 1 });
kycSchema.index({ 'bankDetails.ifscCode': 1 });

// Export schema
export const KYCSchema = kycSchema;

// Model function
export function getKYCModel(): Model<IKYC> {
  if (typeof window === 'undefined') {
    return models.KYC || model<IKYC>('KYC', kycSchema);
  }
  return null as unknown as Model<IKYC>;
}

export const KYC = getKYCModel();
