import { Controller, Get, UseGuards, Param, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, IUser } from '@schemas/user.schema';
import {
  AnalyticsQueryDto,
  CampaignAnalyticsDto,
  StreamerAnalyticsDto,
  BrandAnalyticsDto,
} from './dto/analytics.dto';
import { Request } from 'express';
import { Types } from 'mongoose';

// Define RequestWithUser interface for type safety
interface RequestWithUser extends Request {
  user: {
    userId?: string;
    email?: string;
    role?: UserRole;
    user?: IUser & { _id?: Types.ObjectId };
  };
}

/**
 * Analytics Controller
 *
 * Provides endpoints for retrieving analytics data related to campaigns, streamers,
 * and overall platform performance. This includes dashboard data, campaign-specific metrics,
 * streamer performance statistics, and advanced analytics reports.
 *
 * Used by: Both streamers and brands to track performance metrics and ROI.
 */
@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get user dashboard analytics',
    description:
      "Retrieve analytics data for the user's dashboard based on their role",
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics data',
    schema: {
      example: {
        impressions: {
          total: 10000,
          last7Days: 2500,
          last30Days: 8500,
          trend: 0.15,
        },
        clicks: {
          total: 1200,
          last7Days: 350,
          last30Days: 980,
          trend: 0.25,
        },
        earnings: {
          total: 1500.5,
          last7Days: 450.25,
          last30Days: 1200.75,
          trend: 0.1,
        },
        campaigns: {
          total: 15,
          active: 8,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getDashboardData(@Req() req: RequestWithUser) {
    try {
      console.log('User object from JWT:', JSON.stringify(req.user));

      // Extract userId based on the structure we see in the JWT strategy
      const userId = req.user.userId;

      // Determine role - from user object if present, otherwise from the top-level role
      let role = req.user.role;

      // If we have a user object from the database, use that information
      if (req.user.user) {
        role = req.user.user.role;
      }

      // Handle case where userId or role might be undefined
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      if (!role) {
        throw new Error('User role not found in request');
      }

      console.log(
        `Analytics dashboard: Using userId: ${userId} and role: ${role}`,
      );

      return await this.analyticsService.getDashboardData(userId, role);
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      throw error;
    }
  }

  @Get('campaign/:id')
  @UseGuards(JwtAuthGuard)
  async getCampaignAnalytics(
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      // Extract userId and role consistently
      const userId = req.user.userId;
      let role = req.user.role;

      if (req.user.user) {
        role = req.user.user.role;
      }

      // Normalize user object to match what the service expects
      const userObject = {
        userId,
        role,
        _id: userId,
      };

      return this.analyticsService.getCampaignAnalytics(id, query, userObject);
    } catch (error) {
      console.error('Error in getCampaignAnalytics:', error);
      throw error;
    }
  }

  @Get('streamer/:id')
  @UseGuards(JwtAuthGuard)
  async getStreamerAnalytics(
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      // Extract userId and role consistently
      const userId = req.user.userId;
      let role = req.user.role;

      if (req.user.user) {
        role = req.user.user.role;
      }

      // Normalize user object to match what the service expects
      const userObject = {
        userId,
        role,
        _id: userId,
      };

      return this.analyticsService.getStreamerAnalytics(id, query, userObject);
    } catch (error) {
      console.error('Error in getStreamerAnalytics:', error);
      throw error;
    }
  }

  @Get('brand/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  async getBrandAnalytics(
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      // Extract userId and role consistently
      const userId = req.user.userId;
      let role = req.user.role;

      if (req.user.user) {
        role = req.user.user.role;
      }

      // Normalize user object to match what the service expects
      const userObject = {
        userId,
        role,
        _id: userId,
      };

      return this.analyticsService.getBrandAnalytics(id, query, userObject);
    } catch (error) {
      console.error('Error in getBrandAnalytics:', error);
      throw error;
    }
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPlatformOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPlatformOverview(query);
  }

  @Get('campaigns/top')
  @UseGuards(JwtAuthGuard)
  async getTopPerformingCampaigns(
    @Query() query: AnalyticsQueryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      // Extract userId and role consistently
      const userId = req.user.userId;
      let role = req.user.role;

      if (req.user.user) {
        role = req.user.user.role;
      }

      // Normalize user object to match what the service expects
      const userObject = {
        userId,
        role,
        _id: userId,
      };

      return this.analyticsService.getTopPerformingCampaigns(query, userObject);
    } catch (error) {
      console.error('Error in getTopPerformingCampaigns:', error);
      throw error;
    }
  }

  @Get('streamers/top')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  async getTopPerformingStreamers(
    @Query() query: AnalyticsQueryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      // Extract userId and role consistently
      const userId = req.user.userId;
      let role = req.user.role;

      if (req.user.user) {
        role = req.user.user.role;
      }

      // Normalize user object to match what the service expects
      const userObject = {
        userId,
        role,
        _id: userId,
      };

      return this.analyticsService.getTopPerformingStreamers(query, userObject);
    } catch (error) {
      console.error('Error in getTopPerformingStreamers:', error);
      throw error;
    }
  }

  @Get('advanced')
  @UseGuards(JwtAuthGuard)
  async getAdvancedAnalytics(@Req() req: RequestWithUser, @Query() query: any) {
    try {
      // Extract userId based on the structure we see in the JWT strategy
      const userId = req.user.userId;

      // Determine role - from user object if present, otherwise from the top-level role
      let role = req.user.role;

      // If we have a user object from the database, use that information
      if (req.user.user) {
        role = req.user.user.role;
      }

      // Handle case where userId or role might be undefined
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      // Default to STREAMER role if no role is specified
      const userRole = role || UserRole.STREAMER;

      return this.analyticsService.getAdvancedAnalytics(
        userId,
        userRole,
        query,
      );
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      throw error;
    }
  }
}
