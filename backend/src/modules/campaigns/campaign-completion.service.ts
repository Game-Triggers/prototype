import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ICampaign, CampaignStatus } from '@schemas/campaign.schema';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { CampaignEventsService } from '../wallet/campaign-events.service';
import { GKeyService } from '../g-key/g-key.service';
import { WalletService } from '../wallet/wallet.service';

interface CampaignMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalChatClicks: number;
  totalQrScans: number;
  totalLinkClicks: number;
  totalUniqueViewers: number;
  totalStreamMinutes: number;
  totalEarnings: number;
  activeParticipants: number;
  totalParticipants: number;
  avgViewerCount: number;
  maxPeakViewerCount: number;
  lastStreamActivity: Date | null;
}

export interface CampaignCompletionCriteria {
  impressionTarget?: number; // Target impressions to complete campaign
  budgetThreshold?: number; // Percentage of budget used (0-100)
  timeBasedDays?: number; // Days since campaign started
  participationThreshold?: number; // Minimum number of active participants
}

interface CompletionEvaluation {
  isComplete: boolean;
  reason?: string;
}

interface EarningsCalculation {
  impressions: number;
  totalImpressions?: number;
  paymentRate: number;
  formula: string;
  calculation: string;
}

@Injectable()
export class CampaignCompletionService {
  private readonly logger = new Logger(CampaignCompletionService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly campaignEventsService: CampaignEventsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly gKeyService: GKeyService,
    private readonly walletService: WalletService,
  ) {
    this.logger.debug(
      `=== CampaignCompletionService constructed successfully ===`,
    );
  }

