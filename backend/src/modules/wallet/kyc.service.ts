import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IKYC,
  KYCStatus,
  IBankDetails,
  IKYCDocument,
  DocumentType,
} from '@schemas/kyc.schema';

export interface KYCSubmissionDto {
  userId: string;
  fullName: string;
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phoneNumber: string;
  email: string;
  documents: {
    documentType: DocumentType;
    documentNumber: string;
    documentUrl: string;
  }[];
  bankDetails: BankDetailsDto;
}

export interface BankDetailsDto {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
  upiId?: string;
}

export interface KYCVerificationResult {
  success: boolean;
  status: KYCStatus;
  message: string;
  verificationData?: any;
}

@Injectable()
export class KYCService {
  constructor(@InjectModel('KYC') private readonly kycModel: Model<IKYC>) {}

  /**
   * Submit KYC documents for verification
   */
  async submitKYC(kycData: KYCSubmissionDto): Promise<IKYC> {
    try {
      // Check if KYC already exists for this user
      const existingKYC = await this.kycModel.findOne({
        userId: kycData.userId,
      });

      if (existingKYC && existingKYC.status === KYCStatus.APPROVED) {
        throw new BadRequestException('KYC already approved for this user');
      }

      // Basic validation
      this.validateKYCData(kycData);

      const kycRecord = existingKYC ? existingKYC : new this.kycModel();

      // Update KYC data
      kycRecord.userId = kycData.userId;
      kycRecord.fullName = kycData.fullName;
      kycRecord.dateOfBirth = kycData.dateOfBirth;
      kycRecord.address = kycData.address;
      kycRecord.phoneNumber = kycData.phoneNumber;
      kycRecord.email = kycData.email;

      // Process documents
      kycRecord.documents = kycData.documents.map(
        (doc) =>
          ({
            documentType: doc.documentType,
            documentNumber: doc.documentNumber,
            documentUrl: doc.documentUrl,
            verificationStatus: KYCStatus.PENDING,
          }) as IKYCDocument,
      );

      // Set bank details
      kycRecord.bankDetails = {
        accountNumber: kycData.bankDetails.accountNumber,
        ifscCode: kycData.bankDetails.ifscCode,
        accountHolderName: kycData.bankDetails.accountHolderName,
        bankName: kycData.bankDetails.bankName,
        branchName: kycData.bankDetails.branchName,
        accountType: kycData.bankDetails.accountType,
        upiId: kycData.bankDetails.upiId,
        isVerified: false,
      };

      kycRecord.status = KYCStatus.PENDING;
      kycRecord.submittedAt = new Date();

      const savedKYC = await kycRecord.save();

      // In a real implementation, trigger KYC verification process here
      this.initiateKYCVerification(savedKYC._id.toString());

      return savedKYC;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error submitting KYC:', error);
      throw new BadRequestException('Failed to submit KYC documents');
    }
  }

  /**
   * Update bank details
   */
  async updateBankDetails(
    userId: string,
    bankDetails: BankDetailsDto,
  ): Promise<IKYC> {
    try {
      const kyc = await this.kycModel.findOne({ userId });
      if (!kyc) {
        throw new NotFoundException(
          'KYC record not found. Please complete KYC first.',
        );
      }

      // Validate bank details
      this.validateBankDetails(bankDetails);

      // Update bank details
      kyc.bankDetails = {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName,
        branchName: bankDetails.branchName,
        accountType: bankDetails.accountType,
        upiId: bankDetails.upiId,
        isVerified: false,
      };

      const savedKYC = await kyc.save();

      // In a real implementation, verify bank details here
      this.initiateBankVerification(userId);

      return savedKYC;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating bank details:', error);
      throw new BadRequestException('Failed to update bank details');
    }
  }

  /**
   * Get KYC status for a user
   */
  async getKYCStatus(userId: string): Promise<IKYC | null> {
    return this.kycModel.findOne({ userId }).exec();
  }

