import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ICampaignParticipation } from '@schemas/campaign-participation.schema';

@Injectable()
export class CampaignMonitoringService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CampaignMonitoringService.name);
  private changeStream: any = null;
  private isMonitoring = false;

  constructor(
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('=== CampaignMonitoringService initializing ===');
    // Use setTimeout to avoid blocking module initialization
    setTimeout(() => {
      this.startChangeStreamMonitoring().catch((error) => {
        this.logger.error(
          `Failed to start monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      });
    }, 1000);
  }

  async onModuleDestroy() {
    this.logger.log('=== CampaignMonitoringService shutting down ===');
    await this.stopChangeStreamMonitoring();
  }

  /**
   * Start MongoDB change stream monitoring for campaign participation updates
   */
  private async startChangeStreamMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    try {
      this.logger.log(
        'Starting MongoDB change stream monitoring for campaign participations',
      );

      // Watch for changes in campaign participation collection
      this.changeStream = this.participationModel.watch(
        [
          {
            $match: {
              // Only watch for update operations
              operationType: 'update',
              // Only monitor changes to impression-related fields
              $or: [
                {
                  'updateDescription.updatedFields.impressions': {
                    $exists: true,
                  },
                },
                {
                  'updateDescription.updatedFields.clicks': {
                    $exists: true,
                  },
                },
                {
                  'updateDescription.updatedFields.estimatedEarnings': {
                    $exists: true,
                  },
                },
              ],
            },
          },
        ],
        {
          fullDocument: 'updateLookup', // Get the full document after update
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.changeStream.on('change', (change: any) => {
        this.handleParticipationChange(change);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.changeStream.on('error', (error: any) => {
        this.logger.error(
          `Change stream error: ${error?.message || 'Unknown error'}`,
        );
        // Attempt to restart the change stream after a delay
        setTimeout(() => {
          void this.startChangeStreamMonitoring();
        }, 5000);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.changeStream.on('close', () => {
        this.logger.warn('Change stream closed');
        this.isMonitoring = false;
      });

      this.isMonitoring = true;
      this.logger.log(
        'Campaign participation change stream monitoring started successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to start change stream monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.isMonitoring = false;
    }
  }

  /**
   * Stop MongoDB change stream monitoring
   */
  private async stopChangeStreamMonitoring(): Promise<void> {
    if (this.changeStream) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.changeStream.close();
        this.changeStream = null;
        this.isMonitoring = false;
        this.logger.log('Change stream monitoring stopped');
      } catch (error) {
        this.logger.error(
          `Error closing change stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  /**
   * Handle campaign participation changes detected by the change stream
   */
  private handleParticipationChange(change: any): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const participationId = change.documentKey?._id;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const fullDocument = change.fullDocument;

      if (!fullDocument) {
        this.logger.warn(
          `No full document found for participation change: ${participationId}`,
        );
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const campaignId = fullDocument.campaignId?.toString();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const streamerId = fullDocument.streamerId?.toString();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const newImpressions = fullDocument.impressions || 0;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const updatedFields = change.updateDescription?.updatedFields || {};

      this.logger.debug(
        `Campaign participation updated via database: ${participationId}`,
      );
      this.logger.debug(`Campaign ID: ${campaignId}, Streamer ID: ${streamerId}`);
      this.logger.debug(`New impressions: ${newImpressions}`);
      this.logger.debug(
        `Updated fields: ${JSON.stringify(Object.keys(updatedFields))}`,
      );

      // Check if impressions were updated
      if ('impressions' in updatedFields) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const impressionDifference = updatedFields.impressions || 0;

        this.logger.log(
          `🔍 Database impression update detected for campaign ${campaignId}: +${impressionDifference} impressions (total: ${newImpressions})`,
        );

        // Emit event to trigger campaign completion check
        this.eventEmitter.emit('campaign.check_completion', {
          campaignId,
          triggeredBy: 'database_update',
          participationId: participationId?.toString(),
          streamerId,
          newImpressions,
          impressionDifference,
          timestamp: new Date(),
        });

        // Also emit a specific event for impression updates
        this.eventEmitter.emit('campaign.impression_updated', {
          campaignId,
          participationId: participationId?.toString(),
          streamerId,
          newImpressions,
          impressionDifference,
          updatedFields,
          timestamp: new Date(),
        });
      }

      // Check if earnings were updated
      if ('estimatedEarnings' in updatedFields) {
        this.logger.log(
          `💰 Database earnings update detected for campaign ${campaignId}: ${fullDocument.estimatedEarnings}`,
        );

        this.eventEmitter.emit('campaign.earnings_updated', {
          campaignId,
          participationId: participationId?.toString(),
          streamerId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          newEarnings: fullDocument.estimatedEarnings,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(
        `Error handling participation change: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Manually trigger a check for all active campaigns
   * This can be used for testing or recovery scenarios
   */
  async triggerFullSystemCheck(): Promise<void> {
    this.logger.log('🔄 Manual full system check triggered');

    try {
      // Get all active participations
      const activeParticipations = await this.participationModel
        .find({ status: 'active' })
        .populate('campaignId')
        .exec();

      this.logger.log(
        `Found ${activeParticipations.length} active participations to check`,
      );

      // Group by campaign and trigger completion checks
      const campaignIds = new Set(
        activeParticipations
          .map((p) => p.campaignId?.toString())
          .filter(Boolean),
      );

      for (const campaignId of campaignIds) {
        this.eventEmitter.emit('campaign.check_completion', {
          campaignId,
          triggeredBy: 'manual_system_check',
          timestamp: new Date(),
        });
      }

      this.logger.log(
        `Triggered completion checks for ${campaignIds.size} campaigns`,
      );
    } catch (error) {
      this.logger.error(
        `Error in full system check: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get monitoring status and statistics
   */
  getMonitoringStatus(): {
    isActive: boolean;
    streamStatus: string;
    startTime: Date | null;
  } {
    return {
      isActive: this.isMonitoring,
      streamStatus: this.isMonitoring ? 'active' : 'inactive',
      startTime: this.isMonitoring ? new Date() : null,
    };
  }
}
