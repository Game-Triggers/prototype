import { Schema, Model } from 'mongoose';
export declare enum KYCStatus {
    NOT_STARTED = "not_started",
    PENDING = "pending",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare enum DocumentType {
    PAN = "pan",
    AADHAAR = "aadhaar",
    BANK_STATEMENT = "bank_statement",
    CANCELLED_CHEQUE = "cancelled_cheque",
    PASSPORT = "passport",
    DRIVING_LICENSE = "driving_license"
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
    documents: IKYCDocument[];
    bankDetails: IBankDetails;
    verificationProvider?: string;
    verificationId?: string;
    verificationScore?: number;
    adminNotes?: string;
    reviewedBy?: string;
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
export declare const KYCSchema: Schema<IKYC, Model<IKYC, any, any, any, import("mongoose").Document<unknown, any, IKYC> & IKYC & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IKYC, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IKYC>> & import("mongoose").FlatRecord<IKYC> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare function getKYCModel(): Model<IKYC>;
export declare const KYC: Model<IKYC, {}, {}, {}, import("mongoose").Document<unknown, {}, IKYC> & IKYC & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
