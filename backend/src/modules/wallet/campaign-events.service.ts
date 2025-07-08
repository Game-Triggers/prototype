import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from './wallet.service';
import { PaymentService } from './payment.service';
import { ICampaign, CampaignStatus } from '@schemas/campaign.schema';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import {
  IWallet,
  TransactionType,
  TransactionStatus,
} from '@schemas/wallet.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CampaignEventsService {
  private readonly logger = new Logger(CampaignEventsService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Handle campaign activation - Reserve funds from brand wallet
   */
  async handleCampaignActivation(campaignId: string): Promise<void> {
    try {
      this.logger.log(
        `Processing campaign activation for campaign: ${campaignId}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Check if funds are already reserved
      const existingReservation =
        await this.walletService.getTransactionHistory(
          campaign.brandId.toString(),
          1,
          0,
          TransactionType.CAMPAIGN_RESERVE,
        );

      if (existingReservation.transactions.length > 0) {
        this.logger.warn(`Funds already reserved for campaign: ${campaignId}`);
        return;
      }

      // Reserve campaign budget from brand wallet
      await this.walletService.reserveCampaignFunds(
        campaign.brandId.toString(),
        campaignId,
        campaign.budget,
        'system',
      );

      // Update campaign status to active if it was draft
      if (campaign.status === CampaignStatus.DRAFT) {
        await this.campaignModel.findByIdAndUpdate(campaignId, {
          status: CampaignStatus.ACTIVE,
        });
      }

      this.logger.log(
        `Successfully reserved ${campaign.budget} for campaign: ${campaignId}`,
      );

      // Emit event for notifications
      this.eventEmitter.emit('campaign.activated', {
        campaignId,
        brandId: campaign.brandId,
        budget: campaign.budget,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle campaign activation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign milestone completion - Credit earnings to streamer
   */
  async handleMilestoneCompletion(
    campaignId: string,
    streamerId: string,
    milestoneType: string,
    amount: number,
    metadata?: any,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing milestone completion for campaign: ${campaignId}, streamer: ${streamerId}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Check if streamer is participating in campaign
      const participation = await this.participationModel.findOne({
        campaignId,
        streamerId,
        status: ParticipationStatus.ACTIVE,
      });

      if (!participation) {
        this.logger.error(
          `Active participation not found for streamer: ${streamerId} in campaign: ${campaignId}`,
        );
        return;
      }

      // Calculate earning amount based on milestone type
      let earningAmount = amount;
      if (milestoneType === 'impression' && campaign.paymentType === 'cpm') {
        // CPM calculation: (impressions / 1000) * rate
        earningAmount = (amount / 1000) * campaign.paymentRate;
      } else if (milestoneType === 'fixed') {
        earningAmount = campaign.paymentRate;
      }

      // Credit earnings to streamer wallet with hold period
      await this.walletService.creditEarnings(
        streamerId,
        campaignId,
        earningAmount,
        3,
        'system',
      );

      // Charge the reserved funds from brand wallet
      await this.walletService.chargeCampaignFunds(
        campaign.brandId.toString(),
        campaignId,
        earningAmount,
        milestoneType,
        'system',
      );

      // Update remaining budget
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        $inc: { remainingBudget: -earningAmount },
      });

      this.logger.log(
        `Successfully processed milestone: ${milestoneType}, amount: ${earningAmount}`,
      );

      // Emit events for notifications
      this.eventEmitter.emit('earnings.credited', {
        streamerId,
        campaignId,
        amount: earningAmount,
        milestoneType,
      });

      this.eventEmitter.emit('campaign.funds.charged', {
        brandId: campaign.brandId,
        campaignId,
        amount: earningAmount,
        streamerId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle milestone completion: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign completion - Release any remaining funds
   */
  async handleCampaignCompletion(campaignId: string): Promise<void> {
    try {
      this.logger.log(
        `Processing campaign completion for campaign: ${campaignId}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Release any remaining reserved funds back to brand wallet
      const reservedFunds = await this.walletService.getReservedFunds(
        campaign.brandId.toString(),
        campaignId,
      );

      if (reservedFunds > 0) {
        await this.walletService.releaseReservedFunds(
          campaign.brandId.toString(),
          campaignId,
          reservedFunds,
        );

        this.logger.log(
          `Released ${reservedFunds} reserved funds back to brand wallet`,
        );
      }

      // Update campaign status
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        status: CampaignStatus.COMPLETED,
      });

      // Release earnings from hold period for all participating streamers
      const participations = await this.participationModel.find({
        campaignId,
        status: ParticipationStatus.ACTIVE,
      });

      for (const participation of participations) {
        await this.walletService.releaseEarningsForCampaign(
          participation.streamerId.toString(),
          campaignId,
        );
      }

      this.logger.log(`Successfully completed campaign: ${campaignId}`);

      // Emit event for notifications
      this.eventEmitter.emit('campaign.completed', {
        campaignId,
        brandId: campaign.brandId,
        participantCount: participations.length,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle campaign completion: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign cancellation - Refund reserved funds and cancel earnings
   */
  async handleCampaignCancellation(campaignId: string): Promise<void> {
    try {
      this.logger.log(
        `Processing campaign cancellation for campaign: ${campaignId}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Release all reserved funds back to brand wallet
      const reservedFunds = await this.walletService.getReservedFunds(
        campaign.brandId.toString(),
        campaignId,
      );

      if (reservedFunds > 0) {
        await this.walletService.releaseReservedFunds(
          campaign.brandId.toString(),
          campaignId,
          reservedFunds,
        );
      }

      // Cancel any held earnings for participating streamers
      const participations = await this.participationModel.find({
        campaignId,
        status: ParticipationStatus.ACTIVE,
      });

      for (const participation of participations) {
        await this.walletService.cancelHeldEarnings(
          participation.streamerId.toString(),
          campaignId,
        );
      }

      // Update campaign status
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        status: CampaignStatus.CANCELLED,
      });

      this.logger.log(`Successfully cancelled campaign: ${campaignId}`);

      // Emit event for notifications
      this.eventEmitter.emit('campaign.cancelled', {
        campaignId,
        brandId: campaign.brandId,
        refundAmount: reservedFunds,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle campaign cancellation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle low budget warning - Check if campaign needs budget top-up
   */
  async checkLowBudgetWarning(campaignId: string): Promise<void> {
    try {
      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) return;

      const lowBudgetThreshold = campaign.budget * 0.1; // 10% of original budget

      if (campaign.remainingBudget <= lowBudgetThreshold) {
        this.logger.warn(`Low budget warning for campaign: ${campaignId}`);

        // Check brand's auto top-up settings
        const shouldTopUp = await this.walletService.checkAutoTopup(
          campaign.brandId.toString(),
        );

        if (shouldTopUp) {
          // Trigger auto top-up process
          await this.paymentService.processAutoTopUp(
            campaign.brandId.toString(),
            campaign.budget * 0.5, // Top up 50% of original budget
          );

          this.logger.log(
            `Auto top-up triggered for brand: ${campaign.brandId}`,
          );
        }

        // Emit warning event
        this.eventEmitter.emit('campaign.budget.low', {
          campaignId,
          brandId: campaign.brandId,
          remainingBudget: campaign.remainingBudget,
          threshold: lowBudgetThreshold,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to check low budget warning: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle impression tracking - Trigger milestone completion
   */
  async handleImpressionTracking(
    campaignId: string,
    streamerId: string,
    impressions: number,
  ): Promise<void> {
    try {
      // Trigger milestone completion for impressions
      await this.handleMilestoneCompletion(
        campaignId,
        streamerId,
        'impression',
        impressions,
        { impressions },
      );

      // Check for low budget warning
      await this.checkLowBudgetWarning(campaignId);
    } catch (error) {
      this.logger.error(
        `Failed to handle impression tracking: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign budget increase - Reserve additional funds
   */
  async handleBudgetIncrease(
    campaignId: string,
    increaseAmount: number,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing budget increase for campaign: ${campaignId}, amount: ${increaseAmount}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Reserve additional funds from brand wallet
      await this.walletService.reserveCampaignFunds(
        campaign.brandId.toString(),
        campaignId,
        increaseAmount,
        'system',
      );

      this.logger.log(
        `Successfully reserved additional ${increaseAmount} for campaign: ${campaignId}`,
      );

      // Emit event for notifications
      this.eventEmitter.emit('campaign.budget.increased', {
        campaignId,
        brandId: campaign.brandId,
        increaseAmount,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle budget increase: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign budget decrease - Release excess reserved funds
   */
  async handleBudgetDecrease(
    campaignId: string,
    decreaseAmount: number,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing budget decrease for campaign: ${campaignId}, amount: ${decreaseAmount}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Get current reserved funds for this campaign
      const reservedFunds = await this.walletService.getReservedFunds(
        campaign.brandId.toString(),
        campaignId,
      );

      // Only release up to the amount that's actually reserved
      const releaseAmount = Math.min(decreaseAmount, reservedFunds);

      if (releaseAmount > 0) {
        await this.walletService.releaseReservedFunds(
          campaign.brandId.toString(),
          campaignId,
          releaseAmount,
        );

        this.logger.log(
          `Successfully released ${releaseAmount} reserved funds for campaign: ${campaignId}`,
        );
      }

      // Emit event for notifications
      this.eventEmitter.emit('campaign.budget.decreased', {
        campaignId,
        brandId: campaign.brandId,
        decreaseAmount,
        releasedAmount: releaseAmount,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle budget decrease: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign pause - Log pause event
   */
  async handleCampaignPause(campaignId: string): Promise<void> {
    try {
      this.logger.log(`Processing campaign pause for campaign: ${campaignId}`);

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Emit event for notifications
      this.eventEmitter.emit('campaign.paused', {
        campaignId,
        brandId: campaign.brandId,
      });

      this.logger.log(`Successfully paused campaign: ${campaignId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle campaign pause: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle campaign resume - Log resume event
   */
  async handleCampaignResume(campaignId: string): Promise<void> {
    try {
      this.logger.log(`Processing campaign resume for campaign: ${campaignId}`);

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Emit event for notifications
      this.eventEmitter.emit('campaign.resumed', {
        campaignId,
        brandId: campaign.brandId,
      });

      this.logger.log(`Successfully resumed campaign: ${campaignId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle campaign resume: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle early participation end - Release held earnings immediately
   */
  async handleEarlyParticipationEnd(
    campaignId: string,
    streamerId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing early participation end for campaign: ${campaignId}, streamer: ${streamerId}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      // Release held earnings immediately instead of waiting for campaign completion
      await this.walletService.releaseEarningsForCampaign(
        streamerId,
        campaignId,
      );

      this.logger.log(
        `Successfully released held earnings for early participation end: ${streamerId}`,
      );

      // Emit event for notifications
      this.eventEmitter.emit('participation.ended.early', {
        campaignId,
        streamerId,
        brandId: campaign.brandId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle early participation end: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle streamer removal - Handle earnings based on removal reason
   */
  async handleStreamerRemoval(
    campaignId: string,
    streamerId: string,
    reason: 'violation' | 'fraud' | 'admin_decision' | 'brand_decision',
    forfeitEarnings: boolean = false,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing streamer removal for campaign: ${campaignId}, streamer: ${streamerId}, reason: ${reason}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        this.logger.error(`Campaign not found: ${campaignId}`);
        return;
      }

      if (forfeitEarnings) {
        // Cancel held earnings (streamer loses earnings due to violation/fraud)
        await this.walletService.cancelHeldEarnings(streamerId, campaignId);
        this.logger.log(
          `Forfeited held earnings for streamer removal: ${streamerId}`,
        );
      } else {
        // Release held earnings (removal not due to streamer fault)
        await this.walletService.releaseEarningsForCampaign(
          streamerId,
          campaignId,
        );
        this.logger.log(
          `Released held earnings for streamer removal: ${streamerId}`,
        );
      }

      // Emit event for notifications
      this.eventEmitter.emit('streamer.removed', {
        campaignId,
        streamerId,
        brandId: campaign.brandId,
        reason,
        forfeitEarnings,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle streamer removal: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle participation pause - Log pause event
   */
  async handleParticipationPause(
    campaignId: string,
    streamerId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing participation pause for campaign: ${campaignId}, streamer: ${streamerId}`,
      );

      // No monetary action needed - just logging and event emission
      // Held earnings remain in hold, impression tracking will be stopped by participation status

      // Emit event for notifications
      this.eventEmitter.emit('participation.paused', {
        campaignId,
        streamerId,
      });

      this.logger.log(`Successfully paused participation: ${streamerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle participation pause: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle participation resume - Log resume event
   */
  async handleParticipationResume(
    campaignId: string,
    streamerId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing participation resume for campaign: ${campaignId}, streamer: ${streamerId}`,
      );

      // No monetary action needed - just logging and event emission
      // Impression tracking will resume when participation status becomes active

      // Emit event for notifications
      this.eventEmitter.emit('participation.resumed', {
        campaignId,
        streamerId,
      });

      this.logger.log(`Successfully resumed participation: ${streamerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle participation resume: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
