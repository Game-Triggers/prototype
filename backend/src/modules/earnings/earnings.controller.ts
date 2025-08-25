import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  RequireAnyPermission,
} from '../auth/decorators/permissions.decorator';
import { Permission } from '../../../../lib/eureka-roles';
import { UserRole, IUser } from '@schemas/user.schema';
import { Request } from 'express';
import { Types } from 'mongoose';

// Define RequestWithUser interface for type safety considering JWT strategy structure
interface RequestWithUser extends Request {
  user: {
    userId?: string; // From JWT strategy
    role?: UserRole;
    email?: string;
    user?: IUser & { _id?: Types.ObjectId }; // Nested user object from JWT strategy
    _id?: Types.ObjectId; // For backward compatibility
  };
}

/**
 * Earnings Controller
 *
 * Manages financial operations related to streamer earnings from campaign participation.
 * This controller provides endpoints for retrieving earnings information, payment history,
 * and detailed earnings breakdowns for streamers based on their campaign performance.
 *
 * Key features:
 * - Retrieving earnings summaries and detailed reports
 * - Accessing historical payment data
 * - Breaking down earnings by campaign, time period, and performance metrics
 * - Managing payment status and verification
 *
 * Used by: Primarily streamers to track their income, and administrators to monitor platform finances
 */
@ApiTags('Earnings')
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  /**
   * Get earnings summary for the authenticated streamer
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get earnings summary',
    description: 'Returns summary of earnings for the authenticated streamer',
  })
  @ApiResponse({
    status: 200,
    description: 'Earnings summary data',
    schema: {
      example: {
        totalEarnings: 1250.75,
        pendingEarnings: 350.25,
        paidEarnings: 900.5,
        monthlyEarnings: {
          'Jan 2025': 250.0,
          'Feb 2025': 300.5,
          'Mar 2025': 400.25,
        },
        earningsByCampaign: [
          {
            campaignId: '61f8d3c97e1d2a001f9a5e8c',
            campaignTitle: 'Summer Gaming Promotion',
            earnings: 450.75,
            impressions: 15000,
            clicks: 750,
          },
          {
            campaignId: '61f9e4d87e1d2a001f9a5e8d',
            campaignTitle: 'Tech Hardware Launch',
            earnings: 800.0,
            impressions: 25000,
            clicks: 1250,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Streamer role required',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_BILLING)
  async getMyEarningsSummary(@Req() req: RequestWithUser) {
    // Handle different possible locations of the user ID based on JWT strategy
    let userId: string;

    if (req.user._id) {
      userId = req.user._id.toString();
    } else if (req.user.userId) {
      userId = req.user.userId;
    } else if (req.user.user && req.user.user._id) {
      userId = req.user.user._id.toString();
    } else {
      throw new Error('User ID not found in request');
    }

    return this.earningsService.getStreamerEarningsSummary(userId);
  }

  /**
   * Get earnings summary for a specific streamer (admin only)
   */
  @Get('summary/:streamerId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_BILLING)
  async getStreamerEarningsSummary(@Param('streamerId') streamerId: string) {
    return this.earningsService.getStreamerEarningsSummary(streamerId);
  }

  /**
   * Get earnings for a specific campaign the streamer participates in
   */
  @Get('campaign/:campaignId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequireAnyPermission(Permission.VIEW_BILLING, Permission.VIEW_ANALYTICS)
  async getCampaignEarnings(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    // If streamer role, verify they are part of the campaign
    if (req.user.role === UserRole.STREAMER) {
      // Get user ID safely
      let userId: string;

      if (req.user._id) {
        userId = req.user._id.toString();
      } else if (req.user.userId) {
        userId = req.user.userId;
      } else if (req.user.user && req.user.user._id) {
        userId = req.user.user._id.toString();
      } else {
        throw new Error('User ID not found in request');
      }

      // Get earnings for the specific campaign this streamer is part of
      const earningsByCampaign =
        await this.earningsService.getStreamerEarningsSummary(userId);

      // Handle campaign earnings safely
      const campaignEarnings = earningsByCampaign.earningsByCampaign?.find(
        (item: any) => item.campaignId?.toString() === campaignId,
      );

      if (!campaignEarnings) {
        throw new ForbiddenException(
          'You are not participating in this campaign',
        );
      }

      return campaignEarnings;
    }

    // For admins, return all earnings for this campaign across all streamers
    // This would require a different method which we would implement in the earnings service
    // For now, let's throw an error since this method needs to be implemented
    throw new Error('Admin campaign earnings view not implemented yet');
  }
}
