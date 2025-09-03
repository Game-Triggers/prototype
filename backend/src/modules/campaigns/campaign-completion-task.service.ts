import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CampaignCompletionService } from './campaign-completion.service';

@Injectable()
export class CampaignCompletionTaskService implements OnModuleInit {
  private readonly logger = new Logger(CampaignCompletionTaskService.name);

  constructor(
    private readonly campaignCompletionService: CampaignCompletionService,
  ) {
    this.logger.debug('=== CampaignCompletionTaskService constructed successfully ===');
    this.logger.debug(`CampaignCompletionService instance: ${this.campaignCompletionService.constructor.name}`);
  }

  onModuleInit() {
    this.logger.debug(
      '=== CampaignCompletionTaskService onModuleInit called ===',
    );
  }

  /**
   * Run every 5 minutes to check campaigns for completion criteria
   */
  @Interval(300000) // Run every 5 minutes (300,000 milliseconds)
  async checkCampaignCompletions() {
    this.logger.debug('Running campaign completion check task');
    this.logger.debug(
      `Service instance: ${this.campaignCompletionService.constructor.name}`,
    );

    try {
      this.logger.debug('About to call checkAllCampaignsForCompletion');
      await this.campaignCompletionService.checkAllCampaignsForCompletion();
      this.logger.debug(
        'Campaign completion check task completed successfully',
      );
    } catch (error) {
      this.logger.error(
        `Error in campaign completion check task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Manual trigger for campaign completion check (for testing/admin use)
   */
  async triggerManualCheck(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Manual campaign completion check triggered');

    try {
      await this.campaignCompletionService.checkAllCampaignsForCompletion();
      return {
        success: true,
        message: 'Campaign completion check completed successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Manual campaign completion check failed: ${errorMessage}`,
      );
      return {
        success: false,
        message: `Campaign completion check failed: ${errorMessage}`,
      };
    }
  }
}
