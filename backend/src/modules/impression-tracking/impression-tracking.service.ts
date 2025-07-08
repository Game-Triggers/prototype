import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICampaignParticipation } from '@schemas/campaign-participation.schema';
import { StreamVerificationService } from '../stream-verification/services/stream-verification.service';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ImpressionTrackingService {
  constructor(
    @InjectModel('CampaignParticipation')
    private readonly participationModel: Model<ICampaignParticipation>,
    private readonly streamVerificationService: StreamVerificationService,
  ) {}

  /**
   * Records viewer-based impressions for a campaign participation
   * Updates the main impressions field based on actual stream viewers
   */
  async recordViewerImpressions(participationId: string): Promise<boolean> {
    try {
      // Get the participation record
      const participation = await this.participationModel
        .findById(participationId)
        .exec();

      if (!participation) {
        return false;
      }

      // Verify stream status and get viewer count
      const streamStatus = await this.streamVerificationService.verifyStream(
        participation.streamerId.toString(),
      );

      // If stream is not live, don't record impressions
      if (!streamStatus.isLive) {
        return false;
      }

      // Update impressions count - each viewer is counted as an impression
      const newImpressions = streamStatus.viewerCount;
      participation.impressions += newImpressions;

      // Update streaming metrics
      participation.lastStreamDate = new Date();
      participation.totalStreamMinutes += 1; // Assuming this is called every minute

      // Calculate new viewer count values
      const newAvgViewerCount =
        participation.avgViewerCount === 0
          ? streamStatus.viewerCount
          : (participation.avgViewerCount + streamStatus.viewerCount) / 2;

      const newPeakViewerCount = Math.max(
        streamStatus.viewerCount,
        participation.peakViewerCount,
      );

      // Update impressions and viewer counts using atomic operations
      await this.participationModel
        .findByIdAndUpdate(
          participationId,
          {
            $inc: { impressions: streamStatus.viewerCount },
            $set: {
              avgViewerCount: newAvgViewerCount,
              peakViewerCount: newPeakViewerCount,
            },
          },
          { new: true },
        )
        .exec();

      return true;
    } catch (error) {
      console.error('Error recording viewer impressions:', error);
      return false;
    }
  }

  /**
   * Records alternative click interactions (chat commands, QR scans, etc.)
   */
  async recordAlternativeClick(
    participationId: string,
    clickType: 'chat' | 'qr' | 'link',
  ): Promise<boolean> {
    try {
      // Get the participation record
      const participation = await this.participationModel
        .findById(participationId)
        .exec();

      if (!participation) {
        return false;
      }

      // Prepare update object based on click type
      const updateObj: any = { $inc: { clicks: 1 } };

      // Update the appropriate click counter based on type
      switch (clickType) {
        case 'chat':
          updateObj.$inc.chatClicks = 1;
          break;
        case 'qr':
          updateObj.$inc.qrScans = 1;
          break;
        case 'link':
          updateObj.$inc.linkClicks = 1;
          break;
      }

      // Update participation using atomic operations
      const updatedParticipation = await this.participationModel
        .findByIdAndUpdate(participationId, updateObj, { new: true })
        .exec();

      if (!updatedParticipation) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error recording ${clickType} click:`, error);
      return false;
    }
  }

  /**
   * Generates a QR code URL for a campaign participation
   * Uses the QRCode library to create an actual QR code image
   */
  async generateQRCode(participationId: string): Promise<string | null> {
    try {
      // Get the participation record
      const participation = await this.participationModel
        .findById(participationId)
        .exec();

      if (!participation) {
        return null;
      }

      // Generate a unique tracking URL
      const trackingUrl = `${process.env.APP_URL || 'https://instreamly-clone.com'}/c/${participationId}?src=qr`;
      participation.trackingUrl = trackingUrl;

      // Ensure directory exists
      const uploadsDir = path.join(
        process.cwd(),
        '../..',
        'public',
        'uploads',
        'qrcodes',
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate QR code file name
      const fileName = `qr-${participationId}.png`;
      const filePath = path.join(uploadsDir, fileName);

      // Generate the QR code image
      await QRCode.toFile(filePath, trackingUrl, {
        color: {
          dark: '#000000', // Black color for QR code dots
          light: '#ffffff', // White background
        },
        width: 300, // Width in pixels
        margin: 1, // Small margin
      });

      // Set the URL to the QR code using atomic update
      const qrCodeUrl = `/uploads/qrcodes/${fileName}`;
      await this.participationModel
        .findByIdAndUpdate(
          participationId,
          { $set: { qrCodeUrl } },
          { new: true },
        )
        .exec();

      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  /**
   * Generates a chat command for streamers to use in their chats
   */
  async generateChatCommand(participationId: string): Promise<string | null> {
    try {
      // Get the participation record
      const participation = await this.participationModel
        .findById(participationId)
        .exec();

      if (!participation) {
        return null;
      }

      // Generate a simple chat command with tracking link
      const trackingUrl =
        participation.trackingUrl || `https://example.com/c/${participationId}`;
      const chatCommand = `!sponsor Check out our sponsor: ${trackingUrl}`;

      // Update tracking URL and chat command using atomic operations
      await this.participationModel
        .findByIdAndUpdate(
          participationId,
          {
            $set: {
              trackingUrl,
              chatCommand,
            },
          },
          { new: true },
        )
        .exec();

      return chatCommand;
    } catch (error) {
      console.error('Error generating chat command:', error);
      return null;
    }
  }
}
