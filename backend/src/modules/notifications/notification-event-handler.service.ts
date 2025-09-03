import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationEventHandlerService {
  private readonly logger = new Logger(NotificationEventHandlerService.name);

  constructor(private readonly notificationService: NotificationService) {}

  // Campaign Events

  @OnEvent('campaign.activated')
  async handleCampaignActivated(payload: {
    campaignId: string;
    campaignName: string;
    brandUserId: string;
    budget: number;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.brandUserId,
        payload.campaignId,
        'Campaign Activated',
        `Campaign "${payload.campaignName}" is now active and ready to start earning.`,
        'high',
      );
      this.logger.log(
        `Campaign activation notification sent for campaign ${payload.campaignId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send campaign activation notification: ${error.message}`,
      );
    }
  }

  @OnEvent('campaign.completed')
  async handleCampaignCompleted(payload: {
    campaignId: string;
    campaignName: string;
    brandUserId: string;
    totalSpent: number;
    totalParticipants: number;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.brandUserId,
        payload.campaignId,
        'Campaign Completed',
        `Campaign "${payload.campaignName}" has been completed successfully.`,
        'high',
      );
      this.logger.log(
        `Campaign completion notification sent for campaign ${payload.campaignId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send campaign completion notification: ${error.message}`,
      );
    }
  }

  @OnEvent('campaign.cancelled')
  async handleCampaignCancelled(payload: {
    campaignId: string;
    campaignName: string;
    brandUserId: string;
    reason?: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.brandUserId,
        payload.campaignId,
        'Campaign Cancelled',
        `Campaign "${payload.campaignName}" has been cancelled.`,
        'high',
      );
      this.logger.log(
        `Campaign cancellation notification sent for campaign ${payload.campaignId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send campaign cancellation notification: ${error.message}`,
      );
    }
  }

  @OnEvent('campaign.budget.low')
  async handleCampaignBudgetLow(payload: {
    campaignId: string;
    campaignName: string;
    brandUserId: string;
    remainingBudget: number;
    threshold: number;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.brandUserId,
        payload.campaignId,
        'Low Campaign Budget',
        `Your campaign "${payload.campaignName}" is running low on budget. Remaining: ₹${payload.remainingBudget}`,
        'urgent',
      );
      this.logger.log(
        `Low budget notification sent for campaign ${payload.campaignId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send low budget notification: ${error.message}`,
      );
    }
  }

  @OnEvent('campaign.paused')
  async handleCampaignPaused(payload: {
    campaignId: string;
    campaignName: string;
    brandUserId: string;
    reason?: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.brandUserId,
        payload.campaignId,
        '⏸️ Campaign Paused',
        `Your campaign "${payload.campaignName}" has been paused${payload.reason ? `: ${payload.reason}` : ''}`,
        'medium',
      );
      this.logger.log(
        `Campaign pause notification sent for campaign ${payload.campaignId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send campaign pause notification: ${error.message}`,
      );
    }
  }

  @OnEvent('campaign.resumed')
  async handleCampaignResumed(payload: {
    campaignId: string;
    campaignName: string;
    brandUserId: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.brandUserId,
        payload.campaignId,
        '▶️ Campaign Resumed',
        `Your campaign "${payload.campaignName}" has been resumed and is now active`,
        'medium',
      );
      this.logger.log(
        `Campaign resume notification sent for campaign ${payload.campaignId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send campaign resume notification: ${error.message}`,
      );
    }
  }

  // Earnings Events

  @OnEvent('earnings.credited')
  async handleEarningsCredited(payload: {
    userId: string;
    amount: number;
    campaignId?: string;
    campaignName?: string;
    reason: string;
  }) {
    try {
      const message = payload.campaignName
        ? `You've earned ₹${payload.amount} from campaign "${payload.campaignName}"`
        : `You've earned ₹${payload.amount}`;

      await this.notificationService.createEarningsNotification(
        payload.userId,
        payload.amount,
        payload.campaignId,
        'high',
      );
      this.logger.log(
        `Earnings notification sent to user ${payload.userId} for ₹${payload.amount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send earnings notification: ${error.message}`,
      );
    }
  }

  // Participation Events

  @OnEvent('participation.ended.early')
  async handleParticipationEndedEarly(payload: {
    userId: string;
    campaignId: string;
    campaignName: string;
    reason: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.userId,
        payload.campaignId,
        'Participation Ended',
        `Your participation in "${payload.campaignName}" has ended early: ${payload.reason}`,
        'high',
      );
      this.logger.log(
        `Early participation end notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send early participation end notification: ${error.message}`,
      );
    }
  }

  @OnEvent('participation.paused')
  async handleParticipationPaused(payload: {
    userId: string;
    campaignId: string;
    campaignName: string;
    reason: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.userId,
        payload.campaignId,
        '⏸️ Participation Paused',
        `Your participation in "${payload.campaignName}" has been paused: ${payload.reason}`,
        'medium',
      );
      this.logger.log(
        `Participation pause notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send participation pause notification: ${error.message}`,
      );
    }
  }

  @OnEvent('participation.resumed')
  async handleParticipationResumed(payload: {
    userId: string;
    campaignId: string;
    campaignName: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.userId,
        payload.campaignId,
        '▶️ Participation Resumed',
        `Your participation in "${payload.campaignName}" has been resumed`,
        'medium',
      );
      this.logger.log(
        `Participation resume notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send participation resume notification: ${error.message}`,
      );
    }
  }

  @OnEvent('streamer.removed')
  async handleStreamerRemoved(payload: {
    userId: string;
    campaignId: string;
    campaignName: string;
    reason: string;
  }) {
    try {
      await this.notificationService.createCampaignNotification(
        payload.userId,
        payload.campaignId,
        'Removed from Campaign',
        `You have been removed from campaign "${payload.campaignName}": ${payload.reason}`,
        'high',
      );
      this.logger.log(
        `Streamer removal notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send streamer removal notification: ${error.message}`,
      );
    }
  }

  // Campaign Joining Events
  @OnEvent('campaign.joined')
  async handleCampaignJoined(payload: {
    campaignId: string;
    campaignName: string;
    streamerId: string;
    streamerName: string;
    participationId: string;
    browserSourceUrl: string;
  }) {
    console.log('Campaign joined event received:', payload);
    try {
      const notification =
        await this.notificationService.createCampaignNotification(
          payload.streamerId,
          payload.campaignId,
          'Campaign Participation Confirmed',
          `You have successfully joined the campaign "${payload.campaignName}". Your browser source has been configured and is ready for use.`,
          'high',
        );
      console.log('Campaign joined notification created:', notification);
    } catch (error) {
      console.error('Error handling campaign.joined event:', error);
    }
  }

  // System Events for New Campaign Availability
  @OnEvent('campaign.published')
  async handleCampaignPublished(payload: {
    campaignId: string;
    campaignName: string;
    category: string;
    requiredViewers: number;
    payoutPerHour: number;
  }) {
    try {
      // Here we would typically find users who match the campaign criteria
      // For now, this is a placeholder - you would need to implement user matching logic
      this.logger.log(
        `New campaign published: ${payload.campaignName} - would notify eligible streamers`,
      );

      // Example: Find users with matching categories/viewer counts
      // const eligibleUsers = await this.findEligibleUsers(payload);
      // for (const user of eligibleUsers) {
      //   await this.notificationService.createCampaignNotification(
      //     user.id,
      //     payload.campaignId,
      //     '🎯 New Campaign Available',
      //     `A new campaign "${payload.campaignName}" is available! Payout: ₹${payload.payoutPerHour}/hour`,
      //     'medium'
      //   );
      // }
    } catch (error) {
      this.logger.error(
        `Failed to send new campaign notifications: ${error.message}`,
      );
    }
  }

  // Energy Pack Events (based on your streak system)
  @OnEvent('energy.pack.expiring')
  async handleEnergyPackExpiring(payload: {
    userId: string;
    packType: string;
    expiresAt: Date;
    hoursRemaining: number;
  }) {
    try {
      await this.notificationService.createSystemNotification(
        payload.userId,
        'Energy Pack Expiring',
        `Your ${payload.packType} energy pack expires in ${payload.hoursRemaining} hours`,
        'medium',
        '/dashboard/energy-packs',
      );
      this.logger.log(
        `Energy pack expiring notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send energy pack expiring notification: ${error.message}`,
      );
    }
  }

  @OnEvent('streak.warning')
  async handleStreakWarning(payload: {
    userId: string;
    currentStreak: number;
    hoursUntilBreak: number;
  }) {
    try {
      await this.notificationService.createSystemNotification(
        payload.userId,
        'Streak at Risk',
        `Your ${payload.currentStreak}-day streaming streak is at risk! Stream today to maintain it.`,
        'urgent',
        '/dashboard/streak',
      );
      this.logger.log(
        `Streak warning notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send streak warning notification: ${error.message}`,
      );
    }
  }

  @OnEvent('streak.broken')
  async handleStreakBroken(payload: {
    userId: string;
    previousStreak: number;
  }) {
    try {
      await this.notificationService.createSystemNotification(
        payload.userId,
        'Streak Broken',
        `Your ${payload.previousStreak}-day streaming streak has been broken. Start a new streak today!`,
        'medium',
        '/dashboard/streak',
      );
      this.logger.log(
        `Streak broken notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send streak broken notification: ${error.message}`,
      );
    }
  }

  @OnEvent('streak.milestone')
  async handleStreakMilestone(payload: {
    userId: string;
    streak: number;
    milestone: number;
    reward?: number;
  }) {
    try {
      const message = payload.reward
        ? `Congratulations! You've reached a ${payload.milestone}-day streak milestone and earned ₹${payload.reward}!`
        : `Congratulations! You've reached a ${payload.milestone}-day streak milestone!`;

      await this.notificationService.createSystemNotification(
        payload.userId,
        'Streak Milestone Achieved',
        message,
        'high',
        '/dashboard/streak',
      );
      this.logger.log(
        `Streak milestone notification sent to user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send streak milestone notification: ${error.message}`,
      );
    }
  }
}
