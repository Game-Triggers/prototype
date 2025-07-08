import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitch-new';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@schemas/user.schema';

@Injectable()
export class TwitchStrategy extends PassportStrategy(Strategy, 'twitch') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.TWITCH_CLIENT_ID || 'your-twitch-client-id',
      clientSecret:
        process.env.TWITCH_CLIENT_SECRET || 'your-twitch-client-secret',
      callbackURL:
        process.env.TWITCH_CALLBACK_URL ||
        'http://localhost:3000/api/auth/callback/twitch',
      scope: 'user:read:email',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = await this.authService.validateOAuthUser(
      profile,
      AuthProvider.TWITCH,
    );
    return user;
  }
}
