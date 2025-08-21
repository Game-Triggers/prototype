import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICampaign } from '@schemas/campaign.schema';
import { ICampaignParticipation } from '@schemas/campaign-participation.schema';

export enum EarningsModel {
  CPM = 'cpm', // Cost per mille (thousand impressions)
  CPC = 'cpc', // Cost per click
  FIXED = 'fixed', // Fixed amount per campaign
}

@Injectable()
export class EarningsService {
  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
  ) {}

  /**
   * Calculate earnings for an impression
   * @param participation The campaign participation record
   * @param campaign The campaign
   * @returns The calculated earnings amount
   */
  async calculateImpressionEarnings(
    participation: ICampaignParticipation,
    campaign: ICampaign,
  ): Promise<number> {
    // Use the payment type from the campaign schema
    const paymentType = campaign.paymentType || 'cpm';
    let earnings = 0;

    switch (paymentType) {
      case 'cpm':
        // CPM rate is per 1000 impressions, so divide by 1000
        earnings = (campaign.paymentRate || 2.0) / 1000;
        break;

      case 'fixed':
        // For fixed model, we distribute the fixed amount across expected impressions
        // If impressions exceed expectations, we stop counting
        const expectedImpressions = 10000; // Default value
        if (participation.impressions <= expectedImpressions) {
          earnings = (campaign.paymentRate || 0) / expectedImpressions;
        }
        break;

      default:
        // Default case
        earnings = 0;
        break;
    }

    return earnings;
  }

  /**
   * Calculate earnings for a click
   * @param participation The campaign participation record
   * @param campaign The campaign
   * @returns The calculated earnings amount
   */
  async calculateClickEarnings(
    participation: ICampaignParticipation,
    campaign: ICampaign,
  ): Promise<number> {
    // Use the payment type from the campaign schema
    const paymentType = campaign.paymentType || 'cpm';
    const earnings = 0;

    // Only account for clicks in CPC model, which we'll add as a custom handling
    // In the current schema, we only have cpm and fixed, so returning 0
    return 0;
  }

  /**
   * Update earnings for a participation record based on new impressions or clicks
   * @param participationId The ID of the participation record
   * @param type The type of event ('impression' or 'click')
   * @returns The updated participation record
   */
  async updateEarnings(
    participationId: string,
    type: 'impression' | 'click',
  ): Promise<ICampaignParticipation> {
    // Get the participation record
    const participation = await this.participationModel
      .findById(participationId)
      .exec();

    if (!participation) {
      throw new Error(`Participation record ${participationId} not found`);
    }

    // Get the campaign
    const campaign = await this.campaignModel
      .findById(participation.campaignId)
      .exec();

    if (!campaign) {
      throw new Error(`Campaign ${participation.campaignId} not found`);
    }

    // Calculate earnings based on the event type
    let newEarnings = 0;
    if (type === 'impression') {
      newEarnings = await this.calculateImpressionEarnings(
        participation,
        campaign,
      );
    } else if (type === 'click') {
      newEarnings = await this.calculateClickEarnings(participation, campaign);
    }

    // Update the participation record with the new earnings using atomic update
    const updatedParticipation = await this.participationModel
      .findByIdAndUpdate(
        participationId,
        { $inc: { estimatedEarnings: newEarnings } },
        { new: true },
      )
      .exec();

    if (!updatedParticipation) {
      throw new Error(
        `Failed to update participation record ${participationId}`,
      );
    }

    return updatedParticipation;
  }

  /**
   * Get earnings summary for a streamer
   * @param streamerId The ID of the streamer
   * @returns Summary of earnings
   */
  async getStreamerEarningsSummary(streamerId: string) {
    // Get all-time earnings
    const allTimeEarningsResult = await this.participationModel
      .aggregate([
        { $match: { streamerId } },
        { $group: { _id: null, amount: { $sum: '$estimatedEarnings' } } },
      ])
      .exec();

    // Get current month earnings
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const currentMonthEarningsResult = await this.participationModel
      .aggregate([
        {
          $match: {
            streamerId,
            createdAt: { $gte: firstDayOfMonth },
          },
        },
        { $group: { _id: null, amount: { $sum: '$estimatedEarnings' } } },
      ])
      .exec();

    // Get earnings by campaign
    const earningsByCampaign = await this.participationModel
      .aggregate([
        { $match: { streamerId } },
        {
          $lookup: {
            from: 'campaigns',
            localField: 'campaignId',
            foreignField: '_id',
            as: 'campaign',
          },
        },
        { $unwind: '$campaign' },
        {
          $project: {
            campaignId: '$campaignId',
            campaignTitle: '$campaign.title',
            earnings: '$estimatedEarnings',
            impressions: '$impressions',
            clicks: '$clicks',
            joinedAt: '$joinedAt',
          },
        },
        { $sort: { earnings: -1 } },
      ])
      .exec();

    // Get earnings by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyEarnings = await this.participationModel
      .aggregate([
        {
          $match: {
            streamerId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            earnings: { $sum: '$estimatedEarnings' },
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            earnings: 1,
            impressions: 1,
            clicks: 1,
          },
        },
        { $sort: { date: 1 } },
      ])
      .exec();

    // Format the response
    return {
      allTimeEarnings: allTimeEarningsResult[0]?.amount || 0,
      currentMonthEarnings: currentMonthEarningsResult[0]?.amount || 0,
      earningsByCampaign,
      dailyEarnings,
    };
  }
}