  /**
   * Check all active campaigns for completion criteria
   * This will be called by the task scheduler
   */
  async checkAllCampaignsForCompletion(): Promise<void> {
    this.logger.debug('=== ENTERING checkAllCampaignsForCompletion METHOD ===');
    this.logger.debug('Checking all campaigns for completion criteria');

    try {
      // Find all active campaigns
      const activeCampaigns = await this.campaignModel
        .find({ status: CampaignStatus.ACTIVE })
        .exec();

      this.logger.debug(
        `Found ${activeCampaigns.length} active campaigns to check`,
      );

      if (activeCampaigns.length === 0) {
        this.logger.debug('No active campaigns found, returning early');
        return;
      }

      this.logger.debug(
        `Campaign IDs: ${activeCampaigns.map((c) => c._id).join(', ')}`,
      );
      this.logger.debug(
        `First campaign sample: ${activeCampaigns.length > 0 ? JSON.stringify({ id: activeCampaigns[0]._id, status: activeCampaigns[0].status, title: activeCampaigns[0].title }) : 'none'}`,
      );

      // Check each campaign for completion
      const completionChecks = activeCampaigns.map(async (campaign) => {
        try {
          this.logger.debug(
            `Processing campaign ${campaign._id.toString()} (${campaign.title})`,
          );
          return await this.checkCampaignCompletion(campaign._id.toString());
        } catch (error) {
          this.logger.error(
            `Error processing campaign ${campaign._id.toString()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          return false;
        }
      });

      this.logger.debug(
        `About to process ${completionChecks.length} campaigns concurrently`,
      );
      const results = await Promise.all(completionChecks);
      this.logger.debug(
        `Completed processing ${results.length} campaigns. Results: ${results.map((r) => (r ? 'completed' : 'not completed')).join(', ')}`,
      );

      this.logger.debug('Campaign completion check completed');
    } catch (error) {
      this.logger.error(
        `Error in campaign completion check: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check a specific campaign for completion criteria
   */
  async checkCampaignCompletion(campaignId: string): Promise<boolean> {
    try {
      const campaign = await this.campaignModel.findById(campaignId).exec();
      if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
        this.logger.debug(`Campaign ${campaignId} is not active or not found`);
        return false;
      }

      this.logger.debug(
        `Checking completion for campaign ${campaignId} (${campaign.title})`,
      );

      // Get campaign participation metrics
      const metrics = await this.getCampaignMetrics(campaignId);
      this.logger.debug(`Campaign ${campaignId} metrics:`, {
        totalImpressions: metrics.totalImpressions,
        totalClicks: metrics.totalClicks,
        activeParticipants: metrics.activeParticipants,
        totalParticipants: metrics.totalParticipants,
      });

      // Define completion criteria
      const criteria = this.getCampaignCompletionCriteria(campaign);
      this.logger.debug(`Campaign ${campaignId} completion criteria:`, {
        impressionTarget: criteria.impressionTarget,
        budgetThreshold: criteria.budgetThreshold,
        paymentType: campaign.paymentType,
        budget: campaign.budget,
        remainingBudget: campaign.remainingBudget,
      });

      // Check if any completion criteria are met
      const shouldComplete = this.evaluateCompletionCriteria(
        campaign,
        metrics,
        criteria,
      );

      if (shouldComplete.isComplete) {
        this.logger.log(
          `Campaign ${campaignId} meets completion criteria: ${shouldComplete.reason}`,
        );
        await this.completeCampaign(
          campaign,
          shouldComplete.reason || 'Unknown reason',
        );
        return true;
      } else {
        this.logger.debug(
          `Campaign ${campaignId} does not meet completion criteria yet`,
        );
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error checking completion for campaign ${campaignId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Get aggregated metrics for a campaign
   */
  private async getCampaignMetrics(
    campaignId: string,
  ): Promise<CampaignMetrics> {
    const metrics = await this.participationModel.aggregate([
      {
        $match: {
          campaignId: new Types.ObjectId(campaignId),
          status: {
            $in: [ParticipationStatus.ACTIVE, ParticipationStatus.COMPLETED],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalChatClicks: { $sum: '$chatClicks' },
          totalQrScans: { $sum: '$qrScans' },
          totalLinkClicks: { $sum: '$linkClicks' },
          totalUniqueViewers: { $sum: '$uniqueViewers' },
          totalStreamMinutes: { $sum: '$totalStreamMinutes' },
          totalEarnings: { $sum: '$estimatedEarnings' },
          activeParticipants: {
            $sum: {
              $cond: [{ $eq: ['$status', ParticipationStatus.ACTIVE] }, 1, 0],
            },
          },
          totalParticipants: { $sum: 1 },
          avgViewerCount: { $avg: '$avgViewerCount' },
          maxPeakViewerCount: { $max: '$peakViewerCount' },
          lastStreamActivity: { $max: '$lastStreamDate' },
        },
      },
    ]);

    return metrics.length > 0
      ? (metrics[0] as CampaignMetrics)
      : {
          totalImpressions: 0,
          totalClicks: 0,
          totalChatClicks: 0,
          totalQrScans: 0,
          totalLinkClicks: 0,
          totalUniqueViewers: 0,
          totalStreamMinutes: 0,
          totalEarnings: 0,
          activeParticipants: 0,
          totalParticipants: 0,
          avgViewerCount: 0,
          maxPeakViewerCount: 0,
          lastStreamActivity: null,
        };
  }

  /**
   * Define completion criteria based on campaign properties
   */
  private getCampaignCompletionCriteria(
    campaign: ICampaign,
  ): CampaignCompletionCriteria {
    const criteria: CampaignCompletionCriteria = {};

    // Budget-based completion: 95% of budget used
    criteria.budgetThreshold = 95;

    // Time-based completion: if endDate is set
    if (campaign.endDate) {
      const daysSinceStart = campaign.startDate
        ? Math.floor(
            (Date.now() - new Date(campaign.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;
      criteria.timeBasedDays = daysSinceStart;
    }

    // Impression-based completion: varies by payment type
    if (campaign.paymentType === 'cpm') {
      // For CPM campaigns, target based on budget
      // If budget is $100 and rate is $2 CPM, target = (100 / 2) * 1000 = 50,000 impressions
      criteria.impressionTarget = Math.floor(
        (campaign.budget / campaign.paymentRate) * 1000,
      );
    } else if (campaign.paymentType === 'fixed') {
      // For fixed campaigns, set a reasonable impression target based on budget
      // Assume $0.001 per impression for target calculation
      criteria.impressionTarget = Math.floor(campaign.budget * 1000);
    }

    return criteria;
  }

  /**
   * Evaluate if completion criteria are met
   */
  private evaluateCompletionCriteria(
    campaign: ICampaign,
    metrics: CampaignMetrics,
    criteria: CampaignCompletionCriteria,
  ): CompletionEvaluation {
    // 1. PRIORITY: Impression target reached (PRIMARY COMPLETION CRITERIA)
    if (
      criteria.impressionTarget &&
      metrics.totalImpressions >= criteria.impressionTarget
    ) {
      return {
        isComplete: true,
        reason: `Impression target achieved: ${metrics.totalImpressions}/${criteria.impressionTarget} impressions completed`,
      };
    }

    // 2. Budget exhaustion check (secondary)
    const budgetUsedPercentage =
      ((campaign.budget - campaign.remainingBudget) / campaign.budget) * 100;
    if (
      criteria.budgetThreshold &&
      budgetUsedPercentage >= criteria.budgetThreshold
    ) {
      return {
        isComplete: true,
        reason: `Budget threshold reached: ${budgetUsedPercentage.toFixed(1)}% of budget used`,
      };
    }

    // 3. Remaining budget too low for meaningful activity
    if (campaign.remainingBudget <= 0) {
      return {
        isComplete: true,
        reason: 'Campaign budget exhausted',
      };
    }

    // 4. End date reached
    if (campaign.endDate && new Date() >= new Date(campaign.endDate)) {
      return {
        isComplete: true,
        reason: 'Campaign end date reached',
      };
    }

    // 5. Inactivity check - no active participants and no recent activity
    if (metrics.activeParticipants === 0 && metrics.totalParticipants > 0) {
      const daysSinceLastActivity = metrics.lastStreamActivity
        ? Math.floor(
            (Date.now() - new Date(metrics.lastStreamActivity).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      // Complete if no activity for 7 days and campaign has had participants
      if (daysSinceLastActivity >= 7) {
        return {
          isComplete: true,
          reason: `Campaign inactive: no active participants for ${daysSinceLastActivity} days`,
        };
      }
    }

    // 6. Low budget remaining for CPM campaigns
    if (campaign.paymentType === 'cpm') {
      const minImpressionCost = campaign.paymentRate / 1000; // Cost per impression
      if (campaign.remainingBudget < minImpressionCost * 100) {
        // Less than 100 impressions worth
        return {
          isComplete: true,
          reason: `Insufficient budget remaining for meaningful CPM activity (${campaign.remainingBudget.toFixed(2)} remaining)`,
        };
      }
    }

    return { isComplete: false };
  }

  /**
   * Mark campaign as completed and handle cleanup
   */
  private async completeCampaign(
    campaign: ICampaign,
    reason: string,
  ): Promise<void> {
    try {
      const campaignId = campaign._id.toString();

      // Get all active participants before completing them
      const activeParticipations = await this.participationModel
        .find({
          campaignId: new Types.ObjectId(campaignId),
          status: ParticipationStatus.ACTIVE,
        })
        .exec();

      this.logger.log(
        `Starting campaign completion for ${campaignId} with ${activeParticipations.length} active participants`,
      );

      // Calculate earnings for each participant and transfer to withdrawable balance
      const earningsPromises = activeParticipations.map(
        async (participation) => {
          const streamerId = participation.streamerId.toString();
          const impressions = participation.impressions || 0;

          // Calculate earnings based on campaign payment model
          let earnings = 0;
          if (campaign.paymentType === 'cpm') {
            // CPM = Cost Per Mille (per 1000 impressions)
            earnings = (impressions / 1000) * campaign.paymentRate;
          } else if (campaign.paymentType === 'fixed') {
            // Fixed payment - distribute based on impression contribution
            const totalImpressions = activeParticipations.reduce(
              (sum, p) => sum + (p.impressions || 0),
              0,
            );
            if (totalImpressions > 0) {
              earnings =
                (impressions / totalImpressions) * campaign.paymentRate;
            }
          }

          // Round earnings to 2 decimal places
          earnings = Math.round(earnings * 100) / 100;

          if (earnings > 0) {
            try {
              // Transfer earnings to streamer's withdrawable balance
              await this.walletService.creditEarnings(
                streamerId,
                campaignId,
                earnings,
                0, // No hold period for campaign completion earnings
                'system', // Created by system
              );

              this.logger.log(
                `Credited $${earnings} to streamer ${streamerId} for campaign ${campaignId} (${impressions} impressions)`,
              );

              // Update participation with final earnings
              await this.participationModel.findByIdAndUpdate(
                participation._id,
                {
                  finalEarnings: earnings,
                  earningsTransferredAt: new Date(),
                },
              );

              return { streamerId, earnings, impressions };
            } catch (error) {
              this.logger.error(
                `Failed to transfer earnings to streamer ${streamerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              );
              return {
                streamerId,
                earnings: 0,
                impressions,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          }

          return { streamerId, earnings: 0, impressions };
        },
      );

      // Wait for all earnings transfers to complete
      const earningsResults = await Promise.allSettled(earningsPromises);
      const successfulTransfers = earningsResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      const totalEarningsTransferred = successfulTransfers.reduce(
        (sum, result) => sum + result.earnings,
        0,
      );

      // Update campaign status to completed
      await this.campaignModel
        .findByIdAndUpdate(
          campaignId,
          {
            status: CampaignStatus.COMPLETED,
            completedAt: new Date(),
            completionReason: reason,
            finalEarningsTransferred: totalEarningsTransferred,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();

      // Complete all active participations
      await this.participationModel
        .updateMany(
          {
            campaignId: new Types.ObjectId(campaignId),
            status: ParticipationStatus.ACTIVE,
          },
          {
            status: ParticipationStatus.COMPLETED,
            leftAt: new Date(),
            completedAt: new Date(),
          },
        )
        .exec();

      // Release G-keys for all participants who were actively in the campaign
      const gKeyReleasePromises = activeParticipations.map(
        async (participation) => {
          try {
            await this.gKeyService.releaseKey(
              participation.streamerId.toString(),
              campaignId,
              campaign.gKeyCooloffHours || 720, // Default to 720 hours (30 days)
            );
            this.logger.debug(
              `Released G-key for streamer ${participation.streamerId.toString()} from completed campaign ${campaignId}`,
            );
          } catch (error) {
            this.logger.warn(
              `Failed to release G-key for streamer ${participation.streamerId.toString()} from campaign ${campaignId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            // Don't throw here, continue with other cleanup
          }
        },
      );

      // Wait for all G-key releases to complete (or fail gracefully)
      await Promise.allSettled(gKeyReleasePromises);

      // Handle financial cleanup - release remaining budget
      try {
        await this.campaignEventsService.handleCampaignCompletion(campaignId);
      } catch (error) {
        this.logger.error(
          `Error handling campaign completion finances for ${campaignId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      // Emit campaign completion event
      this.eventEmitter.emit('campaign.auto_completed', {
        campaignId,
        campaignName: campaign.title,
        brandId: campaign.brandId,
        reason,
        completedAt: new Date(),
        finalMetrics: await this.getCampaignMetrics(campaignId),
        participantsReleased: activeParticipations.length,
      });

      this.logger.log(
        `Campaign ${campaignId} (${campaign.title}) automatically completed: ${reason}. Released G-keys for ${activeParticipations.length} participants.`,
      );
    } catch (error) {
      this.logger.error(
        `Error completing campaign ${campaign._id.toString()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get completion status for a specific campaign (for API endpoints)
   */
  async getCampaignCompletionStatus(campaignId: string) {
    try {
      const campaign = await this.campaignModel.findById(campaignId).exec();
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const metrics = await this.getCampaignMetrics(campaignId);
      const criteria = this.getCampaignCompletionCriteria(campaign);
      const evaluation = this.evaluateCompletionCriteria(
        campaign,
        metrics,
        criteria,
      );

      const budgetUsedPercentage =
        ((campaign.budget - campaign.remainingBudget) / campaign.budget) * 100;

      return {
        campaignId,
        status: campaign.status,
        isEligibleForCompletion: evaluation.isComplete,
        completionReason: evaluation.reason,
        metrics: {
          ...metrics,
          budgetUsedPercentage: budgetUsedPercentage.toFixed(1),
          remainingBudget: campaign.remainingBudget,
        },
        criteria,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error getting completion status for campaign ${campaignId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get campaign completion details including earnings for a specific user
   */
  async getCampaignCompletionDetails(campaignId: string, userId: string) {
    try {
      const campaign = await this.campaignModel.findById(campaignId).exec();
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get user's participation in this campaign
      const participation = await this.participationModel
        .findOne({
          campaignId: new Types.ObjectId(campaignId),
          streamerId: new Types.ObjectId(userId),
        })
        .exec();

      if (!participation) {
        throw new Error('User not found in this campaign');
      }

      // Calculate earnings if campaign is completed
      let earnings = 0;
      let earningsCalculation: EarningsCalculation | null = null;

      if (campaign.status === CampaignStatus.COMPLETED) {
        const impressions = participation.impressions || 0;

        if (campaign.paymentType === 'cpm') {
          earnings = (impressions / 1000) * campaign.paymentRate;
          earningsCalculation = {
            impressions,
            paymentRate: campaign.paymentRate,
            formula: 'CPM: (impressions / 1000) × rate',
            calculation: `(${impressions} / 1000) × $${campaign.paymentRate} = $${earnings.toFixed(2)}`,
          };
        } else if (campaign.paymentType === 'fixed') {
          // Get total impressions from all participants for fixed payment distribution
          const allParticipations = await this.participationModel
            .find({
              campaignId: new Types.ObjectId(campaignId),
              status: ParticipationStatus.COMPLETED,
            })
            .exec();

          const totalImpressions = allParticipations.reduce(
            (sum, p) => sum + (p.impressions || 0),
            0,
          );

          if (totalImpressions > 0) {
            earnings = (impressions / totalImpressions) * campaign.paymentRate;
            earningsCalculation = {
              impressions,
              totalImpressions,
              paymentRate: campaign.paymentRate,
              formula: 'Fixed: (user impressions / total impressions) × rate',
              calculation: `(${impressions} / ${totalImpressions}) × $${campaign.paymentRate} = $${earnings.toFixed(2)}`,
            };
          }
        }

        earnings = Math.round(earnings * 100) / 100;
      }

      // Get campaign metrics
      const metrics = await this.getCampaignMetrics(campaignId);
      const criteria = this.getCampaignCompletionCriteria(campaign);

      return {
        campaignId,
        campaignTitle: campaign.title,
        campaignStatus: campaign.status,
        completedAt: campaign.completedAt,
        completionReason: campaign.completionReason,

        // User-specific data
        userParticipation: {
          participationId: participation._id,
          status: participation.status,
          joinedAt: participation.createdAt,
          leftAt: participation.leftAt,
          completedAt: participation.completedAt,
          impressions: participation.impressions || 0,
          clicks: participation.clicks || 0,
          finalEarnings: participation.finalEarnings || earnings,
          earningsTransferredAt: participation.earningsTransferredAt,
        },

        // Earnings information
        earnings: {
          amount: participation.finalEarnings || earnings,
          calculation: earningsCalculation,
          transferredToWallet: !!participation.earningsTransferredAt,
          transferredAt: participation.earningsTransferredAt,
        },

        // Campaign completion criteria and metrics
        completionCriteria: {
          impressionTarget: criteria.impressionTarget,
          impressionTargetMet:
            metrics.totalImpressions >= (criteria.impressionTarget || 0),
          budgetThreshold: criteria.budgetThreshold,
          budgetThresholdMet:
            ((campaign.budget - campaign.remainingBudget) / campaign.budget) *
              100 >=
            (criteria.budgetThreshold || 100),
        },

        // Overall campaign metrics
        campaignMetrics: {
          totalImpressions: metrics.totalImpressions,
          totalClicks: metrics.totalClicks,
          totalParticipants: metrics.totalParticipants,
          totalEarningsTransferred: campaign.finalEarningsTransferred || 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting completion details for campaign ${campaignId}, user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Debug method to get detailed impression data for a campaign
   */
  async debugCampaignImpressions(campaignId: string) {
    try {
      this.logger.debug(
        `=== DEBUG: Campaign ${campaignId} impression analysis ===`,
      );

      // Get campaign details
      const campaign = await this.campaignModel.findById(campaignId).exec();
      if (!campaign) {
        return { error: 'Campaign not found', campaignId };
      }

      // Get all participations for this campaign
      const participations = await this.participationModel
        .find({ campaignId: new Types.ObjectId(campaignId) })
        .exec();

      // Calculate metrics using the same logic as completion check
      const metrics = await this.getCampaignMetrics(campaignId);

      // Calculate impression target
      const impressionTarget = Math.ceil(
        (campaign.budget / campaign.paymentRate) * 1000,
      );

      return {
        campaignId,
        campaignTitle: campaign.title,
        campaignStatus: campaign.status,
        paymentType: campaign.paymentType,
        paymentRate: campaign.paymentRate,
        budget: campaign.budget,
        remainingBudget: campaign.remainingBudget,
        impressionTarget,
        metrics,
        participations: participations.map((p) => ({
          id: p._id,
          streamerId: p.streamerId,
          impressions: p.impressions || 0,
          clicks: p.clicks || 0,
          status: p.status,
          createdAt: p.createdAt,
        })),
        completionCriteria: {
          impressionTargetMet: metrics.totalImpressions >= impressionTarget,
          budgetThresholdMet:
            ((campaign.budget - campaign.remainingBudget) / campaign.budget) *
              100 >=
            95,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in debug impression analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
      };
    }
  }
}
