import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';
import { PaymentMethod } from '@schemas/wallet.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId?: string;
    role?: UserRole;
    _id?: string;
  };
}

class CreatePaymentIntentDto {
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, string>;
}

class ConfirmPaymentDto {
  paymentIntentId: string;
}

class ProcessPayoutDto {
  amount: number;
  bankAccount: string;
  accountHolderName: string;
  currency?: string;
  metadata?: Record<string, string>;
}

class ProcessUPIPaymentDto {
  amount: number;
  upiId: string;
  metadata?: Record<string, string>;
}

class ProcessBankTransferDto {
  amount: number;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  metadata?: Record<string, string>;
}

/**
 * Payment Controller
 *
 * Handles payment processing operations including:
 * - Creating payment intents for wallet top-ups
 * - Confirming payments
 * - Processing payouts to streamers
 * - UPI payments
 * - Bank transfers
 */
@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create payment intent for wallet top-up
   */
  @Post('create-intent')
  @ApiOperation({
    summary: 'Create payment intent',
    description:
      'Create a payment intent for wallet top-up using various payment methods',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent created successfully',
    schema: {
      example: {
        clientSecret: 'pi_1234_secret_5678',
        paymentIntentId: 'pi_1234567890',
        amount: 1000.0,
        currency: 'inr',
      },
    },
  })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = req.user.userId || req.user._id;

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const metadata = {
        userId,
        ...createPaymentIntentDto.metadata,
      };

      return await this.paymentService.createPaymentIntent(
        createPaymentIntentDto.amount,
        createPaymentIntentDto.currency || 'inr',
        createPaymentIntentDto.paymentMethod,
        metadata,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Confirm payment
   */
  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm payment',
    description: 'Confirm and retrieve payment status',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmation result',
    schema: {
      example: {
        success: true,
        paymentIntentId: 'pi_1234567890',
        amount: 1000.0,
        currency: 'inr',
        status: 'completed',
      },
    },
  })
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    try {
      return await this.paymentService.confirmPayment(
        confirmPaymentDto.paymentIntentId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to confirm payment: ${error.message}`,
      );
    }
  }

  /**
   * Process payout (Admin/System only)
   */
  @Post('payout')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Process payout',
    description: 'Process payout to streamer bank account (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout processed successfully',
    schema: {
      example: {
        success: true,
        transferId: 'tr_1234567890',
        amount: 500.0,
        currency: 'inr',
        status: 'pending',
      },
    },
  })
  async processPayout(@Body() processPayoutDto: ProcessPayoutDto) {
    try {
      return await this.paymentService.processPayout(
        processPayoutDto.amount,
        processPayoutDto.bankAccount,
        processPayoutDto.accountHolderName,
        processPayoutDto.currency || 'inr',
        processPayoutDto.metadata,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to process payout: ${error.message}`,
      );
    }
  }

  /**
   * Process UPI payment
   */
  @Post('upi')
  @ApiOperation({
    summary: 'Process UPI payment',
    description: 'Process payment using UPI ID',
  })
  @ApiResponse({
    status: 200,
    description: 'UPI payment processed',
    schema: {
      example: {
        success: true,
        transactionId: 'UPI_1234567890',
        amount: 1000.0,
        status: 'completed',
        upiRef: 'UPI_REF_1234567890',
      },
    },
  })
  async processUPIPayment(
    @Body() processUPIPaymentDto: ProcessUPIPaymentDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      const userId = req.user.userId || req.user._id;

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const metadata = {
        userId,
        ...processUPIPaymentDto.metadata,
      };

      return await this.paymentService.processUPIPayment(
        processUPIPaymentDto.amount,
        processUPIPaymentDto.upiId,
        metadata,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to process UPI payment: ${error.message}`,
      );
    }
  }

  /**
   * Process bank transfer
   */
  @Post('bank-transfer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Process bank transfer',
    description: 'Process bank transfer for payouts (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank transfer processed',
    schema: {
      example: {
        success: true,
        transferId: 'BANK_1234567890',
        amount: 500.0,
        currency: 'inr',
        status: 'processing',
      },
    },
  })
  async processBankTransfer(
    @Body() processBankTransferDto: ProcessBankTransferDto,
  ) {
    try {
      return await this.paymentService.processBankTransfer(
        processBankTransferDto.amount,
        processBankTransferDto.bankDetails,
        processBankTransferDto.metadata,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to process bank transfer: ${error.message}`,
      );
    }
  }
}
