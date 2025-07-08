import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICampaign, CampaignStatus } from '@schemas/campaign.schema';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { CampaignEventsService } from './campaign-events.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AdminCampaignService {
  private readonly logger = new Logger(AdminCampaignService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly campaignEventsService: CampaignEventsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Admin force completes a campaign regardless of normal completion rules
   */
  async forceCampaignCompletion(
    campaignId: string,
    adminId: string,
    reason: string,
  ): Promise<ICampaign> {
    try {
      this.logger.log(
        `Admin ${adminId} force completing campaign ${campaignId}: ${reason}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new NotFoundException(`Campaign not found: ${campaignId}`);
      }

      if (campaign.status === CampaignStatus.COMPLETED) {
        throw new BadRequestException('Campaign is already completed');
      }

      // Force complete the campaign with admin override
      await this.campaignEventsService.handleCampaignCompletion(campaignId);

      // Update campaign with admin action metadata
      const updatedCampaign = await this.campaignModel.findByIdAndUpdate(
        campaignId,
        {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
          completedBy: adminId,
          completionReason: reason,
          adminForceCompleted: true,
        },
        { new: true },
      );

      if (!updatedCampaign) {
        throw new NotFoundException('Failed to update campaign status');
      }

      this.logger.log(`Successfully force completed campaign: ${campaignId}`);

      // Emit event for audit and notifications
      this.eventEmitter.emit('admin.campaign.force.completed', {
        adminId,
        campaignId,
        reason,
        brandId: campaign.brandId,
      });

      return updatedCampaign;
    } catch (error) {
      this.logger.error(
        `Failed to force complete campaign: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin force cancels a campaign with custom handling
   */
  async forceCampaignCancellation(
    campaignId: string,
    adminId: string,
    reason: string,
    refundFunds: boolean = true,
  ): Promise<ICampaign> {
    try {
      this.logger.log(
        `Admin ${adminId} force cancelling campaign ${campaignId}: ${reason}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new NotFoundException(`Campaign not found: ${campaignId}`);
      }

      if (campaign.status === CampaignStatus.CANCELLED) {
        throw new BadRequestException('Campaign is already cancelled');
      }

      // Handle monetary cleanup based on admin decision
      if (refundFunds) {
        await this.campaignEventsService.handleCampaignCancellation(campaignId);
      } else {
        // Admin chooses not to refund (e.g., for policy violations)
        // Only cancel held earnings, keep reserved funds
        const participations = await this.participationModel.find({
          campaignId,
          status: ParticipationStatus.ACTIVE,
        });

        for (const participation of participations) {
          await this.campaignEventsService.handleStreamerRemoval(
            campaignId,
            participation.streamerId.toString(),
            'admin_decision',
            true, // forfeit earnings
          );
        }
      }

      // Update campaign with admin action metadata
      const updatedCampaign = await this.campaignModel.findByIdAndUpdate(
        campaignId,
        {
          status: CampaignStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: adminId,
          cancellationReason: reason,
          adminForceCancelled: true,
          refundProvided: refundFunds,
        },
        { new: true },
      );

      if (!updatedCampaign) {
        throw new NotFoundException('Failed to update campaign status');
      }

      this.logger.log(`Successfully force cancelled campaign: ${campaignId}`);

      // Emit event for audit and notifications
      this.eventEmitter.emit('admin.campaign.force.cancelled', {
        adminId,
        campaignId,
        reason,
        refundProvided: refundFunds,
        brandId: campaign.brandId,
      });

      return updatedCampaign;
    } catch (error) {
      this.logger.error(
        `Failed to force cancel campaign: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin overrides campaign budget without requiring brand payment
   */
  async overrideCampaignBudget(
    campaignId: string,
    newBudget: number,
    adminId: string,
    reason: string,
  ): Promise<ICampaign> {
    try {
      this.logger.log(
        `Admin ${adminId} overriding campaign budget ${campaignId}: ${newBudget}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new NotFoundException(`Campaign not found: ${campaignId}`);
      }

      if (newBudget <= 0) {
        throw new BadRequestException('New budget must be positive');
      }

      const oldBudget = campaign.budget;
      const budgetDifference = newBudget - oldBudget;

      // Update campaign budget and remaining budget
      const updatedCampaign = await this.campaignModel.findByIdAndUpdate(
        campaignId,
        {
          budget: newBudget,
          remainingBudget: campaign.remainingBudget + budgetDifference,
          budgetOverriddenBy: adminId,
          budgetOverrideReason: reason,
          budgetOverriddenAt: new Date(),
          originalBudget: oldBudget,
        },
        { new: true },
      );

      if (!updatedCampaign) {
        throw new NotFoundException('Failed to update campaign budget');
      }

      this.logger.log(
        `Successfully overrode campaign budget: ${campaignId} from ${oldBudget} to ${newBudget}`,
      );

      // Note: We don't update wallet reserved balance for admin overrides
      // This is an admin compensation/adjustment, not a brand payment

      // Emit event for audit and notifications
      this.eventEmitter.emit('admin.campaign.budget.overridden', {
        adminId,
        campaignId,
        oldBudget,
        newBudget,
        budgetDifference,
        reason,
        brandId: campaign.brandId,
      });

      return updatedCampaign;
    } catch (error) {
      this.logger.error(
        `Failed to override campaign budget: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin emergency campaign control (activate/deactivate/suspend)
   */
  async emergencyCampaignControl(
    campaignId: string,
    action: 'activate' | 'deactivate' | 'suspend',
    adminId: string,
    reason: string,
  ): Promise<ICampaign> {
    try {
      this.logger.log(
        `Admin ${adminId} emergency campaign control ${campaignId}: ${action} - ${reason}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new NotFoundException(`Campaign not found: ${campaignId}`);
      }

      let newStatus: CampaignStatus;
      let monetaryAction = false;

      switch (action) {
        case 'activate':
          newStatus = CampaignStatus.ACTIVE;
          // Admin activation doesn't require wallet checks (emergency override)
          break;
        case 'deactivate':
          newStatus = CampaignStatus.PAUSED;
          break;
        case 'suspend':
          newStatus = CampaignStatus.CANCELLED;
          monetaryAction = true; // Suspend means cancel with refunds
          break;
        default:
          throw new BadRequestException(`Invalid action: ${action}`);
      }

      // Handle monetary actions if needed
      if (monetaryAction && action === 'suspend') {
        await this.campaignEventsService.handleCampaignCancellation(campaignId);
      }

      // Update campaign status
      const updatedCampaign = await this.campaignModel.findByIdAndUpdate(
        campaignId,
        {
          status: newStatus,
          emergencyControlBy: adminId,
          emergencyControlReason: reason,
          emergencyControlAt: new Date(),
          emergencyAction: action,
        },
        { new: true },
      );

      if (!updatedCampaign) {
        throw new NotFoundException('Failed to update campaign status');
      }

      this.logger.log(
        `Successfully applied emergency control: ${campaignId} - ${action}`,
      );

      // Emit event for audit and notifications
      this.eventEmitter.emit('admin.campaign.emergency.control', {
        adminId,
        campaignId,
        action,
        reason,
        newStatus,
        brandId: campaign.brandId,
      });

      return updatedCampaign;
    } catch (error) {
      this.logger.error(
        `Failed to apply emergency campaign control: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Admin gets comprehensive campaign financial overview
   */
  async getCampaignFinancialOverview(
    campaignId: string,
    adminId: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Admin ${adminId} requesting campaign financial overview: ${campaignId}`,
      );

      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new NotFoundException(`Campaign not found: ${campaignId}`);
      }

      // Get all participations
      const participations = await this.participationModel.find({ campaignId });

      // Calculate financial metrics
      const totalImpressions = participations.reduce(
        (sum, p) => sum + (p.impressions || 0),
        0,
      );
      const totalClicks = participations.reduce(
        (sum, p) => sum + (p.clicks || 0),
        0,
      );
      const totalEstimatedEarnings = participations.reduce(
        (sum, p) => sum + (p.estimatedEarnings || 0),
        0,
      );

      return {
        campaign,
        participations: participations.length,
        metrics: {
          totalImpressions,
          totalClicks,
          totalEstimatedEarnings,
          budgetUtilization:
            ((campaign.budget - campaign.remainingBudget) / campaign.budget) *
            100,
          averageEarningsPerParticipant:
            participations.length > 0
              ? totalEstimatedEarnings / participations.length
              : 0,
        },
        participationDetails: participations,
        investigationTimestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get campaign financial overview: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
