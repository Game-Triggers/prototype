import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { ImpressionTrackingService } from './impression-tracking.service';
import { CampaignCompletionService } from '../campaigns/campaign-completion.service';

@Injectable()
export class ImpressionTrackingTaskService {
  private readonly logger = new Logger(ImpressionTrackingTaskService.name);

  constructor(
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly impressionTrackingService: ImpressionTrackingService,
    private readonly campaignCompletionService?: CampaignCompletionService,
  ) {}

  /**
   * Run every minute to update viewer-based impressions for all active participations
   * TEMPORARILY DISABLED FOR TESTING - uncomment @Interval to re-enable
   */
  // @Interval(60000) // Run every minute
  async updateViewerImpressions() {
    this.logger.debug('Running viewer impression update task');

    try {
      // Find all active campaign participations
      const activeParticipations = await this.participationModel
        .find({ status: ParticipationStatus.ACTIVE })
        .exec();

      this.logger.debug(
        `Found ${activeParticipations.length} active participations`,
      );

      // Update viewer impressions for each active participation
      const updatePromises = activeParticipations.map((participation) =>
        this.impressionTrackingService.recordViewerImpressions(
          participation._id.toString(),
        ),
      );

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      this.logger.debug('Viewer impression update completed');

      // After updating impressions, check campaigns for completion if service is available
      if (this.campaignCompletionService) {
        this.logger.debug('Triggering campaign completion check after impression update');
        try {
          // Get unique campaign IDs from active participations
          const campaignIds = [
            ...new Set(
              activeParticipations.map((p) => p.campaignId.toString()),
            ),
          ];

          // Check each affected campaign for completion
          const completionChecks = campaignIds.map((campaignId) =>
            this.campaignCompletionService!.checkCampaignCompletion(campaignId),
          );

          await Promise.all(completionChecks);
          this.logger.debug('Campaign completion check completed');
        } catch (error) {
          this.logger.warn(
            `Error during campaign completion check: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in viewer impression update task: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
