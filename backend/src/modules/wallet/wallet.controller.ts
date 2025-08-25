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
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  RequireAnyPermission,
} from '../auth/decorators/permissions.decorator';
import { Permission } from '../../../../lib/eureka-roles';
import { UserRole } from '@schemas/user.schema';
import { TransactionType, PaymentMethod } from '@schemas/wallet.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId?: string;
    role?: UserRole;
    _id?: string;
  };
}

class AddFundsDto {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentGatewayTxnId: string;
}

class ReserveCampaignFundsDto {
  campaignId: string;
  amount: number;
}

class ChargeCampaignFundsDto {
  campaignId: string;
  amount: number;
  milestoneType: string;
}

class CreditEarningsDto {
  userId: string;
  campaignId: string;
  amount: number;
  holdDays?: number;
}

class WithdrawalRequestDto {
  amount: number;
}

/**
 * Wallet Controller
 *
 * Manages wallet operations for brands and streamers including:
 * - Wallet balance management
 * - Fund deposits and withdrawals
 * - Campaign budget reservations and charges
 * - Earnings credits and holds
 * - Transaction history and analytics
 */
@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Get wallet balance for authenticated user
   */
  @Get('balance')
  @ApiOperation({
    summary: 'Get wallet balance',
    description:
      'Retrieve current wallet balance, reserved balance, and withdrawable balance',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance information',
    schema: {
      example: {
        balance: 5000.0,
        reservedBalance: 1500.0,
        withdrawableBalance: 2800.0,
        totalEarnings: 15000.0,
        totalSpent: 8000.0,
      },
    },
  })
  async getBalance(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return await this.walletService.getWalletBalance(userId);
  }

  /**
   * Add funds to brand wallet
   */
  @Post('add-funds')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.UPLOAD_FUNDS)
  @ApiOperation({
    summary: 'Add funds to wallet',
    description: 'Add funds to brand wallet using various payment methods',
  })
  @ApiResponse({
    status: 201,
    description: 'Funds added successfully',
  })
  async addFunds(@Body() dto: AddFundsDto, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    const createdBy = userId;

    return await this.walletService.addFunds(
      userId,
      dto.amount,
      dto.paymentMethod,
      dto.paymentGatewayTxnId,
      createdBy,
    );
  }

  /**
   * Reserve funds for campaign activation
   */
  @Post('reserve-campaign-funds')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_BUDGET)
  @ApiOperation({
    summary: 'Reserve campaign funds',
    description: 'Reserve funds from wallet balance for campaign activation',
  })
  async reserveCampaignFunds(
    @Body() dto: ReserveCampaignFundsDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    const createdBy = userId;

    return await this.walletService.reserveCampaignFunds(
      userId,
      dto.campaignId,
      dto.amount,
      createdBy,
    );
  }

  /**
   * Charge campaign funds based on milestones
   */
  @Post('charge-campaign-funds')
  @UseGuards(PermissionsGuard)
  @RequireAnyPermission(Permission.MANAGE_BUDGET, Permission.PROCESS_PAYOUTS)
  @ApiOperation({
    summary: 'Charge campaign funds',
    description: 'Charge reserved funds based on campaign milestones',
  })
  async chargeCampaignFunds(
    @Body() dto: ChargeCampaignFundsDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    const createdBy = userId;

    return await this.walletService.chargeCampaignFunds(
      userId,
      dto.campaignId,
      dto.amount,
      dto.milestoneType,
      createdBy,
    );
  }

  /**
   * Credit earnings to streamer (admin only)
   */
  @Post('credit-earnings')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.PROCESS_PAYOUTS)
  @ApiOperation({
    summary: 'Credit earnings to streamer',
    description: 'Credit earnings to streamer wallet with hold period',
  })
  async creditEarnings(
    @Body() dto: CreditEarningsDto,
    @Req() req: RequestWithUser,
  ) {
    const createdBy = this.getUserId(req);

    return await this.walletService.creditEarnings(
      dto.userId,
      dto.campaignId,
      dto.amount,
      dto.holdDays || 3,
      createdBy,
    );
  }

  /**
   * Release earnings from hold
   */
  @Post('release-earnings/:transactionId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.PROCESS_PAYOUTS)
  @ApiOperation({
    summary: 'Release earnings from hold',
    description: 'Release earnings after campaign validation',
  })
  @ApiParam({ name: 'transactionId', description: 'Hold transaction ID' })
  async releaseEarnings(
    @Param('transactionId') transactionId: string,
    @Req() req: RequestWithUser,
  ) {
    const createdBy = this.getUserId(req);
    return await this.walletService.releaseEarnings(transactionId, createdBy);
  }

  /**
   * Request withdrawal (streamers only)
   */
  @Post('request-withdrawal')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_BILLING)
  @ApiOperation({
    summary: 'Request withdrawal',
    description: 'Request withdrawal of earnings to bank account',
  })
  async requestWithdrawal(
    @Body() dto: WithdrawalRequestDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    const createdBy = userId;

    return await this.walletService.requestWithdrawal(
      userId,
      dto.amount,
      createdBy,
    );
  }

  /**
   * Get transaction history
   */
  @Get('transactions')
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Retrieve wallet transaction history with pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of transactions to skip',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filter by transaction type',
  })
  async getTransactionHistory(
    @Req() req: RequestWithUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('type') type?: TransactionType,
  ) {
    const userId = this.getUserId(req);

    return await this.walletService.getTransactionHistory(
      userId,
      limit || 50,
      offset || 0,
      type,
    );
  }

  /**
   * Get wallet analytics
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get wallet analytics',
    description: 'Retrieve wallet analytics for specified time period',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days for analytics',
  })
  async getWalletAnalytics(
    @Req() req: RequestWithUser,
    @Query('days') days?: number,
  ) {
    const userId = this.getUserId(req);
    return await this.walletService.getWalletAnalytics(userId, days || 30);
  }

  /**
   * Check auto top-up eligibility
   */
  @Get('auto-topup-check')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_BUDGET)
  @ApiOperation({
    summary: 'Check auto top-up eligibility',
    description: 'Check if wallet is eligible for auto top-up',
  })
  async checkAutoTopup(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    const shouldTopup = await this.walletService.checkAutoTopup(userId);

    return { shouldTopup };
  }

  /**
   * Get transaction by ID (admin only)
   */
  @Get('transactions/:transactionId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_BILLING)
  @ApiOperation({
    summary: 'Get transaction details',
    description: 'Get detailed information about a specific transaction',
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  async getTransactionById(@Param('transactionId') transactionId: string) {
    // Implementation would go here - get transaction details
    // This is a placeholder for the full implementation
    return { message: 'Transaction details endpoint - to be implemented' };
  }

  /**
   * Get user ID from request safely
   */
  private getUserId(req: RequestWithUser): string {
    if (req.user?.userId) {
      return req.user.userId;
    } else if (req.user?._id) {
      return req.user._id.toString();
    } else {
      throw new BadRequestException('User ID not found in request');
    }
  }
}
