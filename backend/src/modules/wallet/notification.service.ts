import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  @OnEvent('campaign.activated')
  async handleCampaignActivated(payload: any) {
    this.logger.log(
      `Campaign activated: ${payload.campaignId} for brand: ${payload.brandId}`,
    );

    // Here you would implement actual notification sending:
    // - Email notifications
    // - In-app notifications
    // - Push notifications
    // - SMS notifications

    // For now, just log the event
    console.log('📢 Campaign Activated Notification:', {
      type: 'campaign_activated',
      brandId: payload.brandId,
      campaignId: payload.campaignId,
      budget: payload.budget,
      message: `Your campaign has been activated with a budget of ₹${payload.budget}`,
    });
  }

  @OnEvent('earnings.credited')
  async handleEarningsCredited(payload: any) {
    this.logger.log(
      `Earnings credited: ₹${payload.amount} to streamer: ${payload.streamerId}`,
    );

    console.log('💰 Earnings Credited Notification:', {
      type: 'earnings_credited',
      streamerId: payload.streamerId,
      campaignId: payload.campaignId,
      amount: payload.amount,
      milestoneType: payload.milestoneType,
      message: `You've earned ₹${payload.amount} from campaign milestone: ${payload.milestoneType}`,
    });
  }

  @OnEvent('campaign.funds.charged')
  async handleCampaignFundsCharged(payload: any) {
    this.logger.log(
      `Campaign funds charged: ₹${payload.amount} from brand: ${payload.brandId}`,
    );

    console.log('💸 Campaign Funds Charged Notification:', {
      type: 'funds_charged',
      brandId: payload.brandId,
      campaignId: payload.campaignId,
      amount: payload.amount,
      streamerId: payload.streamerId,
      message: `₹${payload.amount} has been charged from your campaign budget`,
    });
  }

  @OnEvent('campaign.completed')
  async handleCampaignCompleted(payload: any) {
    this.logger.log(`Campaign completed: ${payload.campaignId}`);

    console.log('🎯 Campaign Completed Notification:', {
      type: 'campaign_completed',
      brandId: payload.brandId,
      campaignId: payload.campaignId,
      participantCount: payload.participantCount,
      message: `Your campaign has been completed with ${payload.participantCount} participants`,
    });
  }

  @OnEvent('campaign.cancelled')
  async handleCampaignCancelled(payload: any) {
    this.logger.log(`Campaign cancelled: ${payload.campaignId}`);

    console.log('❌ Campaign Cancelled Notification:', {
      type: 'campaign_cancelled',
      brandId: payload.brandId,
      campaignId: payload.campaignId,
      refundAmount: payload.refundAmount,
      message: `Your campaign has been cancelled. ₹${payload.refundAmount} has been refunded to your wallet`,
    });
  }

  @OnEvent('campaign.budget.low')
  async handleLowBudgetWarning(payload: any) {
    this.logger.warn(`Low budget warning for campaign: ${payload.campaignId}`);

    console.log('⚠️ Low Budget Warning Notification:', {
      type: 'low_budget_warning',
      brandId: payload.brandId,
      campaignId: payload.campaignId,
      remainingBudget: payload.remainingBudget,
      threshold: payload.threshold,
      message: `Warning: Your campaign budget is running low. Remaining: ₹${payload.remainingBudget}`,
    });
  }

  @OnEvent('withdrawal.approved')
  async handleWithdrawalApproved(payload: any) {
    this.logger.log(
      `Withdrawal approved: ₹${payload.amount} for user: ${payload.userId}`,
    );

    console.log('✅ Withdrawal Approved Notification:', {
      type: 'withdrawal_approved',
      userId: payload.userId,
      amount: payload.amount,
      message: `Your withdrawal request of ₹${payload.amount} has been approved and is being processed`,
    });
  }

  @OnEvent('withdrawal.rejected')
  async handleWithdrawalRejected(payload: any) {
    this.logger.log(
      `Withdrawal rejected: ₹${payload.amount} for user: ${payload.userId}`,
    );

    console.log('❌ Withdrawal Rejected Notification:', {
      type: 'withdrawal_rejected',
      userId: payload.userId,
      amount: payload.amount,
      reason: payload.reason,
      message: `Your withdrawal request of ₹${payload.amount} has been rejected. Reason: ${payload.reason}`,
    });
  }

  @OnEvent('kyc.approved')
  async handleKYCApproved(payload: any) {
    this.logger.log(`KYC approved for user: ${payload.userId}`);

    console.log('✅ KYC Approved Notification:', {
      type: 'kyc_approved',
      userId: payload.userId,
      message:
        'Your KYC verification has been approved. You can now make withdrawals',
    });
  }

  @OnEvent('kyc.rejected')
  async handleKYCRejected(payload: any) {
    this.logger.log(`KYC rejected for user: ${payload.userId}`);

    console.log('❌ KYC Rejected Notification:', {
      type: 'kyc_rejected',
      userId: payload.userId,
      reason: payload.reason,
      message: `Your KYC verification has been rejected. Reason: ${payload.reason}`,
    });
  }

  @OnEvent('deposit.completed')
  async handleDepositCompleted(payload: any) {
    this.logger.log(
      `Deposit completed: ₹${payload.amount} for user: ${payload.userId}`,
    );

    console.log('💳 Deposit Completed Notification:', {
      type: 'deposit_completed',
      userId: payload.userId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      message: `Your deposit of ₹${payload.amount} via ${payload.paymentMethod} has been completed`,
    });
  }

  @OnEvent('dispute.created')
  async handleDisputeCreated(payload: any) {
    this.logger.log(
      `Dispute created: ${payload.disputeId} by user: ${payload.userId}`,
    );

    console.log('⚠️ Dispute Created Notification:', {
      type: 'dispute_created',
      userId: payload.userId,
      disputeId: payload.disputeId,
      amount: payload.amount,
      reason: payload.reason,
      message: `A dispute has been created for ₹${payload.amount}. Reason: ${payload.reason}`,
    });
  }

  @OnEvent('dispute.resolved')
  async handleDisputeResolved(payload: any) {
    this.logger.log(`Dispute resolved: ${payload.disputeId}`);

    console.log('✅ Dispute Resolved Notification:', {
      type: 'dispute_resolved',
      userId: payload.userId,
      disputeId: payload.disputeId,
      resolution: payload.resolution,
      message: `Your dispute has been resolved. Resolution: ${payload.resolution}`,
    });
  }

  /**
   * Send notification via multiple channels
   */
  async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ) {
    // This would implement actual notification sending
    this.logger.log(`Sending notification to user ${userId}: ${title}`);

    // Here you would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Push notification service (Firebase, OneSignal, etc.)
    // - SMS service (Twilio, AWS SNS, etc.)
    // - In-app notification storage

    const notification = {
      userId,
      type,
      title,
      message,
      data,
      createdAt: new Date(),
      isRead: false,
    };

    console.log('📤 Notification Sent:', notification);

    return notification;
  }
}
