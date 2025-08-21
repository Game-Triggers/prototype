import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { ICampaign, CampaignStatus } from '@schemas/campaign.schema';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { IUser, UserRole } from '@schemas/user.schema';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignFilterDto,
  JoinCampaignDto,
} from './dto/campaign.dto';
import { UsersService } from '../users/users.service';
import { CampaignEventsService } from '../wallet/campaign-events.service';

// Forward declaration to avoid circular dependency
interface ConflictRulesServiceInterface {
  checkCampaignJoinConflicts(
    streamerId: string,
    campaignId: string,
  ): Promise<{
    allowed: boolean;
    violations: unknown[];
    warnings: string[];
    blockedBy?: string[];
  }>;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly usersService: UsersService,
    @Inject(CampaignEventsService)
    private readonly campaignEventsService: CampaignEventsService,
    private readonly eventEmitter: EventEmitter2,
    @Optional()
    @Inject('ConflictRulesService')
    private readonly conflictRulesService?: ConflictRulesServiceInterface,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    userId: string,
  ): Promise<ICampaign> {
    // Verify that the brand exists and is a brand
    const brand = await this.usersService.findOne(userId);
    if (brand.role !== UserRole.BRAND) {
      throw new ForbiddenException('Only brand users can create campaigns');
    }

    // Set the brandId to the current user's ID
    const campaignData = {
      ...createCampaignDto,
      brandId: brand._id,
      remainingBudget: createCampaignDto.budget, // Initialize remaining budget
      status: createCampaignDto.status || CampaignStatus.DRAFT,
    };

    const newCampaign = new this.campaignModel(campaignData);
    const savedCampaign = await newCampaign.save();

    // If campaign is created with ACTIVE status, trigger wallet reservation
    if (savedCampaign.status === CampaignStatus.ACTIVE) {
      try {
        await this.campaignEventsService.handleCampaignActivation(
          savedCampaign._id.toString(),
        );
      } catch (error) {
        // If wallet reservation fails, revert campaign to DRAFT status
        await this.campaignModel.findByIdAndUpdate(savedCampaign._id, {
          status: CampaignStatus.DRAFT,
        });
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(
          `Campaign created but wallet reservation failed: ${errorMessage}`,
        );
      }
    }

    return savedCampaign;
  }

  async findAll(
    filterDto: CampaignFilterDto,
  ): Promise<ICampaign[] | { campaigns: ICampaign[]; totalCount: number }> {
    const {
      status,
      search,
      brandId,
      categories,
      languages,
      adminAccess,
      page,
      limit,
    } = filterDto;
    const query: any = {};

    // For admin access, show all campaigns regardless of status
    // For regular access, only show active campaigns
    if (adminAccess === 'true') {
      // Admin can see all campaigns - apply status filter if specified
      if (status) {
        query.status = status;
      }
    } else {
      // Only show active campaigns in public listing
      query.status = CampaignStatus.ACTIVE;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (brandId) {
      query.brandId = brandId;
    }

    if (categories && categories.length > 0) {
      query.categories = { $in: categories };
    }

    if (languages && languages.length > 0) {
      query.languages = { $in: languages };
    }

    // For admin access with pagination, return paginated results with total count
    if (adminAccess === 'true' && page && limit) {
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const [campaigns, totalCount] = await Promise.all([
        this.campaignModel.find(query).skip(skip).limit(limitNum).exec(),
        this.campaignModel.countDocuments(query).exec(),
      ]);

      return { campaigns, totalCount };
    }

    // For regular access, return simple array
    return this.campaignModel.find(query).exec();
  }

  async findBrandCampaigns(
    brandId: string,
    filterDto: CampaignFilterDto,
  ): Promise<ICampaign[]> {
    const query: any = { brandId };
    const { status, search } = filterDto;

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return this.campaignModel.find(query).exec();
  }

  async findAvailableCampaigns(streamerId: string): Promise<ICampaign[]> {
    // Get streamer details to match with campaigns
    const streamer = await this.usersService.findOne(streamerId);

    // Find active campaigns
    const query: any = {
      status: CampaignStatus.ACTIVE,
      // Only campaigns with remaining budget
      remainingBudget: { $gt: 0 },
    };

    // Match by categories if streamer has them
    if (streamer.category && streamer.category.length > 0) {
      query.$or = [
        { categories: { $in: streamer.category } },
        { categories: { $size: 0 } }, // Include campaigns with no category restrictions
      ];
    }

    // Match by languages if streamer has them
    if (streamer.language && streamer.language.length > 0) {
      query.$or = query.$or || [];
      query.$or.push(
        { languages: { $in: streamer.language } },
        { languages: { $size: 0 } }, // Include campaigns with no language restrictions
      );
    }

    // Find campaigns the streamer hasn't already joined
    const participations = await this.participationModel
      .find({ streamerId })
      .exec();
    const joinedCampaignIds = participations.map((p) => p.campaignId);

    if (joinedCampaignIds.length > 0) {
      query._id = { $nin: joinedCampaignIds };
    }

    return this.campaignModel.find(query).exec();
  }

  async findStreamerCampaigns(streamerId: string): Promise<any[]> {
    // Find all participations for the streamer
    const participations = await this.participationModel
      .find({ streamerId, status: ParticipationStatus.ACTIVE })
      .exec();

    if (!participations.length) {
      return [];
    }

    // Get the campaign IDs
    const campaignIds = participations.map((p) => p.campaignId);

    // Find all campaigns the streamer has joined
    const campaigns = await this.campaignModel
      .find({ _id: { $in: campaignIds }, status: CampaignStatus.ACTIVE })
      .exec();

    // Combine campaign data with participation data
    return campaigns.map((campaign) => {
      const participation = participations.find(
        (p) => p.campaignId.toString() === campaign._id.toString(),
      );

      if (!participation) {
        // If no participation is found, return a default structure
        return {
          campaign,
          participation: {
            impressions: 0,
            clicks: 0,
            estimatedEarnings: 0,
            browserSourceUrl: '',
            browserSourceToken: '',
            joinedAt: new Date(),
          },
        };
      }

      return {
        campaign,
        participation: {
          impressions: participation.impressions,
          clicks: participation.clicks,
          estimatedEarnings: participation.estimatedEarnings,
          browserSourceUrl: participation.browserSourceUrl,
          browserSourceToken: participation.browserSourceToken,
          joinedAt: participation.joinedAt,
        },
      };
    });
  }

  async findOne(id: string): Promise<ICampaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Aggregate participation metrics for this campaign
    const aggregatedMetrics = await this.participationModel.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: null,
          activeStreamers: { $sum: 1 },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalChatClicks: { $sum: '$chatClicks' },
          totalQrScans: { $sum: '$qrScans' },
          totalLinkClicks: { $sum: '$linkClicks' },
          totalViewerImpressions: { $sum: '$viewerImpressions' },
          totalUniqueViewers: { $sum: '$uniqueViewers' },
          totalStreamMinutes: { $sum: '$totalStreamMinutes' },
          avgViewerCount: { $avg: '$avgViewerCount' },
          maxPeakViewerCount: { $max: '$peakViewerCount' },
          totalEarnings: { $sum: '$estimatedEarnings' },
        },
      },
      {
        $addFields: {
          totalInteractions: {
            $add: [
              '$totalClicks',
              '$totalChatClicks',
              '$totalQrScans',
              '$totalLinkClicks',
            ],
          },
          engagementRate: {
            $cond: {
              if: { $gt: ['$totalViewerImpressions', 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $add: [
                          '$totalClicks',
                          '$totalChatClicks',
                          '$totalQrScans',
                          '$totalLinkClicks',
                        ],
                      },
                      '$totalViewerImpressions',
                    ],
                  },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    // Add aggregated metrics to campaign object
    const campaignWithMetrics = campaign.toObject();
    if (aggregatedMetrics.length > 0) {
      const metrics = aggregatedMetrics[0];
      campaignWithMetrics.activeStreamers = metrics.activeStreamers || 0;
      campaignWithMetrics.impressions = metrics.totalImpressions || 0;
      campaignWithMetrics.viewerImpressions =
        metrics.totalViewerImpressions || 0;
      campaignWithMetrics.clicks = metrics.totalClicks || 0;
      campaignWithMetrics.chatClicks = metrics.totalChatClicks || 0;
      campaignWithMetrics.qrScans = metrics.totalQrScans || 0;
      campaignWithMetrics.linkClicks = metrics.totalLinkClicks || 0;
      campaignWithMetrics.totalClicks = metrics.totalInteractions || 0;
      campaignWithMetrics.uniqueViewers = metrics.totalUniqueViewers || 0;
      campaignWithMetrics.totalStreamMinutes = metrics.totalStreamMinutes || 0;
      campaignWithMetrics.avgViewerCount = Math.round(
        metrics.avgViewerCount || 0,
      );
      campaignWithMetrics.peakViewerCount = metrics.maxPeakViewerCount || 0;
      campaignWithMetrics.estimatedEarnings =
        Math.round((metrics.totalEarnings || 0) * 100) / 100;
      campaignWithMetrics.engagementRate =
        Math.round((metrics.engagementRate || 0) * 100) / 100;
      campaignWithMetrics.ctr = campaignWithMetrics.engagementRate; // For backward compatibility
    } else {
      // No participations yet, set all metrics to 0
      campaignWithMetrics.activeStreamers = 0;
      campaignWithMetrics.impressions = 0;
      campaignWithMetrics.viewerImpressions = 0;
      campaignWithMetrics.clicks = 0;
      campaignWithMetrics.chatClicks = 0;
      campaignWithMetrics.qrScans = 0;
      campaignWithMetrics.linkClicks = 0;
      campaignWithMetrics.totalClicks = 0;
      campaignWithMetrics.uniqueViewers = 0;
      campaignWithMetrics.totalStreamMinutes = 0;
      campaignWithMetrics.avgViewerCount = 0;
      campaignWithMetrics.peakViewerCount = 0;
      campaignWithMetrics.estimatedEarnings = 0;
      campaignWithMetrics.engagementRate = 0;
      campaignWithMetrics.ctr = 0;
    }

    return campaignWithMetrics as ICampaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    userId: string,
  ): Promise<ICampaign> {
    // First check if the campaign exists
    const campaign = await this.findOne(id);

    // Verify that the user is the brand that created this campaign
    if (campaign.brandId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own campaigns');
    }

    // Handle budget updates with proper wallet operations
    if (updateCampaignDto.budget !== undefined) {
      // Calculate the difference in budget
      const budgetDifference = updateCampaignDto.budget - campaign.budget;

      // Only handle monetary operations for active or paused campaigns
      if (
        campaign.status === CampaignStatus.ACTIVE ||
        campaign.status === CampaignStatus.PAUSED
      ) {
        if (budgetDifference > 0) {
          // Budget increase - reserve additional funds
          try {
            await this.campaignEventsService.handleBudgetIncrease(
              id,
              budgetDifference,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            throw new BadRequestException(
              `Budget increase failed: ${errorMessage}`,
            );
          }
        } else if (budgetDifference < 0) {
          // Budget decrease - release excess funds
          try {
            await this.campaignEventsService.handleBudgetDecrease(
              id,
              Math.abs(budgetDifference),
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            throw new BadRequestException(
              `Budget decrease failed: ${errorMessage}`,
            );
          }
        }
      }

      // Update the remaining budget proportionally
      updateCampaignDto.remainingBudget =
        campaign.remainingBudget + budgetDifference;

      // Ensure remaining budget never goes below 0
      if (
        updateCampaignDto.remainingBudget &&
        updateCampaignDto.remainingBudget < 0
      ) {
        updateCampaignDto.remainingBudget = 0;
      }
    }

    // Update the campaign
    const updatedCampaign = await this.campaignModel
      .findByIdAndUpdate(id, updateCampaignDto, { new: true })
      .exec();

    if (!updatedCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return updatedCampaign;
  }

  async remove(id: string, userId: string): Promise<ICampaign> {
    // First check if the campaign exists
    const campaign = await this.findOne(id);

    // Verify that the user is the brand that created this campaign or an admin
    const user = await this.usersService.findOne(userId);
    if (
      campaign.brandId.toString() !== userId &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only delete your own campaigns');
    }

    // Handle monetary cleanup before deletion
    if (
      campaign.status === CampaignStatus.ACTIVE ||
      campaign.status === CampaignStatus.PAUSED
    ) {
      try {
        await this.campaignEventsService.handleCampaignCancellation(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(
          `Campaign deletion failed during monetary cleanup: ${errorMessage}`,
        );
      }
    }

    // Delete the campaign
    const deletedCampaign = await this.campaignModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedCampaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Also delete all participations
    await this.participationModel.deleteMany({ campaignId: id }).exec();

    return deletedCampaign;
  }

  async joinCampaign(
    joinCampaignDto: JoinCampaignDto,
  ): Promise<ICampaignParticipation> {
    const { campaignId, streamerId } = joinCampaignDto;

    // Check if streamerId is provided
    if (!streamerId) {
      throw new BadRequestException('Streamer ID is required');
    }

    // Check if the campaign exists and is active
    const campaign = await this.findOne(campaignId);
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new ForbiddenException('Can only join active campaigns');
    }

    // Check if the user is a streamer
    const streamer = await this.usersService.findOne(streamerId);
    if (streamer.role !== UserRole.STREAMER) {
      throw new ForbiddenException('Only streamers can join campaigns');
    }

    // ✅ NEW: Consume energy pack before joining campaign
    try {
      await this.usersService.consumeEnergyPack(streamerId, campaignId);
    } catch (error) {
      // If energy pack consumption fails, prevent campaign join
      throw new BadRequestException(
        error.message || 'Failed to consume energy pack. You need energy packs to join campaigns.'
      );
    }

    // Check if the streamer is already participating in this campaign
    const existingParticipation = await this.participationModel
      .findOne({ campaignId, streamerId })
      .exec();

    if (existingParticipation) {
      throw new ConflictException(
        'You are already participating in this campaign',
      );
    }

    // ✅ NEW: Check conflict rules before allowing join
    try {
      // If ConflictRulesService is available, check for conflicts
      if (this.conflictRulesService) {
        const conflictCheck =
          await this.conflictRulesService.checkCampaignJoinConflicts(
            streamerId,
            campaignId,
          );

        // If conflicts are blocking, prevent joining
        if (!conflictCheck.allowed) {
          throw new ConflictException(
            `Cannot join campaign due to conflicts: ${conflictCheck.blockedBy?.join(', ')}`,
          );
        }

        // Log warnings for advisory conflicts
        if (conflictCheck.warnings.length > 0) {
          console.warn(
            `Campaign join warnings for streamer ${streamerId}:`,
            conflictCheck.warnings,
          );
        }
      }
    } catch (error) {
      // If conflict check fails with ConflictException, re-throw it
      if (error instanceof ConflictException) {
        throw error;
      }
      // For other errors, log but don't block the join (graceful degradation)
      console.error('Error checking campaign conflicts:', error);
    }

    // Generate a unique token for browser source (for tracking individual campaign performance)
    // Note: The main overlay uses the user's overlayToken, but each participation gets its own
    // tracking token for specific campaign analytics and click tracking
    const browserSourceToken = crypto
      .createHash('sha256')
      .update(`${streamerId}-${campaignId}-${Date.now()}`)
      .digest('hex');

    // Create browser source URL
    const browserSourceUrl = `/api/v1/overlay/${browserSourceToken}`;

    // Create a new participation
    const participation = new this.participationModel({
      campaignId,
      streamerId,
      status: ParticipationStatus.ACTIVE,
      impressions: 0,
      clicks: 0,
      estimatedEarnings: 0,
      browserSourceUrl,
      browserSourceToken,
    });

    const savedParticipation = await participation.save();

    // Emit campaign joined event for notifications
    console.log('🚀 Emitting campaign.joined event for:', {
      campaignId,
      campaignName: campaign.title,
      streamerId,
      streamerName: streamer.name || streamer.email
    });
    
    this.eventEmitter.emit('campaign.joined', {
      campaignId,
      campaignName: campaign.title,
      streamerId,
      streamerName: streamer.name || streamer.email,
      participationId: savedParticipation._id.toString(),
      browserSourceUrl,
    });

    return savedParticipation;
  }

  async leaveCampaign(
    campaignId: string,
    streamerId: string,
  ): Promise<ICampaignParticipation> {
    // Find the participation
    const participation = await this.participationModel
      .findOne({ campaignId, streamerId })
      .exec();

    if (!participation) {
      throw new NotFoundException('You are not participating in this campaign');
    }

    // Set the status to completed
    participation.status = ParticipationStatus.COMPLETED;
    return participation.save();
  }

  /**
   * Handle streamer leaving campaign early
   */
  async leaveCampaignEarly(
    campaignId: string,
    streamerId: string,
  ): Promise<ICampaignParticipation> {
    // Check if the participation exists and is active
    const participation = await this.participationModel.findOne({
      campaignId,
      streamerId,
      status: ParticipationStatus.ACTIVE,
    });

    if (!participation) {
      throw new NotFoundException('Active participation not found');
    }

    // Handle monetary cleanup - release held earnings immediately
    try {
      await this.campaignEventsService.handleEarlyParticipationEnd(
        campaignId,
        streamerId,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to release earnings: ${errorMessage}`,
      );
    }

    // Update participation status
    const updatedParticipation = await this.participationModel.findOneAndUpdate(
      { campaignId, streamerId },
      {
        status: ParticipationStatus.LEFT_EARLY,
        leftAt: new Date(),
      },
      { new: true },
    );

    if (!updatedParticipation) {
      throw new NotFoundException('Failed to update participation status');
    }

    return updatedParticipation;
  }

  /**
   * Handle streamer pausing participation
   */
  async pauseParticipation(
    campaignId: string,
    streamerId: string,
  ): Promise<ICampaignParticipation> {
    // Check if the participation exists and is active
    const participation = await this.participationModel.findOne({
      campaignId,
      streamerId,
      status: ParticipationStatus.ACTIVE,
    });

    if (!participation) {
      throw new NotFoundException('Active participation not found');
    }

    // Handle pause event
    await this.campaignEventsService.handleParticipationPause(
      campaignId,
      streamerId,
    );

    // Update participation status
    const updatedParticipation = await this.participationModel.findOneAndUpdate(
      { campaignId, streamerId },
      {
        status: ParticipationStatus.PARTICIPATION_PAUSED,
        pausedAt: new Date(),
      },
      { new: true },
    );

    if (!updatedParticipation) {
      throw new NotFoundException('Failed to update participation status');
    }

    return updatedParticipation;
  }

  /**
   * Handle streamer resuming participation
   */
  async resumeParticipation(
    campaignId: string,
    streamerId: string,
  ): Promise<ICampaignParticipation> {
    // Check if the participation exists and is paused
    const participation = await this.participationModel.findOne({
      campaignId,
      streamerId,
      status: ParticipationStatus.PARTICIPATION_PAUSED,
    });

    if (!participation) {
      throw new NotFoundException('Paused participation not found');
    }

    // Handle resume event
    await this.campaignEventsService.handleParticipationResume(
      campaignId,
      streamerId,
    );

    // Update participation status
    const updatedParticipation = await this.participationModel.findOneAndUpdate(
      { campaignId, streamerId },
      {
        status: ParticipationStatus.ACTIVE,
        resumedAt: new Date(),
      },
      { new: true },
    );

    if (!updatedParticipation) {
      throw new NotFoundException('Failed to update participation status');
    }

    return updatedParticipation;
  }

  /**
   * Handle admin/brand removing streamer from campaign
   */
  async removeStreamerFromCampaign(
    campaignId: string,
    streamerId: string,
    removedBy: string,
    reason: 'violation' | 'fraud' | 'admin_decision' | 'brand_decision',
    forfeitEarnings: boolean = false,
  ): Promise<ICampaignParticipation> {
    // Check if the participation exists
    const participation = await this.participationModel.findOne({
      campaignId,
      streamerId,
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    // Verify removal permissions
    const campaign = await this.findOne(campaignId);
    const remover = await this.usersService.findOne(removedBy);

    const canRemove =
      remover.role === UserRole.ADMIN ||
      (remover.role === UserRole.BRAND &&
        campaign.brandId.toString() === removedBy);

    if (!canRemove) {
      throw new ForbiddenException(
        'Insufficient permissions to remove streamer',
      );
    }

    // Handle monetary cleanup based on reason
    try {
      await this.campaignEventsService.handleStreamerRemoval(
        campaignId,
        streamerId,
        reason,
        forfeitEarnings,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to handle earnings: ${errorMessage}`,
      );
    }

    // Update participation status
    const updatedParticipation = await this.participationModel.findOneAndUpdate(
      { campaignId, streamerId },
      {
        status: ParticipationStatus.REMOVED,
        removedAt: new Date(),
        removedBy,
        removalReason: reason,
        earningsForfeited: forfeitEarnings,
      },
      { new: true },
    );

    if (!updatedParticipation) {
      throw new NotFoundException('Failed to update participation status');
    }

    return updatedParticipation;
  }

  async recordImpression(token: string): Promise<{ success: boolean }> {
    // Find participation by browser source token
    const participation = await this.participationModel
      .findOne({ browserSourceToken: token })
      .exec();

    if (!participation || participation.status !== ParticipationStatus.ACTIVE) {
      return { success: false };
    }

    // Get the campaign to check rate and budget
    const campaign = await this.campaignModel
      .findById(participation.campaignId)
      .exec();
    if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
      return { success: false };
    }

    // Calculate cost of this impression
    let cost = 0;
    if (campaign.paymentType === 'cpm') {
      cost = campaign.paymentRate / 1000; // CPM is cost per thousand impressions
    } else {
      // For fixed payment, we don't deduct per impression
      cost = 0;
    }

    // Ensure there's enough budget
    if (campaign.remainingBudget < cost) {
      return { success: false };
    }

    // Record the impression and update earnings using atomic operations
    const updateResult = await this.participationModel
      .findByIdAndUpdate(
        participation._id,
        {
          $inc: {
            impressions: 1,
            estimatedEarnings: cost,
          },
        },
        { new: true },
      )
      .exec();

    if (!updateResult) {
      return { success: false };
    }

    // Update campaign remaining budget
    if (cost > 0) {
      campaign.remainingBudget -= cost;
      await campaign.save();
    }

    return { success: true };
  }

  async recordClick(token: string): Promise<{ success: boolean }> {
    // Find participation by browser source token
    const participation = await this.participationModel
      .findOne({ browserSourceToken: token })
      .exec();

    if (!participation || participation.status !== ParticipationStatus.ACTIVE) {
      return { success: false };
    }

    // Record the click using atomic update
    const updateResult = await this.participationModel
      .findByIdAndUpdate(
        participation._id,
        { $inc: { clicks: 1 } },
        { new: true },
      )
      .exec();

    if (!updateResult) {
      return { success: false };
    }

    return { success: true };
  }

  /**
   * Activate a draft campaign - Move to pending status for admin review
   */
  async activateCampaign(id: string, userId: string): Promise<ICampaign> {
    const campaign = await this.findOne(id);

    // Verify that the user is the brand that created this campaign
    if (campaign.brandId.toString() !== userId) {
      throw new ForbiddenException('You can only activate your own campaigns');
    }

    // Can only activate draft campaigns
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Can only activate draft campaigns');
    }

    try {
      this.logger.debug(`Attempting to update campaign ${id} to PENDING status`);
      this.logger.debug(`Campaign status before update: ${campaign.status}`);
      this.logger.debug(`Campaign ID type: ${typeof id}, value: ${id}`);
      
      // Try a more direct update approach
      const result = await this.campaignModel.updateOne(
        { _id: id }, 
        { 
          status: CampaignStatus.PENDING,
          submittedForReviewAt: new Date() 
        }
      );
      
      this.logger.debug(`Update result:`, result);

      if (result.matchedCount === 0) {
        this.logger.error(`Campaign with ID ${id} not found during update`);
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }

      if (result.modifiedCount === 0) {
        this.logger.error(`Campaign with ID ${id} was not modified`);
        throw new BadRequestException(`Failed to update campaign status`);
      }

      // Fetch the updated campaign
      const updatedCampaign = await this.campaignModel.findById(id).exec();
      
      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found after update`);
      }

      this.logger.debug(`Successfully updated campaign ${id}. New status: ${updatedCampaign.status}`);
      this.logger.debug(`Updated campaign object:`, JSON.stringify(updatedCampaign, null, 2));

      // Emit event for admin notifications
      this.eventEmitter.emit('campaign.pending_review', {
        campaignId: id,
        campaignName: updatedCampaign.title,
        brandUserId: userId,
        budget: updatedCampaign.budget,
      });

      this.logger.log(`Campaign ${id} moved to pending status for admin review`);

      return updatedCampaign;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Campaign activation failed: ${errorMessage}`,
      );
    }
  }

  /**
   * Pause an active campaign - Stop charging for new impressions
   */
  async pauseCampaign(id: string, userId: string): Promise<ICampaign> {
    const campaign = await this.findOne(id);

    // Verify that the user is the brand that created this campaign
    if (campaign.brandId.toString() !== userId) {
      throw new ForbiddenException('You can only pause your own campaigns');
    }

    // Can only pause active campaigns
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Can only pause active campaigns');
    }

    try {
      // Handle campaign pause (currently just status change, but could include more logic)
      await this.campaignEventsService.handleCampaignPause(id);

      // Update campaign status to paused
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(id, { status: CampaignStatus.PAUSED }, { new: true })
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }

      return updatedCampaign;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Campaign pause failed: ${errorMessage}`);
    }
  }

  /**
   * Resume a paused campaign - Resume charging for impressions
   */
  async resumeCampaign(id: string, userId: string): Promise<ICampaign> {
    const campaign = await this.findOne(id);

    // Verify that the user is the brand that created this campaign
    if (campaign.brandId.toString() !== userId) {
      throw new ForbiddenException('You can only resume your own campaigns');
    }

    // Can only resume paused campaigns
    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('Can only resume paused campaigns');
    }

    try {
      // Handle campaign resume (currently just status change, but could include more logic)
      await this.campaignEventsService.handleCampaignResume(id);

      // Update campaign status to active
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(id, { status: CampaignStatus.ACTIVE }, { new: true })
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }

      return updatedCampaign;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Campaign resume failed: ${errorMessage}`);
    }
  }

  /**
   * Admin approves a pending campaign - Activates it and reserves funds
   */
  async approveCampaign(id: string, adminId: string): Promise<ICampaign> {
    const campaign = await this.findOne(id);

    // Can only approve pending campaigns
    if (campaign.status !== CampaignStatus.PENDING) {
      throw new BadRequestException('Can only approve pending campaigns');
    }

    try {
      // Reserve campaign funds from brand wallet
      await this.campaignEventsService.handleCampaignActivation(id);

      // Update campaign status to active
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(
          id, 
          { 
            status: CampaignStatus.ACTIVE,
            approvedAt: new Date(),
            approvedBy: adminId
          }, 
          { new: true }
        )
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }

      // Emit event for notifications
      this.eventEmitter.emit('campaign.approved', {
        campaignId: id,
        campaignName: updatedCampaign.title,
        brandUserId: updatedCampaign.brandId.toString(),
        adminId,
        budget: updatedCampaign.budget,
      });

      this.logger.log(`Campaign ${id} approved and activated by admin ${adminId}`);

      return updatedCampaign;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Campaign approval failed: ${errorMessage}`,
      );
    }
  }

  /**
   * Admin rejects a pending campaign
   */
  async rejectCampaign(id: string, adminId: string, reason?: string): Promise<ICampaign> {
    const campaign = await this.findOne(id);

    // Can only reject pending campaigns
    if (campaign.status !== CampaignStatus.PENDING) {
      throw new BadRequestException('Can only reject pending campaigns');
    }

    try {
      // Update campaign status to rejected
      const updatedCampaign = await this.campaignModel
        .findByIdAndUpdate(
          id, 
          { 
            status: CampaignStatus.REJECTED,
            rejectedAt: new Date(),
            rejectedBy: adminId,
            rejectionReason: reason
          }, 
          { new: true }
        )
        .exec();

      if (!updatedCampaign) {
        throw new NotFoundException(`Campaign with ID ${id} not found`);
      }

      // Emit event for notifications
      this.eventEmitter.emit('campaign.rejected', {
        campaignId: id,
        campaignName: updatedCampaign.title,
        brandUserId: updatedCampaign.brandId.toString(),
        adminId,
        reason,
      });

      this.logger.log(`Campaign ${id} rejected by admin ${adminId}. Reason: ${reason || 'No reason provided'}`);

      return updatedCampaign;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Campaign rejection failed: ${errorMessage}`,
      );
    }
  }
}
