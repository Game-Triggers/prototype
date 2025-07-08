import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ICampaign, CampaignStatus } from '@schemas/campaign.schema';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { IUser, UserRole } from '@schemas/user.schema';
import { AnalyticsQueryDto, DateGrouping } from './dto/analytics.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get dashboard data based on user role
   */
  async getDashboardData(userId: string, role: UserRole) {
    switch (role) {
      case UserRole.STREAMER:
        return this.getStreamerDashboard(userId);
      case UserRole.BRAND:
        return this.getBrandDashboard(userId);
      case UserRole.ADMIN:
        return this.getAdminDashboard();
      default:
        throw new ForbiddenException('Invalid user role');
    }
  }

  /**
   * Get analytics for a specific campaign
   */
  async getCampaignAnalytics(
    campaignId: string,
    query: AnalyticsQueryDto,
    user: any,
  ) {
    // First check if campaign exists
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    // Check permissions - only brand owner, participating streamers, or admins can view
    if (
      user.role === UserRole.BRAND &&
      campaign.brandId.toString() !== user.userId
    ) {
      throw new ForbiddenException(
        'You can only view analytics for your own campaigns',
      );
    } else if (user.role === UserRole.STREAMER) {
      // Check if streamer participates in this campaign
      const participation = await this.participationModel
        .findOne({
          campaignId,
          streamerId: user.userId,
        })
        .exec();

      if (!participation) {
        throw new ForbiddenException(
          'You can only view analytics for campaigns you participate in',
        );
      }
    }

    // Set date range for analytics
    const dateMatch = this.getDateRangeMatch(query);

    // Prepare aggregation pipeline
    const pipeline: PipelineStage[] = [
      { $match: { campaignId: campaign._id, ...dateMatch } },
      {
        $group: {
          _id: this.getGroupByDateExpression(
            query.groupBy || DateGrouping.DAILY,
          ),
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          streamers: { $addToSet: '$streamerId' },
          earnings: { $sum: '$estimatedEarnings' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          impressions: 1,
          clicks: 1,
          streamerCount: { $size: '$streamers' },
          earnings: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            ],
          },
        },
      },
    ];

    // Execute the pipeline
    const analyticsData = await this.participationModel
      .aggregate(pipeline)
      .exec();

    // Calculate totals
    const impressionsTotal = analyticsData.reduce(
      (sum, item) => sum + item.impressions,
      0,
    );
    const clicksTotal = analyticsData.reduce(
      (sum, item) => sum + item.clicks,
      0,
    );
    const earningsTotal = analyticsData.reduce(
      (sum, item) => sum + item.earnings,
      0,
    );
    const ctrTotal =
      impressionsTotal > 0 ? (clicksTotal / impressionsTotal) * 100 : 0;

    const totals = {
      impressions: impressionsTotal,
      clicks: clicksTotal,
      earnings: earningsTotal,
      ctr: ctrTotal,
    };

    // Get participating streamers
    const participatingStreamers = await this.participationModel
      .find({ campaignId })
      .populate('streamerId', 'name image category language')
      .select('streamerId impressions clicks estimatedEarnings')
      .exec();

    // Return formatted analytics
    return {
      campaign,
      analytics: analyticsData,
      totals,
      participatingStreamers,
    };
  }

  /**
   * Get analytics for a specific streamer
   */
  async getStreamerAnalytics(
    streamerId: string,
    query: AnalyticsQueryDto,
    user: any,
  ) {
    // Check if streamer exists
    const streamer = await this.usersService.findOne(streamerId);
    if (streamer.role !== UserRole.STREAMER) {
      throw new NotFoundException(`Streamer with ID ${streamerId} not found`);
    }

    // Check permissions - only the streamer or admins can view detailed stats
    if (user.role === UserRole.STREAMER && streamerId !== user.userId) {
      throw new ForbiddenException('You can only view your own analytics');
    } else if (user.role === UserRole.BRAND) {
      // Brands can only view streamers participating in their campaigns
      const participations = await this.participationModel
        .find({ streamerId })
        .exec();

      const campaignIds = participations.map((p) => p.campaignId);

      const brandCampaigns = await this.campaignModel
        .find({ _id: { $in: campaignIds }, brandId: user.userId })
        .exec();

      if (brandCampaigns.length === 0) {
        throw new ForbiddenException(
          'You can only view analytics for streamers participating in your campaigns',
        );
      }
    }

    // Set date range for analytics
    const dateMatch = this.getDateRangeMatch(query);

    // Prepare aggregation pipeline for streamer metrics
    const pipeline: PipelineStage[] = [
      { $match: { streamerId: streamer._id, ...dateMatch } },
      {
        $group: {
          _id: this.getGroupByDateExpression(
            query.groupBy || DateGrouping.DAILY,
          ),
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          campaigns: { $addToSet: '$campaignId' },
          earnings: { $sum: '$estimatedEarnings' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          impressions: 1,
          clicks: 1,
          campaignCount: { $size: '$campaigns' },
          earnings: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            ],
          },
        },
      },
    ];

    // Execute the pipeline
    const analyticsData = await this.participationModel
      .aggregate(pipeline)
      .exec();

    // Calculate totals
    const totals = {
      impressions: analyticsData.reduce(
        (sum, item) => sum + item.impressions,
        0,
      ),
      clicks: analyticsData.reduce((sum, item) => sum + item.clicks, 0),
      earnings: analyticsData.reduce((sum, item) => sum + item.earnings, 0),
      ctr:
        analyticsData.reduce(
          (sum, item) =>
            sum + (item.impressions > 0 ? item.clicks / item.impressions : 0),
          0,
        ) * 100,
    };

    // Get active campaigns for this streamer
    const activeCampaigns = await this.participationModel
      .find({ streamerId, status: ParticipationStatus.ACTIVE })
      .populate('campaignId', 'title mediaUrl mediaType budget')
      .select('campaignId impressions clicks estimatedEarnings')
      .exec();

    // Return formatted analytics
    return {
      streamer,
      analytics: analyticsData,
      totals,
      activeCampaigns,
    };
  }

  /**
   * Get analytics for a specific brand
   */
  async getBrandAnalytics(
    brandId: string,
    query: AnalyticsQueryDto,
    user: any,
  ) {
    // Check if brand exists
    const brand = await this.usersService.findOne(brandId);
    if (brand.role !== UserRole.BRAND) {
      throw new NotFoundException(`Brand with ID ${brandId} not found`);
    }

    // Check permissions - only the brand or admins can view detailed stats
    if (
      user.role === UserRole.BRAND &&
      brandId !== user.userId &&
      brandId !== user._id?.toString()
    ) {
      throw new ForbiddenException('You can only view your own analytics');
    }

    // Set date range for analytics
    const dateMatch = this.getDateRangeMatch(query);

    // First, get all campaigns for the brand
    const brandCampaigns = await this.campaignModel
      .find({ brandId: brand._id })
      .exec();

    const campaignIds = brandCampaigns.map((campaign) => campaign._id);

    // Prepare aggregation pipeline for brand metrics
    const pipeline: PipelineStage[] = [
      {
        $match: {
          campaignId: { $in: campaignIds },
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: this.getGroupByDateExpression(
            query.groupBy || DateGrouping.DAILY,
          ),
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          streamers: { $addToSet: '$streamerId' },
          spend: { $sum: '$estimatedEarnings' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          impressions: 1,
          clicks: 1,
          streamerCount: { $size: '$streamers' },
          spend: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            ],
          },
        },
      },
    ];

    // Execute the pipeline
    const analyticsData = await this.participationModel
      .aggregate(pipeline)
      .exec();

    // Calculate totals
    const totals = {
      impressions: analyticsData.reduce(
        (sum, item) => sum + item.impressions,
        0,
      ),
      clicks: analyticsData.reduce((sum, item) => sum + item.clicks, 0),
      spend: analyticsData.reduce((sum, item) => sum + item.spend, 0),
      ctr:
        analyticsData.reduce(
          (sum, item) =>
            sum + (item.impressions > 0 ? item.clicks / item.impressions : 0),
          0,
        ) * 100,
    };

    // Get active campaigns for this brand
    const activeCampaigns = await this.campaignModel
      .find({
        brandId: brand._id,
        status: CampaignStatus.ACTIVE,
      })
      .select('title mediaUrl mediaType budget remainingBudget')
      .exec();

    // Return formatted analytics
    return {
      brand,
      analytics: analyticsData,
      totals,
      activeCampaigns,
    };
  }

  /**
   * Get platform overview for admins
   */
  async getPlatformOverview(query: AnalyticsQueryDto) {
    // Set date range for analytics
    const dateMatch = this.getDateRangeMatch(query);

    // Prepare aggregation pipeline for platform metrics
    const pipeline: PipelineStage[] = [
      { $match: dateMatch },
      {
        $group: {
          _id: this.getGroupByDateExpression(
            query.groupBy || DateGrouping.DAILY,
          ),
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          streamers: { $addToSet: '$streamerId' },
          campaigns: { $addToSet: '$campaignId' },
          totalEarnings: { $sum: '$estimatedEarnings' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          impressions: 1,
          clicks: 1,
          streamerCount: { $size: '$streamers' },
          campaignCount: { $size: '$campaigns' },
          totalEarnings: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            ],
          },
        },
      },
    ];

    // Execute the pipeline
    const analyticsData = await this.participationModel
      .aggregate(pipeline)
      .exec();

    // Get total counts
    const [totalStreamers, totalBrands, totalCampaigns, activeCampaigns] =
      await Promise.all([
        this.usersService.countByRole(UserRole.STREAMER),
        this.usersService.countByRole(UserRole.BRAND),
        this.campaignModel.countDocuments(),
        this.campaignModel.countDocuments({ status: CampaignStatus.ACTIVE }),
      ]);

    // Calculate platform totals
    const platformTotals = {
      impressions: analyticsData.reduce(
        (sum, item) => sum + item.impressions,
        0,
      ),
      clicks: analyticsData.reduce((sum, item) => sum + item.clicks, 0),
      ctr:
        analyticsData.reduce(
          (sum, item) =>
            sum + (item.impressions > 0 ? item.clicks / item.impressions : 0),
          0,
        ) * 100,
      totalEarnings: analyticsData.reduce(
        (sum, item) => sum + item.totalEarnings,
        0,
      ),
      totalStreamers,
      totalBrands,
      totalCampaigns,
      activeCampaigns,
    };

    return {
      analytics: analyticsData,
      platformTotals,
    };
  }

  /**
   * Get top performing campaigns
   */
  async getTopPerformingCampaigns(query: AnalyticsQueryDto, user: any) {
    const dateMatch = this.getDateRangeMatch(query);
    const limit = query.limit || 10;

    // Base pipeline for campaign analytics
    const pipeline: PipelineStage[] = [
      { $match: dateMatch },
      {
        $group: {
          _id: '$campaignId',
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          streamers: { $addToSet: '$streamerId' },
          totalEarnings: { $sum: '$estimatedEarnings' },
        },
      },
      {
        $sort: { impressions: -1 },
      },
      { $limit: limit },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaign',
        },
      },
      { $unwind: '$campaign' },
      {
        $project: {
          _id: 0,
          campaignId: '$_id',
          title: '$campaign.title',
          impressions: 1,
          clicks: 1,
          streamerCount: { $size: '$streamers' },
          totalEarnings: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            ],
          },
        },
      },
    ];

    // Filter by brand if the user is a brand
    if (user.role === UserRole.BRAND) {
      pipeline.unshift({
        $lookup: {
          from: 'campaigns',
          localField: 'campaignId',
          foreignField: '_id',
          as: 'brandCampaign',
        },
      });

      pipeline.unshift({
        $match: {
          'brandCampaign.brandId': user.userId,
        },
      });
    }

    // Execute the pipeline
    return this.participationModel.aggregate(pipeline).exec();
  }

  /**
   * Get top performing streamers
   */
  async getTopPerformingStreamers(query: AnalyticsQueryDto, user: any) {
    const dateMatch = this.getDateRangeMatch(query);
    const limit = query.limit || 10;

    // Base pipeline for streamer analytics
    const pipeline: PipelineStage[] = [
      { $match: dateMatch },
      {
        $group: {
          _id: '$streamerId',
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          campaigns: { $addToSet: '$campaignId' },
          totalEarnings: { $sum: '$estimatedEarnings' },
        },
      },
      {
        $sort: { impressions: -1 },
      },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'streamer',
        },
      },
      { $unwind: '$streamer' },
      {
        $project: {
          _id: 0,
          streamerId: '$_id',
          name: '$streamer.name',
          image: '$streamer.image',
          impressions: 1,
          clicks: 1,
          campaignCount: { $size: '$campaigns' },
          totalEarnings: 1,
          ctr: {
            $cond: [
              { $eq: ['$impressions', 0] },
              0,
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
            ],
          },
        },
      },
    ];

    // Filter by brand's campaigns if the user is a brand
    if (user.role === UserRole.BRAND) {
      // First get all campaigns for this brand
      const brandCampaigns = await this.campaignModel
        .find({ brandId: user.userId })
        .select('_id')
        .exec();

      const campaignIds = brandCampaigns.map((c) => c._id);

      // Add match to pipeline to filter by these campaigns
      pipeline.unshift({
        $match: { campaignId: { $in: campaignIds } },
      });
    }

    // Execute the pipeline
    return this.participationModel.aggregate(pipeline).exec();
  }

  /**
   * Get dashboard data for streamers
   */
  private async getStreamerDashboard(streamerId: string) {
    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query: AnalyticsQueryDto = {
      streamerId,
      startDate: thirtyDaysAgo,
      endDate: new Date(),
      groupBy: DateGrouping.DAILY,
    };

    const streamerAnalytics = await this.getStreamerAnalytics(
      streamerId,
      query,
      { userId: streamerId, role: UserRole.STREAMER },
    );

    // Get active campaign count
    const activeCampaignsCount = await this.participationModel
      .countDocuments({
        streamerId: new Types.ObjectId(streamerId),
        status: ParticipationStatus.ACTIVE,
      })
      .exec();

    // Get total earnings all-time
    const totalEarnings = await this.participationModel
      .aggregate([
        { $match: { streamerId: new Types.ObjectId(streamerId) } },
        { $group: { _id: null, total: { $sum: '$estimatedEarnings' } } },
      ])
      .exec();

    // Get available campaigns matching streamer profile
    const availableCampaigns = await this.campaignModel
      .find({ status: CampaignStatus.ACTIVE })
      .limit(5)
      .exec();

    return {
      analytics: streamerAnalytics.analytics,
      availableCampaigns,
      summary: {
        activeCampaigns: activeCampaignsCount,
        totalImpressions: streamerAnalytics.totals.impressions,
        totalClicks: streamerAnalytics.totals.clicks,
        recentEarnings: streamerAnalytics.totals.earnings,
        allTimeEarnings: totalEarnings[0]?.total || 0,
      },
    };
  }

  /**
   * Get dashboard data for brands
   */
  private async getBrandDashboard(brandId: string) {
    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query: AnalyticsQueryDto = {
      brandId,
      startDate: thirtyDaysAgo,
      endDate: new Date(),
      groupBy: DateGrouping.DAILY,
    };

    const brandAnalytics = await this.getBrandAnalytics(brandId, query, {
      _id: brandId, // Providing _id for consistency
      userId: brandId,
      role: UserRole.BRAND,
    });

    // Get active campaign count
    const activeCampaignsCount = await this.campaignModel
      .countDocuments({
        brandId: new Types.ObjectId(brandId),
        status: CampaignStatus.ACTIVE,
      })
      .exec();

    // Get total spend all-time
    const totalSpend = await this.participationModel
      .aggregate([
        {
          $lookup: {
            from: 'campaigns',
            localField: 'campaignId',
            foreignField: '_id',
            as: 'campaign',
          },
        },
        { $unwind: '$campaign' },
        { $match: { 'campaign.brandId': new Types.ObjectId(brandId) } },
        { $group: { _id: null, total: { $sum: '$estimatedEarnings' } } },
      ])
      .exec();

    // Get count of unique streamers who participated in brand's campaigns
    const uniqueStreamersCount = await this.participationModel
      .aggregate([
        {
          $lookup: {
            from: 'campaigns',
            localField: 'campaignId',
            foreignField: '_id',
            as: 'campaign',
          },
        },
        { $unwind: '$campaign' },
        { $match: { 'campaign.brandId': new Types.ObjectId(brandId) } },
        {
          $group: { _id: null, uniqueStreamers: { $addToSet: '$streamerId' } },
        },
        { $project: { _id: 0, count: { $size: '$uniqueStreamers' } } },
      ])
      .exec();

    return {
      analytics: brandAnalytics.analytics,
      activeCampaigns: brandAnalytics.activeCampaigns,
      summary: {
        activeCampaigns: activeCampaignsCount,
        totalImpressions: brandAnalytics.totals.impressions,
        totalClicks: brandAnalytics.totals.clicks,
        recentSpend: brandAnalytics.totals.spend,
        allTimeSpend: totalSpend[0]?.total || 0,
        uniqueStreamers: uniqueStreamersCount[0]?.count || 0,
      },
    };
  }

  /**
   * Get dashboard data for admins
   */
  private async getAdminDashboard() {
    // Get recent platform performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query: AnalyticsQueryDto = {
      startDate: thirtyDaysAgo,
      endDate: new Date(),
      groupBy: DateGrouping.DAILY,
    };

    const platformAnalytics = await this.getPlatformOverview(query);

    // Get new users in the last 30 days
    const newUsers = await this.usersService.countNewUsers(thirtyDaysAgo);

    // Get new campaigns in the last 30 days
    const newCampaigns = await this.campaignModel
      .countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      })
      .exec();

    return {
      analytics: platformAnalytics.analytics,
      platformTotals: platformAnalytics.platformTotals,
      summary: {
        newStreamers: newUsers.newStreamers,
        newBrands: newUsers.newBrands,
        newCampaigns,
        platform30DayGrowth: this.calculateGrowthRate(
          platformAnalytics.platformTotals.impressions,
          await this.getPreviousPeriodImpressions(thirtyDaysAgo),
        ),
      },
    };
  }

  /**
   * Get advanced analytics data with new viewer-based metrics
   */
  async getAdvancedAnalytics(userId: string, role: UserRole, query: any) {
    try {
      let matchStage: PipelineStage.Match = { $match: {} };

      // Filter by date range if provided
      if (query.startDate || query.endDate) {
        matchStage.$match.createdAt = {};
        if (query.startDate) {
          matchStage.$match.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          matchStage.$match.createdAt.$lte = new Date(query.endDate);
        }
      }

      // Apply role-specific filters
      switch (role) {
        case UserRole.STREAMER: {
          // Convert userId string to ObjectId for proper matching
          const streamerObjectId = new Types.ObjectId(userId);
          matchStage.$match.streamerId = streamerObjectId;
          break;
        }
        case UserRole.BRAND:
          // For brands, we need to get all campaigns first, then filter by participations
          const brandCampaigns = await this.campaignModel
            .find({ brandId: new Types.ObjectId(userId) })
            .distinct('_id');
          matchStage.$match.campaignId = { $in: brandCampaigns };
          break;
        case UserRole.ADMIN:
          // Admin can see all data, no additional filters needed
          break;
        default:
          throw new ForbiddenException('Invalid user role');
      }

      // Filter by specific campaign if provided
      if (query.campaignId) {
        matchStage.$match.campaignId = query.campaignId;
      }

      // Filter by specific streamer if provided and user is admin or brand
      if (query.streamerId && role !== UserRole.STREAMER) {
        matchStage.$match.streamerId = query.streamerId;
      }

      // Run aggregation for advanced analytics
      const analyticsData = await this.participationModel.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            // Primary metrics (now viewer-based)
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },

            // Alternative engagement metrics
            chatClicks: { $sum: '$chatClicks' },
            qrScans: { $sum: '$qrScans' },
            linkClicks: { $sum: '$linkClicks' },

            // Stream data
            totalStreamMinutes: { $sum: '$totalStreamMinutes' },
            avgViewerCount: { $avg: '$avgViewerCount' },
            peakViewerCount: { $max: '$peakViewerCount' },

            // Total earnings/spend (terminology depends on role)
            estimatedEarnings: { $sum: '$estimatedEarnings' },

            // Counts
            totalStreams: {
              $sum: { $cond: [{ $gt: ['$totalStreamMinutes', 0] }, 1, 0] },
            },
            totalCampaigns: { $addToSet: '$campaignId' },
            totalStreamers: { $addToSet: '$streamerId' },
          },
        },
      ]);

      // If no data, return empty response
      if (!analyticsData || analyticsData.length === 0) {
        // Return response with appropriate field names based on role
        const emptyResponse = {
          impressions: 0,
          clicks: 0,
          chatClicks: 0,
          qrScans: 0,
          linkClicks: 0,
          totalStreamMinutes: 0,
          avgViewerCount: 0,
          peakViewerCount: 0,
          totalClicks: 0,
          totalCampaigns: 0,
          totalStreams: 0,
          totalStreamers: 0,
          engagementRate: 0,
        };

        if (role === UserRole.BRAND) {
          return {
            ...emptyResponse,
            totalSpend: 0,
            spendPerStream: 0,
            spendPerMinute: 0,
            spendPerImpression: 0,
          };
        } else {
          return {
            ...emptyResponse,
            estimatedEarnings: 0,
            earningsPerStream: 0,
            earningsPerMinute: 0,
            earningsPerImpression: 0,
          };
        }
      }

      const result = analyticsData[0];
      delete result._id;

      // Calculate derived metrics
      result.totalClicks =
        result.clicks + result.chatClicks + result.qrScans + result.linkClicks;
      result.totalCampaigns = result.totalCampaigns.length;
      result.totalStreamers = result.totalStreamers.length;

      // Calculate engagement rate (clicks per impression)
      result.engagementRate =
        result.impressions > 0
          ? (result.totalClicks / result.impressions) * 100
          : 0;

      // Calculate per-stream, per-minute, and per-impression metrics with appropriate terminology
      if (role === UserRole.BRAND) {
        // For brands, use "spend" terminology
        result.totalSpend = result.estimatedEarnings;
        delete result.estimatedEarnings; // Remove earnings field for brands

        result.spendPerStream =
          result.totalStreams > 0 ? result.totalSpend / result.totalStreams : 0;

        result.spendPerMinute =
          result.totalStreamMinutes > 0
            ? result.totalSpend / result.totalStreamMinutes
            : 0;

        result.spendPerImpression =
          result.impressions > 0 ? result.totalSpend / result.impressions : 0;
      } else {
        // For streamers and admins, use "earnings" terminology
        result.earningsPerStream =
          result.totalStreams > 0
            ? result.estimatedEarnings / result.totalStreams
            : 0;

        result.earningsPerMinute =
          result.totalStreamMinutes > 0
            ? result.estimatedEarnings / result.totalStreamMinutes
            : 0;

        result.earningsPerImpression =
          result.impressions > 0
            ? result.estimatedEarnings / result.impressions
            : 0;
      }

      // Round decimal values for readability
      Object.keys(result).forEach((key) => {
        if (
          typeof result[key] === 'number' &&
          key !== 'totalStreams' &&
          key !== 'totalCampaigns' &&
          key !== 'totalStreamers'
        ) {
          result[key] = Math.round((result[key] + Number.EPSILON) * 100) / 100;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting advanced analytics:', error);
      throw error;
    }
  }

  /**
   * Helper to get date range match for MongoDB queries
   */
  private getDateRangeMatch(query: AnalyticsQueryDto) {
    const dateMatch: any = {};

    if (query.startDate) {
      dateMatch.createdAt = { $gte: query.startDate };
    }

    if (query.endDate) {
      dateMatch.createdAt = dateMatch.createdAt || {};
      dateMatch.createdAt.$lte = query.endDate;
    }

    return dateMatch;
  }

  /**
   * Helper to get MongoDB date grouping expression
   */
  private getGroupByDateExpression(groupBy: DateGrouping) {
    switch (groupBy) {
      case DateGrouping.HOURLY:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' },
        };
      case DateGrouping.DAILY:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
      case DateGrouping.WEEKLY:
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' },
        };
      case DateGrouping.MONTHLY:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
    }
  }

  /**
   * Helper to get impressions from previous period
   */
  private async getPreviousPeriodImpressions(thirtyDaysAgo: Date) {
    const sixtyDaysAgo = new Date(thirtyDaysAgo);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

    const result = await this.participationModel
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: sixtyDaysAgo,
              $lt: thirtyDaysAgo,
            },
          },
        },
        { $group: { _id: null, impressions: { $sum: '$impressions' } } },
      ])
      .exec();

    return result[0]?.impressions || 0;
  }

  /**
   * Helper to calculate growth rate
   */
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }
}
