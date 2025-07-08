import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StreamVerifier } from '../interfaces/stream-verifier.interface';

@Injectable()
export class YouTubeStreamVerifier implements StreamVerifier {
  private readonly logger = new Logger(YouTubeStreamVerifier.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async isStreamLive(
    platformChannelId: string,
    accessToken: string,
  ): Promise<boolean> {
    // Skip API call if no valid token
    if (!accessToken) {
      this.logger.warn('Skipping YouTube live check - no valid access token');
      return false;
    }

    try {
      this.logger.debug(
        `Checking YouTube live status with token: ${accessToken.substring(0, 5)}...`,
      );

      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=status&broadcastStatus=active&broadcastType=all`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      // Check if any live broadcasts are found
      return response.data.items && response.data.items.length > 0;
    } catch (error) {
      if (error.response) {
        // The request was made but the server responded with an error
        this.logger.error(`YouTube API Error: Status ${error.response.status}`);
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(
          `Failed to check YouTube stream status: ${error.message}`,
        );
      }
      return false;
    }
  }

  async getViewerCount(
    platformChannelId: string,
    accessToken: string,
  ): Promise<number> {
    // Skip API call if no valid token
    if (!accessToken) {
      this.logger.warn(
        'Skipping YouTube viewer count check - no valid access token',
      );
      return 0;
    }

    try {
      // First, get active broadcasts
      const broadcastResponse = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastStatus=active&broadcastType=all`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      if (
        !broadcastResponse.data.items ||
        broadcastResponse.data.items.length === 0
      ) {
        return 0;
      }

      // Get the first active broadcast ID
      const broadcastId = broadcastResponse.data.items[0].id;

      // Now get the concurrent viewers using the broadcast ID
      const statsResponse = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${broadcastId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      if (!statsResponse.data.items || statsResponse.data.items.length === 0) {
        return 0;
      }

      return (
        statsResponse.data.items[0].liveStreamingDetails.concurrentViewers || 0
      );
    } catch (error) {
      this.logger.error(`Failed to get YouTube viewer count: ${error.message}`);
      return 0;
    }
  }

  async getStreamDuration(
    platformChannelId: string,
    accessToken: string,
  ): Promise<number> {
    // Skip API call if no valid token
    if (!accessToken) {
      this.logger.warn(
        'Skipping YouTube duration check - no valid access token',
      );
      return 0;
    }

    try {
      // First, get active broadcasts
      const broadcastResponse = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastStatus=active&broadcastType=all`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      if (
        !broadcastResponse.data.items ||
        broadcastResponse.data.items.length === 0
      ) {
        return 0;
      }

      // Get the scheduled start time of the broadcast
      const scheduledStartTime = new Date(
        broadcastResponse.data.items[0].snippet.scheduledStartTime,
      );
      const now = new Date();
      const durationMs = now.getTime() - scheduledStartTime.getTime();
      return Math.floor(durationMs / (1000 * 60)); // Convert to minutes
    } catch (error) {
      if (error.response) {
        // The request was made but the server responded with an error
        this.logger.error(
          `YouTube API Error (duration): Status ${error.response.status}`,
        );
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(
          `Failed to get YouTube stream duration: ${error.message}`,
        );
      }
      return 0;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://oauth2.googleapis.com/token', {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.configService.get('YOUTUBE_CLIENT_ID'),
          client_secret: this.configService.get('YOUTUBE_CLIENT_SECRET'),
        }),
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error(
        `Failed to refresh YouTube access token: ${error.message}`,
      );
      throw error;
    }
  }
}
