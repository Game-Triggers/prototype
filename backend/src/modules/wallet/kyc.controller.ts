import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { KYCService, KYCSubmissionDto, BankDetailsDto } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';
import { KYCStatus } from '@schemas/kyc.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId?: string;
    role?: UserRole;
    _id?: string;
  };
}

class ApproveKYCDto {
  adminUserId: string;
}

class RejectKYCDto {
  adminUserId: string;
  reason: string;
}

/**
 * KYC Controller
 *
 * Handles KYC verification operations including:
 * - KYC document submission
 * - Bank details management
 * - KYC status checking
 * - Admin KYC review and approval
 */
@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KYCController {
  constructor(private readonly kycService: KYCService) {}

  /**
   * Submit KYC documents
   */
  @Post('submit')
  @ApiOperation({
    summary: 'Submit KYC documents',
    description: 'Submit KYC documents and bank details for verification',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC documents submitted successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        status: 'pending',
        fullName: 'John Doe',
        submittedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async submitKYC(
    @Body() kycSubmissionDto: KYCSubmissionDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = req.user.userId || req.user._id;
      kycSubmissionDto.userId = userId!;

      return await this.kycService.submitKYC(kycSubmissionDto);
    } catch (error) {
      throw new BadRequestException(`Failed to submit KYC: ${error.message}`);
    }
  }

  /**
   * Update bank details
   */
  @Put('bank-details')
  @ApiOperation({
    summary: 'Update bank details',
    description: 'Update or add bank details for KYC record',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank details updated successfully',
  })
  async updateBankDetails(
    @Body() bankDetailsDto: BankDetailsDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = req.user.userId || req.user._id;

      return await this.kycService.updateBankDetails(userId!, bankDetailsDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update bank details: ${error.message}`,
      );
    }
  }

  /**
   * Get KYC status for current user
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get KYC status',
    description: 'Get KYC status and details for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC status retrieved successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        status: 'approved',
        fullName: 'John Doe',
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          accountHolderName: 'John Doe',
          bankName: 'State Bank of India',
          isVerified: true,
        },
      },
    },
  })
  async getKYCStatus(@Req() req: RequestWithUser) {
    try {
      const userId = req.user.userId || req.user._id;

      const kyc = await this.kycService.getKYCStatus(userId!);
      if (!kyc) {
        throw new NotFoundException('KYC record not found');
      }

      return kyc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get KYC status: ${error.message}`,
      );
    }
  }

  /**
   * Check withdrawal eligibility
   */
  @Get('withdrawal-eligibility')
  @ApiOperation({
    summary: 'Check withdrawal eligibility',
    description:
      'Check if user is eligible for withdrawals based on KYC status',
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal eligibility checked',
    schema: {
      example: {
        eligible: true,
        reason: 'KYC approved and bank details verified',
      },
    },
  })
  async checkWithdrawalEligibility(@Req() req: RequestWithUser) {
    try {
      const userId = req.user.userId || req.user._id;

      const isEligible = await this.kycService.isEligibleForWithdrawal(userId!);

      return {
        eligible: isEligible,
        reason: isEligible
          ? 'KYC approved and bank details verified'
          : 'KYC not approved or bank details not verified',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to check withdrawal eligibility: ${error.message}`,
      );
    }
  }

  /**
   * Get verified bank details
   */
  @Get('bank-details')
  @ApiOperation({
    summary: 'Get verified bank details',
    description: 'Get verified bank details for withdrawals',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank details retrieved successfully',
  })
  async getVerifiedBankDetails(@Req() req: RequestWithUser) {
    try {
      const userId = req.user.userId || req.user._id;

      const bankDetails = await this.kycService.getVerifiedBankDetails(userId!);
      if (!bankDetails) {
        throw new NotFoundException('No verified bank details found');
      }

      return bankDetails;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get bank details: ${error.message}`,
      );
    }
  }

  /**
   * Admin: Get all KYC records
   */
  @Get('admin/records')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all KYC records (Admin)',
    description: 'Get all KYC records for admin review',
  })
  @ApiQuery({ name: 'status', required: false, enum: KYCStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'KYC records retrieved successfully',
    schema: {
      example: {
        records: [],
        total: 10,
        pages: 1,
      },
    },
  })
  async getAllKYCRecords(
    @Query('status') status?: KYCStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.kycService.getAllKYCRecords(
        status,
        page || 1,
        limit || 20,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to get KYC records: ${error.message}`,
      );
    }
  }

  /**
   * Admin: Approve KYC
   */
  @Post('admin/:kycId/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve KYC (Admin)',
    description: 'Approve KYC record (Admin only)',
  })
  @ApiParam({ name: 'kycId', description: 'KYC record ID' })
  @ApiResponse({
    status: 200,
    description: 'KYC approved successfully',
  })
  async approveKYC(
    @Param('kycId') kycId: string,
    @Body() approveKYCDto: ApproveKYCDto,
  ) {
    try {
      return await this.kycService.approveKYC(kycId, approveKYCDto.adminUserId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to approve KYC: ${error.message}`);
    }
  }

  /**
   * Admin: Reject KYC
   */
  @Post('admin/:kycId/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject KYC (Admin)',
    description: 'Reject KYC record with reason (Admin only)',
  })
  @ApiParam({ name: 'kycId', description: 'KYC record ID' })
  @ApiResponse({
    status: 200,
    description: 'KYC rejected successfully',
  })
  async rejectKYC(
    @Param('kycId') kycId: string,
    @Body() rejectKYCDto: RejectKYCDto,
  ) {
    try {
      return await this.kycService.rejectKYC(
        kycId,
        rejectKYCDto.adminUserId,
        rejectKYCDto.reason,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to reject KYC: ${error.message}`);
    }
  }
}
