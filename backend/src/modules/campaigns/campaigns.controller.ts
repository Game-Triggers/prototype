import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
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
import { CampaignsService } from './campaigns.service';
import { CampaignCompletionService } from './campaign-completion.service';
import { CampaignCompletionTaskService } from './campaign-completion-task.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignFilterDto,
  JoinCampaignDto,
} from './dto/campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, IUser } from '@schemas/user.schema';
import { Request } from 'express';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

// Define RequestWithUser interface for type safety
interface RequestWithUser extends Request {
  user: {
    _id?: Types.ObjectId;
    userId?: string;
    user?: IUser & { _id?: Types.ObjectId };
    [key: string]: any; // Allow for other properties
  };
}

/**
 * Campaigns Controller
 *
 * Manages all campaign-related operations in the Instreamly platform. This includes
 * creation, retrieval, updating, and deletion of campaigns, as well as managing
 * streamer participation in campaigns.
 *
 * The controller handles different endpoints for brands (campaign creators) and streamers
 * (campaign participants) with appropriate role-based access control.
 *
 * Used by:
 * - Brands to create and manage advertising campaigns
 * - Streamers to browse, join, and manage their participation in campaigns
 * - Admin users to oversee all platform campaigns
 */
@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly campaignCompletionService: CampaignCompletionService,
    private readonly campaignCompletionTaskService: CampaignCompletionTaskService,
  ) {
    // Force instantiation of task service
    console.log(
      '=== CampaignsController constructor - Task service injected:',
      this.campaignCompletionTaskService.constructor.name,
    );
  }

  /**
   * Helper method to extract user ID from request with various JWT token structures
   */
  private getUserId(req: RequestWithUser): string {
    // Try to extract the user ID from different possible locations in the request
    let userId: string | undefined;

    if (req.user.userId) {
      userId = req.user.userId;
    } else if (req.user._id) {
      userId = req.user._id.toString();
    } else if (req.user.user?._id) {
      userId = req.user.user._id.toString();
    }

    // Safety check
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return userId;
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new campaign',
    description: 'Create a new advertising campaign (Brand role required)',
  })
  @ApiBody({ type: CreateCampaignDto })
  @ApiResponse({
    status: 201,
    description: 'Campaign successfully created',
    schema: {
      example: {
        id: '61f8d3c97e1d2a001f9a5e8c',
        title: 'Summer Gaming Promotion',
        description: 'Promote our new gaming products during your streams',
        brandId: '60d21b4667d0d8992e610c85',
        budget: 1000,
        mediaUrl: 'https://example.com/media/campaign123.mp4',
        mediaType: 'video',
        status: 'active',
        categories: ['Gaming', 'Technology'],
        createdAt: '2025-06-25T12:00:00.000Z',
        updatedAt: '2025-06-25T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Must be a brand to create campaigns',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    return this.campaignsService.create(createCampaignDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all campaigns',
    description: 'Retrieve all campaigns with optional filtering',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'paused', 'completed'],
    description: 'Filter campaigns by status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter campaigns by category',
  })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns',
    schema: {
      type: 'array',
      items: {
        example: {
          id: '61f8d3c97e1d2a001f9a5e8c',
          title: 'Summer Gaming Promotion',
          brandId: '60d21b4667d0d8992e610c85',
          status: 'active',
          budget: 1000,
          mediaUrl: 'https://example.com/media/campaign123.mp4',
          mediaType: 'video',
        },
      },
    },
  })
  async findAll(@Query() filterDto: CampaignFilterDto) {
    return this.campaignsService.findAll(filterDto);
  }

  @Get('brand')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  async findBrandCampaigns(
    @Req() req: RequestWithUser,
    @Query() filterDto: CampaignFilterDto,
  ) {
    const userId = this.getUserId(req);
    return this.campaignsService.findBrandCampaigns(userId, filterDto);
  }

  @Get('streamer/available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  async findAvailableCampaigns(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.campaignsService.findAvailableCampaigns(userId);
  }

  @Get('streamer/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  async findStreamerCampaigns(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.campaignsService.findStreamerCampaigns(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('adminAccess') adminAccess?: string,
    @Req() req?: RequestWithUser,
  ) {
    // For admin access, skip ownership checks
    if (adminAccess === 'true' && req?.user?.user?.role === UserRole.ADMIN) {
      return this.campaignsService.findOne(id);
    }

    // Regular access - could add ownership checks here if needed
    return this.campaignsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    return this.campaignsService.update(id, updateCampaignDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.campaignsService.remove(id, userId);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  async joinCampaign(
    @Body() joinCampaignDto: JoinCampaignDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    return this.campaignsService.joinCampaign({
      ...joinCampaignDto,
      streamerId: userId, // This will always be a string due to getUserId's return type
    });
  }

  @Delete('leave/:campaignId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  async leaveCampaign(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    return this.campaignsService.leaveCampaign(campaignId, userId);
  }

  @Post('impression/:token')
  async recordImpression(@Param('token') token: string) {
    return this.campaignsService.recordImpression(token);
  }

  @Post('click/:token')
  async recordClick(@Param('token') token: string) {
    return this.campaignsService.recordClick(token);
  }

  /**
   * Activate a draft campaign
   */
  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a draft campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign activated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not campaign owner' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiBearerAuth()
  async activateCampaign(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.campaignsService.activateCampaign(id, userId);
  }

  /**
   * Pause an active campaign
   */
  @Post(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  @ApiOperation({ summary: 'Pause an active campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not campaign owner' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiBearerAuth()
  async pauseCampaign(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.campaignsService.pauseCampaign(id, userId);
  }

  /**
   * Resume a paused campaign
   */
  @Post(':id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resume a paused campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign resumed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not campaign owner' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiBearerAuth()
  async resumeCampaign(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.campaignsService.resumeCampaign(id, userId);
  }

  /**
   * Streamer leaves campaign early
   */
  @Post(':campaignId/leave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  @ApiOperation({ summary: 'Streamer leaves campaign early' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Left campaign successfully, earnings released',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Active participation not found' })
  @ApiBearerAuth()
  async leaveCampaignEarly(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    const streamerId = this.getUserId(req);
    return this.campaignsService.leaveCampaignEarly(campaignId, streamerId);
  }

  /**
   * Streamer pauses participation
   */
  @Post(':campaignId/pause-participation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  @ApiOperation({ summary: 'Streamer pauses campaign participation' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Participation paused successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Active participation not found' })
  @ApiBearerAuth()
  async pauseParticipation(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    const streamerId = this.getUserId(req);
    return this.campaignsService.pauseParticipation(campaignId, streamerId);
  }

  /**
   * Streamer resumes participation
   */
  @Post(':campaignId/resume-participation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  @ApiOperation({ summary: 'Streamer resumes campaign participation' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Participation resumed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Paused participation not found' })
  @ApiBearerAuth()
  async resumeParticipation(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    const streamerId = this.getUserId(req);
    return this.campaignsService.resumeParticipation(campaignId, streamerId);
  }

  /**
   * Admin/Brand removes streamer from campaign
   */
  @Delete(':campaignId/streamers/:streamerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND)
  @ApiOperation({ summary: 'Remove streamer from campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiParam({ name: 'streamerId', description: 'Streamer ID to remove' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['violation', 'fraud', 'admin_decision', 'brand_decision'],
          description: 'Reason for removal',
        },
        forfeitEarnings: {
          type: 'boolean',
          description: 'Whether to forfeit held earnings',
          default: false,
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Streamer removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Participation not found' })
  @ApiBearerAuth()
  async removeStreamerFromCampaign(
    @Param('campaignId') campaignId: string,
    @Param('streamerId') streamerId: string,
    @Body()
    body: {
      reason: 'violation' | 'fraud' | 'admin_decision' | 'brand_decision';
      forfeitEarnings?: boolean;
    },
    @Req() req: RequestWithUser,
  ) {
    const removedBy = this.getUserId(req);
    return this.campaignsService.removeStreamerFromCampaign(
      campaignId,
      streamerId,
      removedBy,
      body.reason,
      body.forfeitEarnings || false,
    );
  }

  /**
   * Get campaign completion status
   */
  @Get(':campaignId/completion-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get campaign completion status',
    description:
      'Retrieve detailed completion criteria and current status for a campaign',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign completion status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
        },
        isEligibleForCompletion: { type: 'boolean' },
        completionReason: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            totalImpressions: { type: 'number' },
            totalClicks: { type: 'number' },
            activeParticipants: { type: 'number' },
            budgetUsedPercentage: { type: 'string' },
            remainingBudget: { type: 'number' },
          },
        },
        criteria: {
          type: 'object',
          properties: {
            impressionTarget: { type: 'number' },
            budgetThreshold: { type: 'number' },
          },
        },
        lastChecked: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiBearerAuth()
  async getCampaignCompletionStatus(@Param('campaignId') campaignId: string) {
    return this.campaignCompletionService.getCampaignCompletionStatus(
      campaignId,
    );
  }

  /**
   * Manually trigger campaign completion check (Admin only)
   */
  @Post('completion-check/trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manually trigger campaign completion check',
    description:
      'Trigger an immediate check of all campaigns for completion criteria (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign completion check triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiBearerAuth()
  async triggerCampaignCompletionCheck() {
    return this.campaignCompletionTaskService.triggerManualCheck();
  }

  /**
   * Check specific campaign for completion (Admin/Brand only)
   */
  @Post(':campaignId/completion-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND)
  @ApiOperation({
    summary: 'Check specific campaign for completion',
    description:
      'Check if a specific campaign meets completion criteria and mark it complete if applicable',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign completion check completed',
    schema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string' },
        wasCompleted: { type: 'boolean' },
        reason: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiBearerAuth()
  async checkCampaignCompletion(@Param('campaignId') campaignId: string) {
    const wasCompleted =
      await this.campaignCompletionService.checkCampaignCompletion(campaignId);

    if (wasCompleted) {
      const status =
        await this.campaignCompletionService.getCampaignCompletionStatus(
          campaignId,
        );
      return {
        campaignId,
        wasCompleted: true,
        reason: status.completionReason || 'Campaign marked as completed',
      };
    }

    return {
      campaignId,
      wasCompleted: false,
      reason: 'Campaign does not meet completion criteria',
    };
  }

  /**
   * Debug endpoint to check campaign impression data (NO AUTH for testing)
   */
  @Get(':campaignId/debug-impressions')
  @ApiOperation({
    summary: 'Debug campaign impression data',
    description:
      'Get detailed impression data for debugging campaign completion issues',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  async debugCampaignImpressions(
    @Param('campaignId') campaignId: string,
  ): Promise<any> {
    return await this.campaignCompletionService.debugCampaignImpressions(
      campaignId,
    );
  }

  /**
   * Get campaign completion details including earnings for a specific user
   */
  @Get(':campaignId/completion-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STREAMER)
  @ApiOperation({
    summary: 'Get campaign completion details and earnings',
    description:
      'Get detailed completion information including earnings transferred to withdrawable balance',
  })
  async getCampaignCompletionDetails(
    @Param('campaignId') campaignId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user._id?.toString() || req.user.userId;
    if (!userId) {
      throw new BadRequestException('User ID not found');
    }

    return await this.campaignCompletionService.getCampaignCompletionDetails(
      campaignId,
      userId,
    );
  }
}
