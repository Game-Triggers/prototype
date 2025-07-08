import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminWalletService } from '../wallet/admin-wallet.service';
import { AdminCampaignService } from '../wallet/admin-campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@schemas/user.schema';
import { Request } from 'express';
import { Types } from 'mongoose';

// Define RequestWithUser interface for type safety
interface RequestWithUser extends Request {
  user: {
    _id?: Types.ObjectId;
    userId?: string;
    user?: any & { _id?: Types.ObjectId };
    [key: string]: any;
  };
}

@ApiTags('Admin Operations')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminWalletService: AdminWalletService,
    private readonly adminCampaignService: AdminCampaignService,
  ) {}

  private getUserId(req: RequestWithUser): string {
    return (
      req.user._id?.toString() ||
      req.user.userId ||
      req.user.user?._id?.toString()
    );
  }

  // =====================
  // WALLET MANAGEMENT
  // =====================

  /**
   * Admin adjusts user wallet balance
   */
  @Post('wallets/:userId/adjust')
  @ApiOperation({ summary: 'Admin adjusts user wallet balance' })
  @ApiParam({ name: 'userId', description: 'User ID to adjust wallet for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description:
            'Adjustment amount (positive to add, negative to subtract)',
          example: 1000,
        },
        reason: {
          type: 'string',
          description: 'Reason for adjustment',
          example: 'Compensation for platform error',
        },
      },
      required: ['amount', 'reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance adjusted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async adjustWalletBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason: string },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminWalletService.adjustWalletBalance(
      userId,
      body.amount,
      body.reason,
      adminId,
    );
  }

  /**
   * Admin freezes user wallet
   */
  @Post('wallets/:userId/freeze')
  @ApiOperation({ summary: 'Admin freezes user wallet' })
  @ApiParam({ name: 'userId', description: 'User ID to freeze wallet for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for freezing wallet',
          example: 'Fraud investigation',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Wallet frozen successfully' })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async freezeWallet(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminWalletService.freezeWallet(userId, body.reason, adminId);
  }

  /**
   * Admin unfreezes user wallet
   */
  @Post('wallets/:userId/unfreeze')
  @ApiOperation({ summary: 'Admin unfreezes user wallet' })
  @ApiParam({ name: 'userId', description: 'User ID to unfreeze wallet for' })
  @ApiResponse({ status: 200, description: 'Wallet unfrozen successfully' })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async unfreezeWallet(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminWalletService.unfreezeWallet(userId, adminId);
  }

  /**
   * Admin gets detailed wallet information
   */
  @Get('wallets/:userId/details')
  @ApiOperation({ summary: 'Admin gets detailed wallet information' })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get wallet details for',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async getWalletDetails(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminWalletService.getWalletDetails(userId, adminId);
  }

  // =====================
  // CAMPAIGN MANAGEMENT
  // =====================

  /**
   * Admin force completes a campaign
   */
  @Post('campaigns/:campaignId/force-complete')
  @ApiOperation({ summary: 'Admin force completes a campaign' })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID to force complete',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for force completion',
          example: 'Policy violation detected',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign force completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async forceCampaignCompletion(
    @Param('campaignId') campaignId: string,
    @Body() body: { reason: string },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminCampaignService.forceCampaignCompletion(
      campaignId,
      adminId,
      body.reason,
    );
  }

  /**
   * Admin force cancels a campaign
   */
  @Post('campaigns/:campaignId/force-cancel')
  @ApiOperation({ summary: 'Admin force cancels a campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID to force cancel' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for force cancellation',
          example: 'Policy violation',
        },
        refundFunds: {
          type: 'boolean',
          description: 'Whether to refund funds to brand',
          default: true,
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign force cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async forceCampaignCancellation(
    @Param('campaignId') campaignId: string,
    @Body() body: { reason: string; refundFunds?: boolean },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminCampaignService.forceCampaignCancellation(
      campaignId,
      adminId,
      body.reason,
      body.refundFunds !== false,
    );
  }

  /**
   * Admin overrides campaign budget
   */
  @Put('campaigns/:campaignId/override-budget')
  @ApiOperation({ summary: 'Admin overrides campaign budget' })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID to override budget for',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newBudget: {
          type: 'number',
          description: 'New budget amount',
          example: 50000,
        },
        reason: {
          type: 'string',
          description: 'Reason for budget override',
          example: 'Platform compensation for technical issues',
        },
      },
      required: ['newBudget', 'reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign budget overridden successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async overrideCampaignBudget(
    @Param('campaignId') campaignId: string,
    @Body() body: { newBudget: number; reason: string },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminCampaignService.overrideCampaignBudget(
      campaignId,
      body.newBudget,
      adminId,
      body.reason,
    );
  }

  /**
   * Admin emergency campaign control
   */
  @Post('campaigns/:campaignId/emergency-control')
  @ApiOperation({ summary: 'Admin emergency campaign control' })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID for emergency control',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['activate', 'deactivate', 'suspend'],
          description: 'Emergency action to take',
        },
        reason: {
          type: 'string',
          description: 'Reason for emergency action',
          example: 'Emergency content removal required',
        },
      },
      required: ['action', 'reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Emergency control applied successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async emergencyCampaignControl(
    @Param('campaignId') campaignId: string,
    @Body()
    body: { action: 'activate' | 'deactivate' | 'suspend'; reason: string },
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminCampaignService.emergencyCampaignControl(
      campaignId,
      body.action,
      adminId,
      body.reason,
    );
  }

  /**
   * Admin gets campaign financial overview
   */
  @Get('campaigns/:campaignId/financial-overview')
  @ApiOperation({ summary: 'Admin gets campaign financial overview' })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID to get overview for',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial overview retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignFinancialOverview(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    const adminId = this.getUserId(req);
    return this.adminCampaignService.getCampaignFinancialOverview(
      campaignId,
      adminId,
    );
  }

  // =====================
  // PLATFORM ANALYTICS
  // =====================

  /**
   * Admin gets platform financial dashboard
   */
  @Get('dashboard/financial')
  @ApiOperation({ summary: 'Admin gets platform financial dashboard' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (7d, 30d, 90d)',
    example: '30d',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial dashboard data retrieved successfully',
  })
  async getFinancialDashboard(
    @Query('period') period: string = '30d',
    @Req() req: RequestWithUser,
  ) {
    // This would integrate with analytics service once implemented
    return {
      message: 'Financial dashboard - implementation pending',
      period,
      timestamp: new Date(),
    };
  }

  /**
   * Admin gets audit report
   */
  @Get('reports/audit')
  @ApiOperation({ summary: 'Admin gets audit report' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for audit report',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for audit report',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Report type (transactions, campaigns, users)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit report generated successfully',
  })
  async generateAuditReport(
    @Req() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    // This would integrate with reporting service once implemented
    return {
      message: 'Audit report generation - implementation pending',
      parameters: { startDate, endDate, type },
      timestamp: new Date(),
    };
  }
}
