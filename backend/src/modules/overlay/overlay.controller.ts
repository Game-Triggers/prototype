import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { OverlayService } from './overlay.service';

/**
 * Overlay Controller
 *
 * Manages streamer overlay functionality for displaying ads during live broadcasts.
 * This controller provides endpoints for generating, retrieving, and tracking
 * overlay content that streamers embed in their streaming software (OBS, Streamlabs, etc.)
 * to display campaign ads to viewers.
 *
 * Key features:
 * - Serving HTML overlay content via unique streamer tokens
 * - Tracking ad impressions and interactions
 * - Managing ad display logic based on active campaigns
 * - Handling interaction events (clicks, views, etc.)
 *
 * Used by: Streamer OBS/Streamlabs browser sources and frontend interface
 */
@ApiTags('Overlay')
@Controller('overlay')
export class OverlayController {
  constructor(private readonly overlayService: OverlayService) {}

  /**
   * Serve the overlay HTML page for OBS/Streamlabs browser source
   */
  @Get(':token')
  @ApiOperation({
    summary: 'Get overlay HTML page',
    description:
      'Serves the overlay HTML for OBS/Streamlabs browser source integration',
  })
  @ApiParam({
    name: 'token',
    description: 'Overlay access token',
    required: true,
    example: 'abcd1234-5678-efgh-9101',
  })
  @ApiResponse({
    status: 200,
    description: 'HTML overlay content',
    content: {
      'text/html': {
        example: '<!DOCTYPE html><html>...</html>',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Overlay not found or invalid token',
  })
  async getOverlay(@Param('token') token: string, @Res() res: Response) {
    try {
      // Get overlay data - this will now return placeholder data for valid users with no campaigns
      // and include the user's overlay settings
      const { participation, campaign, overlaySettings } =
        await this.overlayService.getOverlayData(token);

      // Render HTML content with the campaign data embedded and apply overlay settings
      const html = this.overlayService.generateOverlayHtml(
        campaign,
        participation,
        overlaySettings,
      );

      // Only record impressions for real campaigns, not placeholders or test campaigns
      if (
        !campaign._id.toString().includes('placeholder') &&
        !campaign._id.toString().includes('test')
      ) {
        this.overlayService.recordImpression(token);
      }

      // Set appropriate headers for browser source
      res.header('Content-Type', 'text/html');
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(html);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // If token is invalid, return a simple error page
        res.header('Content-Type', 'text/html');
        res.send(
          '<html><body style="background: transparent;"><div style="color: white; font-family: sans-serif;">Invalid overlay token</div></body></html>',
        );
      } else {
        console.error('Overlay error:', error);
        res.header('Content-Type', 'text/html');
        res.send(
          '<html><body style="background: transparent;"><div style="color: white; font-family: sans-serif;">Overlay error. Please check your settings.</div></body></html>',
        );
      }
    }
  }

  /**
   * Handle click tracking from the overlay
   */
  @Post(':token/click')
  async trackClick(@Param('token') token: string) {
    try {
      console.log(`Click registered for token: ${token}`);
      return this.overlayService.recordClick(token, 'overlay');
    } catch (error) {
      console.error('Error tracking click:', error);
      return { success: false };
    }
  }

  /**
   * Handle alternative click tracking (chat commands, QR codes, links)
   */
  @Post(':token/click/:type')
  async trackAlternativeClick(
    @Param('token') token: string,
    @Param('type') type: 'chat' | 'qr' | 'link',
  ) {
    try {
      console.log(`${type} click registered for token: ${token}`);
      return this.overlayService.recordClick(token, type);
    } catch (error) {
      console.error(`Error tracking ${type} click:`, error);
      return { success: false };
    }
  }

  /**
   * Generate a QR code for the campaign
   */
  @Get(':token/qr')
  async generateQRCode(@Param('token') token: string, @Res() res: Response) {
    try {
      // Get participation by token
      const { participation } = await this.overlayService.getOverlayData(token);

      // Get QR code URL from the impression tracking service
      const qrCodeUrl = await this.overlayService.generateQRCode(
        participation._id.toString(),
      );

      if (qrCodeUrl) {
        res.redirect(qrCodeUrl);
      } else {
        res.status(404).json({ error: 'Failed to generate QR code' });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  }

  /**
   * Get chat commands for the campaign
   */
  @Get(':token/chat-command')
  async getChatCommand(@Param('token') token: string) {
    try {
      // Get participation by token
      const { participation } = await this.overlayService.getOverlayData(token);

      // Generate chat command
      const command = await this.overlayService.generateChatCommand(
        participation._id.toString(),
      );

      return { command };
    } catch (error) {
      console.error('Error generating chat command:', error);
      return { error: 'Failed to generate chat command' };
    }
  }

  /**
   * Get campaign data for the overlay without HTML (for AJAX refreshes)
   */
  @Get(':token/data')
  async getOverlayData(@Param('token') token: string) {
    try {
      const { participation, campaign } =
        await this.overlayService.getOverlayData(token);
      return {
        title: campaign.title,
        mediaUrl: campaign.mediaUrl,
        mediaType: campaign.mediaType,
      };
    } catch (error) {
      console.error('Error getting overlay data:', error);
      return { error: 'Failed to get overlay data' };
    }
  }

  /**
   * Handle ping from active overlays to track their status
   */
  @Post(':token/ping')
  async pingOverlay(@Param('token') token: string) {
    try {
      console.log(`Ping received for token: ${token}`);
      return this.overlayService.recordOverlayActivity(token);
    } catch (error) {
      console.error('Error recording ping:', error);
      return { success: false };
    }
  }
}
