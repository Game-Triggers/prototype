import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICampaign } from '@schemas/campaign.schema';
import {
  ICampaignParticipation,
  ParticipationStatus,
} from '@schemas/campaign-participation.schema';
import { IUser } from '@schemas/user.schema';
import { EarningsService } from '../earnings/earnings.service';
import { MediaType, CampaignStatus } from '@schemas/campaign.schema';
import { ImpressionTrackingService } from '../impression-tracking/impression-tracking.service';
import { StreamVerificationService } from '../stream-verification/services/stream-verification.service';

@Injectable()
export class OverlayService {
  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<ICampaign>,
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    @InjectModel('User') private readonly userModel: Model<IUser>,
    private readonly earningsService: EarningsService,
    private readonly impressionTrackingService: ImpressionTrackingService,
    private readonly streamVerificationService: StreamVerificationService,
  ) {}

  /**
   * Get overlay data based on browser source token
   */
  async getOverlayData(token: string): Promise<{
    participation: ICampaignParticipation;
    campaign: ICampaign;
    overlaySettings?: {
      position?: string;
      size?: string;
      opacity?: number;
      backgroundColor?: string;
    };
  }> {
    console.log(`Overlay token received: ${token}`);

    // Check if this is a user's overlay token (rather than a campaign participation token)
    const user = await this.userModel.findOne({ overlayToken: token }).exec();

    if (user) {
      console.log(`User found with overlay token: ${user.name} (${user._id})`);

      // Update the overlay last seen time even if there's no campaign
      // This allows the status indicator to work properly
      user.overlayLastSeen = new Date();
      user.overlayActive = true;
      await user.save();

      // PRIORITY 1: Check if the streamer has any active campaign participations
      // This is the key change - we first look for real joined campaigns
      const streamerParticipations = await this.participationModel
        .find({
          streamerId: user._id,
          status: ParticipationStatus.ACTIVE,
        })
        .exec();

      if (streamerParticipations && streamerParticipations.length > 0) {
        // Check if we're in a blackout period first
        const selectionStrategy = await this.getCampaignSelectionStrategy(
          user._id.toString(),
        );

        if (selectionStrategy === 'none') {
          console.log('Skipping campaign display due to blackout period');
          // Continue to test campaign or placeholder logic
        } else {
          // Smart campaign selection using enhanced strategies
          const activeParticipation = await this.selectOptimalCampaign(
            streamerParticipations,
            user._id.toString(),
          );

          console.log(
            `Found active campaign participation: ${activeParticipation._id}`,
          );

          // Get the actual campaign data
          const campaign = await this.campaignModel
            .findById(activeParticipation.campaignId)
            .exec();

          if (campaign && campaign.status === CampaignStatus.ACTIVE) {
            console.log(`Returning real campaign: ${campaign.title}`);

            // NOTE: Don't update browserSourceToken here to avoid duplicate key errors
            // The overlay token (user token) is used for tracking instead of participation tokens

            return {
              participation: activeParticipation,
              campaign: campaign,
              overlaySettings: user.overlaySettings,
            };
          }
        }
      }

      // PRIORITY 2: If no active campaign participations, check for test campaign
      if (user.testCampaign && user.testCampaign.expiresAt > new Date()) {
        console.log('User has active test campaign - returning test campaign');

        // Create a temporary campaign object from the test campaign data
        const testCampaign: Partial<ICampaign> = {
          _id: 'test-campaign' as any,
          title: user.testCampaign.title,
          mediaUrl: user.testCampaign.mediaUrl,
          mediaType:
            user.testCampaign.mediaType === 'image'
              ? MediaType.IMAGE
              : MediaType.VIDEO,
          brandId: 'test-brand' as any,
          budget: 0,
          remainingBudget: 0,
          status: CampaignStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000), // 24 hours from now
          paymentRate: 0,
          paymentType: 'cpm',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Create a temporary participation object with required fields
        const testParticipation: Partial<ICampaignParticipation> = {
          _id: 'test-participation' as any,
          campaignId: 'test-campaign' as any,
          streamerId: user._id,
          browserSourceToken: token,
          browserSourceUrl: `/api/overlay/${token}`,
          status: ParticipationStatus.ACTIVE,
          impressions: 0,
          clicks: 0,
          estimatedEarnings: 0,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          participation: testParticipation as ICampaignParticipation,
          campaign: testCampaign as ICampaign,
          overlaySettings: user.overlaySettings,
        };
      } else {
        // PRIORITY 3: Last resort - user exists but has no joined campaigns or test campaign
        console.log(
          'Creating placeholder campaign for user without active campaigns',
        );

        // Create a placeholder campaign for users with valid tokens but no active campaigns
        const placeholderCampaign: Partial<ICampaign> = {
          _id: 'placeholder-campaign' as any,
          title: 'Waiting for Campaign',
          // Use a gaming-themed image that's guaranteed to load
          mediaUrl:
            'https://dspncdn.com/a1/media/692x/f0/a0/68/f0a0684953daf21d13fdf30288f96028.jpg',
          mediaType: MediaType.IMAGE,
          brandId: 'placeholder' as any,
          budget: 0,
          remainingBudget: 0,
          status: CampaignStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000), // 24 hours from now
          paymentRate: 0,
          paymentType: 'cpm',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Create a placeholder participation object
        const placeholderParticipation: Partial<ICampaignParticipation> = {
          _id: 'placeholder-participation' as any,
          campaignId: 'placeholder-campaign' as any,
          streamerId: user._id,
          browserSourceToken: token,
          browserSourceUrl: `/api/overlay/${token}`,
          status: ParticipationStatus.ACTIVE,
          impressions: 0,
          clicks: 0,
          estimatedEarnings: 0,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log(
          'Returning placeholder campaign with image URL:',
          placeholderCampaign.mediaUrl,
        );

        return {
          participation: placeholderParticipation as ICampaignParticipation,
          campaign: placeholderCampaign as ICampaign,
          overlaySettings: user.overlaySettings,
        };
      }
    }

    console.log(
      'No user found with this token - checking for campaign participation',
    );

    // If no user found with this token, check if it's a campaign participation token
    const participation = await this.participationModel
      .findOne({
        browserSourceToken: token,
        status: ParticipationStatus.ACTIVE,
      })
      .exec();

    if (participation) {
      console.log(
        `Campaign participation found with token: ${participation._id}`,
      );

      // Get the streamer for this participation
      const streamer = await this.userModel
        .findById(participation.streamerId)
        .exec();

      if (!streamer) {
        throw new NotFoundException('Streamer not found');
      }

      // ENHANCED: Check if the streamer has multiple active campaigns
      // If so, apply selection strategies instead of showing just this campaign
      const allStreamerParticipations = await this.participationModel
        .find({
          streamerId: participation.streamerId,
          status: ParticipationStatus.ACTIVE,
        })
        .exec();

      console.log(
        `Streamer has ${allStreamerParticipations.length} active participations`,
      );

      if (allStreamerParticipations.length > 1) {
        console.log('Multiple campaigns found - applying selection strategy');

        // Check for blackout periods first
        const selectionStrategy = await this.getCampaignSelectionStrategy(
          participation.streamerId.toString(),
        );

        if (selectionStrategy === 'none') {
          console.log('Skipping campaign display due to blackout period');
          // Return empty/placeholder campaign or the original requested campaign
        } else {
          // Apply selection strategies to choose optimal campaign
          const selectedParticipation = await this.selectOptimalCampaign(
            allStreamerParticipations,
            participation.streamerId.toString(),
          );

          console.log(
            `Strategy selected campaign: ${selectedParticipation._id} (requested was: ${participation._id})`,
          );

          // Get the selected campaign data
          const selectedCampaign = await this.campaignModel
            .findById(selectedParticipation.campaignId)
            .exec();

          if (selectedCampaign && selectedCampaign.status === 'active') {
            console.log(
              `Showing campaign: ${selectedCampaign.title} (strategy: ${selectionStrategy})`,
            );
            return {
              participation: selectedParticipation,
              campaign: selectedCampaign,
              overlaySettings: streamer.overlaySettings,
            };
          }
        }
      }

      // Fallback: Single campaign or strategy failed - show the requested campaign
      console.log('Single campaign or fallback - showing requested campaign');
      const campaign = await this.campaignModel
        .findById(participation.campaignId)
        .exec();

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      return {
        participation,
        campaign,
        overlaySettings: streamer.overlaySettings,
      };
    } else {
      console.log('No campaign participation found with this token');
      throw new NotFoundException('Invalid overlay token or inactive campaign');
    }
  }

  /**
   * Generate HTML for the OBS/Streamlabs browser source
   */
  generateOverlayHtml(
    campaign: ICampaign,
    participation: ICampaignParticipation,
    overlaySettings?: {
      position?: string;
      size?: string;
      opacity?: number;
      backgroundColor?: string;
    },
  ): string {
    // Default values for overlay settings if not provided
    const position = overlaySettings?.position || 'bottom-right';
    const size = overlaySettings?.size || 'medium';
    const opacity =
      overlaySettings?.opacity !== undefined
        ? overlaySettings.opacity / 100
        : 0.8; // Convert percentage to decimal
    const backgroundColor = overlaySettings?.backgroundColor || 'transparent';

    // Calculate position CSS classes based on position setting
    const positionStyles = (() => {
      switch (position) {
        case 'top-left':
          return 'top: 10px; left: 10px;';
        case 'top-right':
          return 'top: 10px; right: 10px;';
        case 'bottom-left':
          return 'bottom: 10px; left: 10px;';
        case 'bottom-right':
        default:
          return 'bottom: 10px; right: 10px;';
      }
    })();

    // Calculate size CSS classes based on size setting
    const sizeStyles = (() => {
      switch (size) {
        case 'small':
          return 'width: 20%; max-width: 200px;';
        case 'large':
          return 'width: 40%; max-width: 400px;';
        case 'medium':
        default:
          return 'width: 30%; max-width: 300px;';
      }
    })();

    // Base styles for overlay
    const baseStyles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: Arial, sans-serif; 
        background-color: transparent;
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
      .overlay-container {
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        ${positionStyles}
        ${sizeStyles}
        opacity: ${opacity};
        background-color: ${backgroundColor};
        z-index: 9999;
      }
    `;

    // Log the applied overlay settings
    console.log('Applying overlay settings:', {
      position,
      size,
      opacity,
      backgroundColor,
    });

    // Generate different HTML based on the media type
    let mediaHtml = '';
    if (campaign.mediaType === MediaType.IMAGE) {
      mediaHtml = `
        <div class="overlay-container" id="sponsorOverlay">
          <a href="/api/overlay/${participation.browserSourceToken}/click" target="_blank" id="campaignLink">
            <img src="${campaign.mediaUrl}" alt="${campaign.title}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </a>
        </div>
      `;
    } else if (campaign.mediaType === MediaType.VIDEO) {
      mediaHtml = `
        <div class="overlay-container" id="sponsorOverlay">
          <video id="campaignVideo" autoplay muted loop playsinline style="max-width: 100%; max-height: 100%;">
            <source src="${campaign.mediaUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    }

    // Generate the full HTML document with embedded JavaScript for tracking
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${campaign.title} - Sponsor Overlay</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        ${mediaHtml}
        
        <script>
          // Function to handle click tracking
          document.addEventListener('DOMContentLoaded', function() {
            const campaignLink = document.getElementById('campaignLink');
            if (campaignLink) {
              campaignLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Send click event to tracking endpoint
                fetch('/api/overlay/${participation.browserSourceToken}/click', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                }).then(() => {
                  // Open the link in a new tab after tracking
                  window.open(campaignLink.href, '_blank');
                });
              });
            }
            
            // Periodically check for campaign updates
            setInterval(function() {
              fetch('/api/overlay/${participation.browserSourceToken}/data')
                .then(response => response.json())
                .then(data => {
                  // If campaign data changed, refresh the page
                  if (data && data.mediaUrl !== '${campaign.mediaUrl}') {
                    window.location.reload();
                  }
                })
                .catch(err => console.error('Error checking for updates:', err));
            }, 5000); // Check every 5 seconds (reduced from 60s for faster test campaign detection)
            
            // Ping the server every 30 seconds to indicate the overlay is active
            setInterval(function() {
              fetch('/api/overlay/${participation.browserSourceToken}/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              })
              .catch(err => console.error('Error sending ping:', err));
            }, 30000); // Ping every 30 seconds
            
            // Initial ping to immediately register the overlay as active
            fetch('/api/overlay/${participation.browserSourceToken}/ping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            .catch(err => console.error('Error sending initial ping:', err));
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Record an impression when the overlay loads
   * Now only uses viewer-based impression tracking
   */
  async recordImpression(token: string): Promise<{ success: boolean }> {
    try {
      // First check if this is a direct participation token
      let participation: ICampaignParticipation | null =
        await this.participationModel
          .findOne({
            browserSourceToken: token,
            status: ParticipationStatus.ACTIVE,
          })
          .exec();

      // If no direct participation found, check if it's a user token
      if (!participation) {
        // Check if this is a user's overlay token
        const user = await this.userModel
          .findOne({ overlayToken: token })
          .exec();

        if (user) {
          console.log(
            `Impression for user token ${token} - finding active participation`,
          );

          // Get the currently selected active participation using the same logic as overlay display
          const streamerParticipations = await this.participationModel
            .find({
              streamerId: user._id,
              status: ParticipationStatus.ACTIVE,
            })
            .exec();

          if (streamerParticipations && streamerParticipations.length > 0) {
            // Use the same smart selection logic to determine which campaign gets credit
            const selectedParticipation = await this.selectOptimalCampaign(
              streamerParticipations,
              user._id.toString(),
            );
            participation = selectedParticipation;

            console.log(
              `Crediting impression to currently selected participation: ${participation?._id?.toString()}`,
            );
          }
        }
      }

      // If we still don't have a participation record, exit
      if (!participation) {
        console.log(`No valid participation found for token ${token}`);
        return { success: false };
      }

      // NEW! Only viewer-based impression tracking
      // This happens asynchronously to verify stream is live and record actual viewer count
      await this.verifyAndRecordViewerImpressions(participation._id.toString());

      console.log(
        `Processed impression for participation ${participation._id?.toString()}`,
      );
      return { success: true };
    } catch (error) {
      console.error('Error recording impression:', error);
      return { success: false };
    }
  }

  /**
   * Helper method to verify stream and record viewer-based impressions
   * This now directly updates the impressions field (no longer separate from traditional)
   */
  private async verifyAndRecordViewerImpressions(
    participationId: string,
  ): Promise<void> {
    try {
      // Get the participation to find the streamer
      const participation = await this.participationModel
        .findById(participationId)
        .exec();
      if (!participation) return;

      // Check stream status
      const streamStatus = await this.streamVerificationService.verifyStream(
        participation.streamerId.toString(),
      );

      // If stream is live, record viewer-based impressions and update earnings
      if (streamStatus.isLive && streamStatus.viewerCount > 0) {
        // Use the impression tracking service to record viewer impressions
        const success =
          await this.impressionTrackingService.recordViewerImpressions(
            participationId,
          );

        if (success) {
          // Update earnings based on actual viewer impressions
          await this.earningsService.updateEarnings(
            participationId,
            'impression',
          );

          console.log(
            `Recorded ${streamStatus.viewerCount} viewer impressions for participation ${participationId}`,
          );
        }
      } else {
        console.log(
          `Stream not live or no viewers for participation ${participationId}`,
        );
      }
    } catch (error) {
      console.error('Error in verifyAndRecordViewerImpressions:', error);
    }
  }

  /**
   * Record a click when a user clicks the overlay
   * @param token The browser source token
   * @param clickType The type of click ('overlay', 'chat', 'qr', 'link')
   */
  async recordClick(
    token: string,
    clickType: 'overlay' | 'chat' | 'qr' | 'link' = 'overlay',
  ): Promise<{ success: boolean }> {
    try {
      // First check if this is a direct participation token
      let participation: ICampaignParticipation | null =
        await this.participationModel
          .findOne({
            browserSourceToken: token,
            status: ParticipationStatus.ACTIVE,
          })
          .exec();

      // If no direct participation found, check if it's a user token
      if (!participation) {
        // Check if this is a user's overlay token
        const user = await this.userModel
          .findOne({ overlayToken: token })
          .exec();

        if (user) {
          // Get the currently selected active participation using the same logic as overlay display
          const streamerParticipations = await this.participationModel
            .find({
              streamerId: user._id,
              status: ParticipationStatus.ACTIVE,
            })
            .exec();

          if (streamerParticipations && streamerParticipations.length > 0) {
            // Use the same smart selection logic to determine which campaign gets credit
            const selectedParticipation = await this.selectOptimalCampaign(
              streamerParticipations,
              user._id.toString(),
            );
            participation = selectedParticipation;
          }
        }
      }

      // If we still don't have a participation record, exit
      if (!participation) {
        return { success: false };
      }

      // Traditional click tracking for backward compatibility
      if (clickType === 'overlay') {
        // Record the click using atomic update to avoid saving the entire document
        await this.participationModel
          .findByIdAndUpdate(
            participation._id,
            { $inc: { clicks: 1 } },
            { new: true },
          )
          .exec();
      } else {
        // Use the new impression tracking service for alternative clicks
        await this.impressionTrackingService.recordAlternativeClick(
          participation._id.toString(),
          clickType as 'chat' | 'qr' | 'link',
        );
      }

      // Use the earnings service to update earnings
      await this.earningsService.updateEarnings(
        participation._id.toString(),
        'click',
      );

      return { success: true };
    } catch (error) {
      console.error('Error recording click:', error);
      return { success: false };
    }
  }

  /**
   * Record overlay activity for connection status tracking
   */
  async recordOverlayActivity(token: string): Promise<{ success: boolean }> {
    try {
      // Find the user with this overlay token
      const user = await this.userModel.findOne({ overlayToken: token }).exec();

      if (!user) {
        return { success: false };
      }

      // Update the overlay status fields
      user.overlayLastSeen = new Date();
      user.overlayActive = true;
      await user.save();

      return { success: true };
    } catch (error) {
      console.error('Error recording overlay activity:', error);
      return { success: false };
    }
  }

  /**
   * Generate a QR code for a participation
   */
  async generateQRCode(participationId: string): Promise<string | null> {
    return this.impressionTrackingService.generateQRCode(participationId);
  }

  /**
   * Generate a chat command for a participation
   */
  async generateChatCommand(participationId: string): Promise<string | null> {
    return this.impressionTrackingService.generateChatCommand(participationId);
  }

  /**
   * Smart campaign selection using enhanced strategies
   */
  private async selectOptimalCampaign(
    participations: ICampaignParticipation[],
    streamerId: string,
  ): Promise<ICampaignParticipation> {
    // Get full campaign data for each participation
    const participationsWithCampaigns = await Promise.all(
      participations.map(async (participation) => {
        const campaign = await this.campaignModel
          .findById(participation.campaignId)
          .exec();
        return { participation, campaign: campaign as ICampaign | null };
      }),
    );

    // Filter out any with missing campaign data and ensure non-null campaigns
    const validParticipations = participationsWithCampaigns.filter(
      (
        item,
      ): item is {
        participation: ICampaignParticipation;
        campaign: ICampaign;
      } => item.campaign !== null && item.campaign.status === 'active',
    );

    if (validParticipations.length === 0) {
      return participations[0]; // Fallback to first participation
    }

    if (validParticipations.length === 1) {
      return validParticipations[0].participation;
    }

    // Try different selection strategies based on configuration
    const selectionStrategy =
      await this.getCampaignSelectionStrategy(streamerId);

    // Handle blackout periods
    if (selectionStrategy === 'none') {
      console.log('Skipping campaign display due to blackout period');
      return participations[0]; // Return first as fallback, but won't be displayed
    }

    switch (selectionStrategy) {
      case 'weighted':
        return this.weightedCampaignSelection(validParticipations);
      case 'time-rotation':
        return this.timeBasedRotation(validParticipations);
      case 'performance':
        return this.performanceBasedSelection(validParticipations);
      case 'revenue-optimized':
        return this.revenueOptimizedSelection(validParticipations);
      default:
        return this.fairRotationSelection(validParticipations, streamerId);
    }
  }

  /**
   * Get campaign selection strategy for a streamer (default: fair-rotation)
   */
  private async getCampaignSelectionStrategy(
    streamerId: string,
  ): Promise<string> {
    try {
      const user = await this.userModel.findById(streamerId).exec();

      // Check for blackout periods first
      if (user?.campaignRotationSettings?.blackoutPeriods) {
        const isBlackout = this.isInBlackoutPeriod(
          user.campaignRotationSettings.blackoutPeriods,
        );
        if (isBlackout) {
          console.log(`Blackout period active for streamer: ${streamerId}`);
          return 'none'; // Special case to skip campaign display
        }
      }

      // Simple strategy selection without complex type checking for now
      const strategy = user?.campaignSelectionStrategy || 'fair-rotation';
      console.log(
        `Using campaign selection strategy: ${strategy} for streamer: ${streamerId}`,
      );

      return strategy;
    } catch (error) {
      console.error('Error getting campaign selection strategy:', error);
      return 'fair-rotation';
    }
  }

  /**
   * Check if current time is within any blackout periods
   */
  private isInBlackoutPeriod(
    blackoutPeriods: Array<{
      startTime: string;
      endTime: string;
      days: string[];
    }>,
  ): boolean {
    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];
    const currentTime =
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0');

    for (const period of blackoutPeriods) {
      // Check if current day is in the blackout days
      const isBlackoutDay = period.days.some((day) =>
        day.toLowerCase().startsWith(currentDay),
      );

      if (isBlackoutDay) {
        // Check if current time is within blackout hours
        if (this.isTimeInRange(currentTime, period.startTime, period.endTime)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a time is within a given range
   */
  private isTimeInRange(
    currentTime: string,
    startTime: string,
    endTime: string,
  ): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    // Handle overnight periods (e.g., 23:00 to 01:00)
    if (start > end) {
      return current >= start || current <= end;
    }

    return current >= start && current <= end;
  }

  /**
   * Convert HH:MM time to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Weighted selection based on campaign payment rates
   */
  private weightedCampaignSelection(
    participationsWithCampaigns: Array<{
      participation: ICampaignParticipation;
      campaign: ICampaign;
    }>,
  ): ICampaignParticipation {
    try {
      // Use default weights for now - can be enhanced later with user preferences
      const defaultWeights = {
        paymentRate: 0.4,
        performance: 0.3,
        fairness: 0.3,
      };

      // Calculate weighted scores for each campaign
      const campaignsWithScores = participationsWithCampaigns.map((item) => {
        const participation = item.participation;
        const campaign = item.campaign;

        // Payment rate score (normalized)
        const maxPaymentRate = Math.max(
          ...participationsWithCampaigns.map((p) => p.campaign.paymentRate),
        );
        const paymentScore =
          maxPaymentRate > 0 ? campaign.paymentRate / maxPaymentRate : 0;

        // Performance score
        const ctr =
          participation.impressions > 0
            ? participation.clicks / participation.impressions
            : 0;
        const performanceScore = Math.min(ctr * 100, 1);

        // Fairness score (inverse of recent display frequency)
        const now = Date.now();
        const timeSinceLastDisplay = participation.updatedAt
          ? (now - new Date(participation.updatedAt).getTime()) / (1000 * 60)
          : 60;
        const fairnessScore = Math.min(timeSinceLastDisplay / 30, 1);

        // Combined weighted score
        const totalScore =
          paymentScore * defaultWeights.paymentRate +
          performanceScore * defaultWeights.performance +
          fairnessScore * defaultWeights.fairness;

        return {
          ...item,
          totalScore,
          paymentScore,
          performanceScore,
          fairnessScore,
        };
      });

      // Select based on weighted probability
      const totalWeight = campaignsWithScores.reduce(
        (sum, item) => sum + item.totalScore,
        0,
      );

      if (totalWeight === 0) {
        const randomIndex = Math.floor(
          Math.random() * campaignsWithScores.length,
        );
        return campaignsWithScores[randomIndex].participation;
      }

      const randomWeight = Math.random() * totalWeight;
      let currentWeight = 0;

      for (const item of campaignsWithScores) {
        currentWeight += item.totalScore;
        if (randomWeight <= currentWeight) {
          console.log(
            `Selected campaign via weighted selection: ${item.campaign.title} (score: ${item.totalScore.toFixed(3)})`,
          );
          return item.participation;
        }
      }

      return campaignsWithScores[0].participation;
    } catch (error) {
      console.error('Error in weighted campaign selection:', error);
      // Fallback to random selection
      const randomIndex = Math.floor(
        Math.random() * participationsWithCampaigns.length,
      );
      return participationsWithCampaigns[randomIndex].participation;
    }
  }

  /**
   * Time-based rotation - each campaign gets equal time slots
   */
  private timeBasedRotation(
    participationsWithCampaigns: Array<{
      participation: ICampaignParticipation;
      campaign: ICampaign;
    }>,
  ): ICampaignParticipation {
    try {
      // Use 3-minute rotation intervals as default
      const rotationIntervalMinutes = 3;
      const rotationIntervalMs = rotationIntervalMinutes * 60 * 1000;

      const currentTime = Date.now();
      const campaignIndex =
        Math.floor(currentTime / rotationIntervalMs) %
        participationsWithCampaigns.length;

      const selectedItem = participationsWithCampaigns[campaignIndex];
      console.log(
        `Selected campaign via time rotation: ${selectedItem.campaign.title} (slot ${campaignIndex + 1}/${participationsWithCampaigns.length})`,
      );

      return selectedItem.participation;
    } catch (error) {
      console.error('Error in time-based rotation:', error);
      // Fallback to random selection
      const randomIndex = Math.floor(
        Math.random() * participationsWithCampaigns.length,
      );
      return participationsWithCampaigns[randomIndex].participation;
    }
  }

  /**
   * Performance-based selection - prioritize campaigns with better CTR and earnings
   */
  private performanceBasedSelection(
    participationsWithCampaigns: Array<{
      participation: ICampaignParticipation;
      campaign: ICampaign;
    }>,
  ): ICampaignParticipation {
    // Calculate performance score for each campaign
    const campaignsWithPerformance = participationsWithCampaigns.map((item) => {
      const participation = item.participation;
      const campaign = item.campaign;

      // Calculate CTR (click-through rate)
      const ctr =
        participation.impressions > 0
          ? participation.clicks / participation.impressions
          : 0;

      // Calculate earnings per impression
      const earningsPerImpression =
        participation.impressions > 0
          ? participation.estimatedEarnings / participation.impressions
          : 0;

      // Combined performance score (weighted CTR and earnings)
      const performanceScore = ctr * 0.4 + earningsPerImpression * 0.6;

      return {
        ...item,
        performanceScore,
        ctr,
        earningsPerImpression,
      };
    });

    // Sort by performance score (descending) and add some randomness
    campaignsWithPerformance.sort((a, b) => {
      // Add slight randomness to prevent always showing the same top performer
      const randomFactor = (Math.random() - 0.5) * 0.1; // ±0.05 randomness
      return (
        b.performanceScore + randomFactor - (a.performanceScore + randomFactor)
      );
    });

    const selectedItem = campaignsWithPerformance[0];
    console.log(
      `Selected campaign via performance: ${selectedItem.campaign.title} (score: ${selectedItem.performanceScore.toFixed(3)})`,
    );

    return selectedItem.participation;
  }

  /**
   * Revenue-optimized selection - maximize streamer earnings
   */
  private revenueOptimizedSelection(
    participationsWithCampaigns: Array<{
      participation: ICampaignParticipation;
      campaign: ICampaign;
    }>,
  ): ICampaignParticipation {
    // Calculate expected revenue for each campaign
    const campaignsWithRevenue = participationsWithCampaigns.map((item) => {
      const participation = item.participation;
      const campaign = item.campaign;

      // Calculate historical performance
      const historicalCTR =
        participation.impressions > 0
          ? participation.clicks / participation.impressions
          : 0.01; // Default 1% CTR

      // Expected revenue based on payment type
      let expectedRevenue = 0;
      if (campaign.paymentType === 'cpm') {
        // CPM: payment per 1000 impressions
        expectedRevenue = campaign.paymentRate / 1000;
      } else if (campaign.paymentType === 'fixed') {
        // Fixed rate: distribute over expected impressions
        const expectedDailyImpressions = 1000; // Estimate
        expectedRevenue = campaign.paymentRate / expectedDailyImpressions;
      }

      // Apply performance multiplier
      const performanceMultiplier = 1 + historicalCTR * 10; // Bonus for higher CTR
      expectedRevenue *= performanceMultiplier;

      return {
        ...item,
        expectedRevenue,
        historicalCTR,
      };
    });

    // Select campaign with highest expected revenue (with slight randomness)
    campaignsWithRevenue.sort((a, b) => {
      const randomFactor = (Math.random() - 0.5) * 0.1;
      return (
        b.expectedRevenue + randomFactor - (a.expectedRevenue + randomFactor)
      );
    });

    const selectedItem = campaignsWithRevenue[0];
    console.log(
      `Selected campaign via revenue optimization: ${selectedItem.campaign.title} (expected: $${selectedItem.expectedRevenue.toFixed(4)})`,
    );

    return selectedItem.participation;
  }

  /**
   * Fair rotation selection - ensures equal exposure for all campaigns
   */
  private fairRotationSelection(
    participationsWithCampaigns: Array<{
      participation: ICampaignParticipation;
      campaign: ICampaign;
    }>,
    streamerId: string,
  ): ICampaignParticipation {
    // Get or create rotation state for this streamer
    const rotationKey = `rotation_${streamerId}`;
    const currentTime = Date.now();

    // Simple fair rotation based on campaign ID hash and time
    const campaignIds = participationsWithCampaigns.map((item) =>
      item.campaign._id.toString(),
    );
    const sortedIds = campaignIds.sort(); // Ensure consistent ordering

    // Use time-based rotation with 3-minute intervals
    const intervalMs = 3 * 60 * 1000; // 3 minutes
    const rotationIndex =
      Math.floor(currentTime / intervalMs) % sortedIds.length;
    const selectedCampaignId = sortedIds[rotationIndex];

    const selectedItem = participationsWithCampaigns.find(
      (item) => item.campaign._id.toString() === selectedCampaignId,
    );

    if (selectedItem) {
      console.log(
        `Selected campaign via fair rotation: ${selectedItem.campaign.title} (${rotationIndex + 1}/${sortedIds.length})`,
      );
      return selectedItem.participation;
    }

    // Fallback to random selection
    const randomIndex = Math.floor(
      Math.random() * participationsWithCampaigns.length,
    );
    return participationsWithCampaigns[randomIndex].participation;
  }
}
