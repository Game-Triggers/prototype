import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@schemas/user.schema';

@Injectable()
export class YouTubeStrategy extends PassportStrategy(Strategy, 'youtube') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.YOUTUBE_CLIENT_ID || 'your-youtube-client-id',
      clientSecret:
        process.env.YOUTUBE_CLIENT_SECRET || 'your-youtube-client-secret',
      callbackURL:
        process.env.YOUTUBE_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/youtube/callback',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Add YouTube channel URL if available
    if (profile._json && profile._json.youtube) {
      profile.url = `https://youtube.com/channel/${profile._json.youtube.channelId}`;
    }

    const user = await this.authService.validateOAuthUser(
      profile,
      AuthProvider.YOUTUBE,
    );
    return user;
  }
}
