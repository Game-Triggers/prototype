import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser, AuthProvider } from '@schemas/user.schema';
import { IAuthSession } from '@schemas/auth-session.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Interface for auth tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Service for managing auth tokens for third-party services
 * Handles retrieving, refreshing and storing tokens
 */
@Injectable()
export class AuthTokenService {
  private readonly logger = new Logger(AuthTokenService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<IUser>,
    @InjectModel('AuthSession')
    private readonly authSessionModel: Model<IAuthSession>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get a valid access token for a user and specified provider
   * Will attempt to refresh the token if expired
   */
  async getAccessToken(
    userId: string,
    provider: AuthProvider,
  ): Promise<string | null> {
    try {
      // Check if we have a valid token in the database
      const session = await this.authSessionModel
        .findOne({
          userId: userId,
          provider: provider,
          'token.expiresAt': { $gt: new Date() },
        })
        .exec();

      // If we found a valid session with an unexpired token, return it
      if (session && session.token && session.token.accessToken) {
        return session.token.accessToken;
      }

      // If we have a session but the token is expired, try to refresh it
      if (session && session.token && session.token.refreshToken) {
        const newTokens = await this.refreshAccessToken(
          userId,
          provider,
          session.token.refreshToken,
        );

        if (newTokens && newTokens.accessToken) {
          return newTokens.accessToken;
        }
      }

      // If we couldn't get a valid token from the database, fall back to mock tokens
      // This is a temporary solution and should be removed in production
      this.logger.warn(
        `Using mock token for ${provider} - implement real token storage!`,
      );

      if (provider === AuthProvider.TWITCH) {
        return this.configService.get('TWITCH_ACCESS_TOKEN') || null;
      } else if (provider === AuthProvider.YOUTUBE) {
        return this.configService.get('YOUTUBE_ACCESS_TOKEN') || null;
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get access token for user ${userId} (${provider}): ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Refresh an access token using the refresh token
   * Updates stored tokens with new values
   */
  async refreshAccessToken(
    userId: string,
    provider: AuthProvider,
    refreshToken: string,
  ): Promise<AuthTokens | null> {
    try {
      if (provider === AuthProvider.TWITCH) {
        return await this.refreshTwitchToken(refreshToken);
      } else if (provider === AuthProvider.YOUTUBE) {
        return await this.refreshYouTubeToken(refreshToken);
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to refresh token for ${provider}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Refresh a Twitch access token
   */
  private async refreshTwitchToken(
    refreshToken: string,
  ): Promise<AuthTokens | null> {
    try {
      const clientId = this.configService.get('TWITCH_CLIENT_ID');
      const clientSecret = this.configService.get('TWITCH_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        this.logger.error('Missing Twitch client credentials in config');
        return null;
      }

      const response = await firstValueFrom(
        this.httpService.post('https://id.twitch.tv/oauth2/token', {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      );

      if (response.data?.access_token) {
        const now = new Date();
        const expiresAt = new Date(
          now.getTime() + response.data.expires_in * 1000,
        );

        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresAt,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Twitch token refresh failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Refresh a YouTube access token
   */
  private async refreshYouTubeToken(
    refreshToken: string,
  ): Promise<AuthTokens | null> {
    try {
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        this.logger.error('Missing Google client credentials in config');
        return null;
      }

      const response = await firstValueFrom(
        this.httpService.post('https://oauth2.googleapis.com/token', {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      );

      if (response.data?.access_token) {
        const now = new Date();
        const expiresAt = new Date(
          now.getTime() + response.data.expires_in * 1000,
        );

        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || refreshToken, // Google may not always return a new refresh token
          expiresAt,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`YouTube token refresh failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Store OAuth tokens received from provider in our database
   * Used after OAuth authentication to save tokens for later use
   */
  async storeAuthTokens(
    userId: string,
    provider: AuthProvider,
    accessToken: string,
    refreshToken: string,
    expiresIn: number = 3600, // Default 1 hour expiry if not provided
  ): Promise<void> {
    try {
      // Log what we're storing (sanitized)
      this.logger.debug(
        `Storing tokens for ${userId} (${provider}): Access token: ${accessToken.substring(0, 10)}..., Has refresh token: ${!!refreshToken}`,
      );

      // Calculate expiration date
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresIn * 1000);

      // Check if a session already exists for this user and provider
      const existingSession = await this.authSessionModel
        .findOne({
          userId,
          provider,
        })
        .exec();

      if (existingSession) {
        // Update existing session
        existingSession.token = {
          accessToken,
          refreshToken,
          expiresAt,
        };
        await existingSession.save();
        this.logger.log(`Updated auth tokens for user ${userId} (${provider})`);
      } else {
        // Create new session
        await this.authSessionModel.create({
          userId,
          provider,
          token: {
            accessToken,
            refreshToken,
            expiresAt,
          },
        });
        this.logger.log(
          `Stored new auth tokens for user ${userId} (${provider})`,
        );
      }

      // Verify token was stored
      const verification = await this.authSessionModel
        .findOne({
          userId,
          provider,
        })
        .exec();

      if (verification) {
        this.logger.log(
          `Verified token storage for user ${userId} (${provider})`,
        );
      } else {
        this.logger.error(
          `Failed to verify token storage for user ${userId} (${provider})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to store auth tokens for user ${userId}: ${error.message}`,
      );
    }
  }
}
