import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { ImpressionTrackingService } from './impression-tracking.service';

@Injectable()
export class ImpressionTrackingTaskService {
  private readonly logger = new Logger(ImpressionTrackingTaskService.name);

  constructor(
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly impressionTrackingService: ImpressionTrackingService,
  ) {}

  /**
   * Run every minute to update viewer-based impressions for all active participations
   */
  @Interval(60000) // Run every minute
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
    } catch (error) {
      this.logger.error(
        `Error in viewer impression update task: ${error.message}`,
      );
    }
  }
}
