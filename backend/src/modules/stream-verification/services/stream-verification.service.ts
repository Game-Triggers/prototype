import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser, AuthProvider } from '@schemas/user.schema';
import { TwitchStreamVerifier } from './twitch-stream-verifier.service';
import { YouTubeStreamVerifier } from './youtube-stream-verifier.service';
import { ConfigService } from '@nestjs/config';
import { AuthTokenService } from '../../auth/services/auth-token.service';

export interface StreamVerificationResult {
  isLive: boolean;
  viewerCount: number;
  duration: number;
  lastVerified: Date;
  platform?: string;
}

@Injectable()
export class StreamVerificationService {
  private readonly logger = new Logger(StreamVerificationService.name);
  private readonly verificationCache: Map<string, StreamVerificationResult> =
    new Map();
  private readonly cacheExpiryMs = 60000; // 1 minute cache expiry

  constructor(
    @InjectModel('User') private readonly userModel: Model<IUser>,
    private readonly twitchVerifier: TwitchStreamVerifier,
    private readonly youtubeVerifier: YouTubeStreamVerifier,
    private readonly configService: ConfigService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  /**
   * Verifies if a user's stream is live and gets view count
   * Uses cache to avoid excessive API calls
   */
  async verifyStream(userId: string): Promise<StreamVerificationResult> {
    // Check cache first
    const cachedResult = this.verificationCache.get(userId);
    if (
      cachedResult &&
      new Date().getTime() - cachedResult.lastVerified.getTime() <
        this.cacheExpiryMs
    ) {
      return cachedResult;
    }

    // Fetch user data to determine platform
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      this.logger.warn(`User not found for stream verification: ${userId}`);
      return {
        isLive: false,
        viewerCount: 0,
        duration: 0,
        lastVerified: new Date(),
        platform: 'unknown',
      };
    }

    // Skip verification if user is not a streamer
    if (user.role !== 'streamer') {
      return {
        isLive: false,
        viewerCount: 0,
        duration: 0,
        lastVerified: new Date(),
        platform: 'unknown',
      };
    }

    try {
      let isLive = false;
      let viewerCount = 0;
      let duration = 0;

      // Verify based on platform
      let platform = 'unknown';

      if (user.authProvider === AuthProvider.TWITCH) {
        platform = 'twitch';
        const accessToken = await this.getTwitchAccessToken(user);
        if (!accessToken || !user.authProviderId) {
          return {
            isLive: false,
            viewerCount: 0,
            duration: 0,
            lastVerified: new Date(),
            platform,
          };
        }

        isLive = await this.twitchVerifier.isStreamLive(
          user.authProviderId,
          accessToken,
        );

        if (isLive) {
          viewerCount = await this.twitchVerifier.getViewerCount(
            user.authProviderId,
            accessToken,
          );
          duration = await this.twitchVerifier.getStreamDuration(
            user.authProviderId,
            accessToken,
          );
        }
      } else if (user.authProvider === AuthProvider.YOUTUBE) {
        platform = 'youtube';
        const accessToken = await this.getYouTubeAccessToken(user);
        if (!accessToken || !user.authProviderId) {
          return {
            isLive: false,
            viewerCount: 0,
            duration: 0,
            lastVerified: new Date(),
            platform,
          };
        }

        isLive = await this.youtubeVerifier.isStreamLive(
          user.authProviderId,
          accessToken,
        );

        if (isLive) {
          viewerCount = await this.youtubeVerifier.getViewerCount(
            user.authProviderId,
            accessToken,
          );
          duration = await this.youtubeVerifier.getStreamDuration(
            user.authProviderId,
            accessToken,
          );
        }
      }

      // Update cache
      const result = {
        isLive,
        viewerCount,
        duration,
        lastVerified: new Date(),
        platform,
      };
      this.verificationCache.set(userId, result);
      return result;
    } catch (error) {
      this.logger.error(
        `Error verifying stream for user ${userId}: ${error.message}`,
      );
      return {
        isLive: false,
        viewerCount: 0,
        duration: 0,
        lastVerified: new Date(),
        platform: 'unknown',
      };
    }
  }

  /**
   * Helper method to get a valid Twitch access token
   */
  private async getTwitchAccessToken(user: IUser): Promise<string | null> {
    try {
      // Use the AuthTokenService to handle token retrieval and refresh
      return await this.authTokenService.getAccessToken(
        user._id.toString(),
        AuthProvider.TWITCH,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get Twitch access token for user ${user._id}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Helper method to get a valid YouTube access token
   */
  private async getYouTubeAccessToken(user: IUser): Promise<string | null> {
    try {
      // Use the AuthTokenService to handle token retrieval and refresh
      return await this.authTokenService.getAccessToken(
        user._id.toString(),
        AuthProvider.YOUTUBE,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get YouTube access token for user ${user._id}: ${error.message}`,
      );
      return null;
    }
  }
}
