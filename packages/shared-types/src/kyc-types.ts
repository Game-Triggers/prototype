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