  /**
   * Get all KYC records for admin review
   */
  async getAllKYCRecords(
    status?: KYCStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ records: IKYC[]; total: number; pages: number }> {
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.kycModel.find(filter).skip(skip).limit(limit).exec(),
      this.kycModel.countDocuments(filter).exec(),
    ]);

    return {
      records,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve KYC (Admin only)
   */
  async approveKYC(kycId: string, adminUserId: string): Promise<IKYC> {
    const kyc = await this.kycModel.findById(kycId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    kyc.status = KYCStatus.APPROVED;
    kyc.reviewedBy = adminUserId;
    kyc.reviewedAt = new Date();
    kyc.approvedAt = new Date();

    return kyc.save();
  }

  /**
   * Reject KYC (Admin only)
   */
  async rejectKYC(
    kycId: string,
    adminUserId: string,
    reason: string,
  ): Promise<IKYC> {
    const kyc = await this.kycModel.findById(kycId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    kyc.status = KYCStatus.REJECTED;
    kyc.reviewedBy = adminUserId;
    kyc.reviewedAt = new Date();
    kyc.rejectedAt = new Date();
    kyc.adminNotes = reason;

    return kyc.save();
  }

  /**
   * Check if user is eligible for withdrawals
   */
  async isEligibleForWithdrawal(userId: string): Promise<boolean> {
    const kyc = await this.kycModel.findOne({ userId });

    if (!kyc || kyc.status !== KYCStatus.APPROVED) {
      return false;
    }

    // Check if user has verified bank account
    return kyc.bankDetails?.isVerified || false;
  }

  /**
   * Get verified bank details for withdrawals
   */
  async getVerifiedBankDetails(userId: string): Promise<IBankDetails | null> {
    const kyc = await this.kycModel.findOne({ userId });
    if (!kyc || !kyc.bankDetails || !kyc.bankDetails.isVerified) {
      return null;
    }

    return kyc.bankDetails;
  }

  /**
   * Private helper methods
   */
  private validateKYCData(data: KYCSubmissionDto): void {
    // Basic required fields check
    if (
      !data.fullName ||
      !data.dateOfBirth ||
      !data.address ||
      !data.phoneNumber ||
      !data.email
    ) {
      throw new BadRequestException('Missing required fields');
    }

    // Age validation (must be 18+)
    const age =
      new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
    if (age < 18) {
      throw new BadRequestException('User must be at least 18 years old');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Document validation
    if (!data.documents || data.documents.length === 0) {
      throw new BadRequestException('At least one document is required');
    }

    // Validate bank details
    this.validateBankDetails(data.bankDetails);
  }

  private validateBankDetails(data: BankDetailsDto): void {
    // IFSC validation (basic format check)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(data.ifscCode)) {
      throw new BadRequestException('Invalid IFSC code format');
    }

    // Account number validation (basic check)
    if (
      !data.accountNumber ||
      data.accountNumber.length < 9 ||
      data.accountNumber.length > 18
    ) {
      throw new BadRequestException('Invalid account number');
    }

    // Required fields check
    if (!data.accountHolderName || !data.bankName) {
      throw new BadRequestException('Missing required bank details');
    }
  }

  /**
   * Initiate KYC verification with third-party service
   */
  private async initiateKYCVerification(kycId: string): Promise<void> {
    try {
      console.log(`Initiating KYC verification for record: ${kycId}`);

      // Simulate async verification process
      setTimeout(async () => {
        // Mock verification result (90% success rate)
        const isApproved = Math.random() > 0.1;

        const kyc = await this.kycModel.findById(kycId);
        if (kyc) {
          kyc.status = isApproved ? KYCStatus.APPROVED : KYCStatus.REJECTED;
          kyc.reviewedAt = new Date();
          if (isApproved) {
            kyc.approvedAt = new Date();
          } else {
            kyc.rejectedAt = new Date();
            kyc.adminNotes = 'Document verification failed';
          }
          await kyc.save();
        }
      }, 5000); // Simulate 5-second verification process
    } catch (error) {
      console.error('Error initiating KYC verification:', error);
    }
  }

  /**
   * Initiate bank account verification
   */
  private async initiateBankVerification(userId: string): Promise<void> {
    try {
      console.log(`Initiating bank verification for user: ${userId}`);

      // Mock verification process
      setTimeout(async () => {
        const kyc = await this.kycModel.findOne({ userId });
        if (kyc && kyc.bankDetails) {
          kyc.bankDetails.isVerified = true;
          kyc.bankDetails.verifiedAt = new Date();
          await kyc.save();
        }
      }, 3000); // Simulate 3-second verification
    } catch (error) {
      console.error('Error initiating bank verification:', error);
    }
  }
}
