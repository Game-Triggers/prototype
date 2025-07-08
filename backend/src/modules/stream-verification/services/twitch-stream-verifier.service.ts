import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StreamVerifier } from '../interfaces/stream-verifier.interface';

@Injectable()
export class TwitchStreamVerifier implements StreamVerifier {
  private readonly logger = new Logger(TwitchStreamVerifier.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async isStreamLive(
    platformUserId: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.twitch.tv/helix/streams?user_id=${platformUserId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Client-Id': this.configService.get('TWITCH_CLIENT_ID'),
            },
          },
        ),
      );

      return response.data.data.length > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check Twitch stream status: ${error.message}`,
      );
      return false;
    }
  }

  async getViewerCount(
    platformUserId: string,
    accessToken: string,
  ): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.twitch.tv/helix/streams?user_id=${platformUserId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Client-Id': this.configService.get('TWITCH_CLIENT_ID'),
            },
          },
        ),
      );

      if (response.data.data.length === 0) {
        return 0;
      }

      return response.data.data[0].viewer_count || 0;
    } catch (error) {
      this.logger.error(`Failed to get Twitch viewer count: ${error.message}`);
      return 0;
    }
  }

  async getStreamDuration(
    platformUserId: string,
    accessToken: string,
  ): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.twitch.tv/helix/streams?user_id=${platformUserId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Client-Id': this.configService.get('TWITCH_CLIENT_ID'),
            },
          },
        ),
      );

      if (response.data.data.length === 0) {
        return 0;
      }

      // Calculate duration in minutes from started_at timestamp
      const startedAt = new Date(response.data.data[0].started_at);
      const now = new Date();
      const durationMs = now.getTime() - startedAt.getTime();
      return Math.floor(durationMs / (1000 * 60)); // Convert to minutes
    } catch (error) {
      this.logger.error(
        `Failed to get Twitch stream duration: ${error.message}`,
      );
      return 0;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://id.twitch.tv/oauth2/token', {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.configService.get('TWITCH_CLIENT_ID'),
          client_secret: this.configService.get('TWITCH_CLIENT_SECRET'),
        }),
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error(
        `Failed to refresh Twitch access token: ${error.message}`,
      );
      throw error;
    }
  }
}
