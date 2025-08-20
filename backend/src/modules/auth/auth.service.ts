import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { IUser, UserRole, AuthProvider } from '@schemas/user.schema';
import { RegisterCredentialsDto, OAuthExchangeDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthTokenService } from './services/auth-token.service';
import { XP_REWARDS } from '../../constants/xp-constants';
import { RP_REWARDS } from '../../constants/rp-constants';

/**
 * Auth service responsible for authentication and user management
 * Updated to work seamlessly with NextAuth.js
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel('User') private readonly userModel: Model<IUser>,
    private readonly authTokenService: AuthTokenService,
  ) {}

  /**
   * Validates a user from OAuth provider
   */
  async validateOAuthUser(
    profile: any,
    provider: AuthProvider,
  ): Promise<IUser> {
    // First try to find user by provider ID
    let user = await this.usersService.findByAuthProviderId(profile.id);

    // If user not found by provider ID, try to find by email
    if (!user && profile.email) {
      user = await this.usersService.findByEmail(profile.email);
    }

    // If user exists, return the user
    if (user) {
      return user;
    }

    // If user does not exist, create a new one
    const newUser = await this.usersService.create({
      email: profile.email || `${profile.id}@${provider.toLowerCase()}.user`,
      name: profile.displayName || profile.username || profile.name || 'User',
      image: profile.photos?.[0]?.value || profile.picture,
      role: UserRole.STREAMER, // OAuth users are streamers by default
      authProvider: provider,
      authProviderId: profile.id,
      channelUrl: profile.url || '',
      category: [],
      language: [],
      description: '',
    });

    // Award signup XP for new OAuth users
    try {
      await this.usersService.addXP(newUser._id.toString(), 'SIGNUP', XP_REWARDS.SIGNUP);
    } catch (error) {
      // Log error but don't fail registration if XP addition fails
      console.error('Failed to add signup XP for OAuth user:', error);
    }

    // Award signup RP for new OAuth users
    try {
      await this.usersService.addRP(newUser._id.toString(), 'SIGNUP', RP_REWARDS.SIGNUP);
    } catch (error) {
      // Log error but don't fail registration if RP addition fails
      console.error('Failed to add signup RP for OAuth user:', error);
    }

    return newUser;
  }

  /**
   * Validates a user with email and password
   */
  async validateUser(email: string, password: string): Promise<any> {
    // Use includePassword=true to retrieve the password field for authentication
    const user = await this.usersService.findByEmail(email, true);

    if (!user || user.authProvider !== AuthProvider.EMAIL || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const result = user.toObject();
    delete result.password;
    return result;
  }

  /**
   * Register a new user with email/password
   */
  async register(registerDto: RegisterCredentialsDto): Promise<IUser> {
    const { email, password, name, companyName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with email auth provider
    const newUser = new this.userModel({
      email,
      name,
      role,
      authProvider: AuthProvider.EMAIL,
      password: hashedPassword,
      description: companyName ? `Company: ${companyName}` : '',
    });

    await newUser.save();

    // Award signup XP
    try {
      await this.usersService.addXP(newUser._id.toString(), 'SIGNUP', XP_REWARDS.SIGNUP);
    } catch (error) {
      // Log error but don't fail registration if XP addition fails
      console.error('Failed to add signup XP:', error);
    }

    // Award signup RP
    try {
      await this.usersService.addRP(newUser._id.toString(), 'SIGNUP', RP_REWARDS.SIGNUP);
    } catch (error) {
      // Log error but don't fail registration if RP addition fails
      console.error('Failed to add signup RP:', error);
    }

<<<<<<< HEAD

=======
>>>>>>> 4ce3f0d (feat: implement comprehensive RP (Reputation Points) system- Add RP context and state management with daily reset functionality- Create RP display component with green shield icon and hover tooltip- Implement RP constants with level calculation and activity rewards- Add backend RP DTOs, services, and API endpoints- Integrate RP system into navbar alongside XP, Energy, and Streak- Add RP field to user schema with activity tracking- Implement automatic RP rewards on user signup (5 RP)- Create debug/test interface for RP functionality- Design extensible system for future activity-based RP rewards- Add comprehensive error handling and loading states- Include real-time RP updates and daily progress tracking)
    // Remove password from returned user object
    const result = newUser.toObject();
    delete result.password;

    return result;
  }

  /**
   * Log in a user and generate JWT token
   * This is used for both direct login and NextAuth token generation
   */
  async login(user: IUser) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      // Add issuer to distinguish NestJS-issued tokens
      iss: process.env.JWT_ISSUER || 'nestjs-auth',
    };

    // Generate JWT token compatible with NextAuth
    const accessToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'supersecretkey',
      expiresIn: '24h',
    });

    // Create refresh token
    const refreshToken = this.jwtService.sign(
      { sub: user._id, type: 'refresh' },
      {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.NEXTAUTH_SECRET ||
          'refresh-supersecretkey',
        expiresIn: '7d',
      },
    );

    // Return response in format expected by NextAuth.js
    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image || null,
        role: user.role, // Ensure role is included
      },
    };
  }

  /**
   * Handle OAuth token exchange from NextAuth
   */
  async handleOAuthExchange(
    provider: string,
    exchangeDto: OAuthExchangeDto,
  ): Promise<any> {
    try {
      console.log(
        `[Backend] Processing OAuth exchange for ${provider} with profile:`,
        exchangeDto.profile,
      );

      if (!exchangeDto || !exchangeDto.profile) {
        console.error(
          '[Backend] Invalid OAuth exchange data received:',
          exchangeDto,
        );
        throw new UnauthorizedException('Invalid OAuth exchange data');
      }

      // Map the provider name to AuthProvider enum
      let authProvider: AuthProvider;

      if (provider === 'twitch') {
        authProvider = AuthProvider.TWITCH;
      } else if (provider === 'youtube') {
        authProvider = AuthProvider.YOUTUBE;
      } else {
        console.error(`[Backend] Unsupported OAuth provider: ${provider}`);
        throw new UnauthorizedException('Unsupported OAuth provider');
      }

      // Extract profile data from the DTO
      const { profile } = exchangeDto;

      if (!profile.id) {
        console.error('[Backend] Missing ID in profile data:', profile);
        throw new UnauthorizedException('Missing profile ID in OAuth data');
      }

      console.log(
        `[Backend] Looking for existing user with provider ID ${profile.id} or email ${profile.email}`,
      );

      // Check if user exists by provider ID
      let user = await this.usersService.findByAuthProviderId(profile.id);
      console.log(
        '[Backend] User found by provider ID:',
        user ? `Yes (ID: ${user._id})` : 'No',
      );

      // If not found by ID, try by email
      if (!user && profile.email) {
        user = await this.usersService.findByEmail(profile.email);
        console.log(
          '[Backend] User found by email:',
          user ? `Yes (ID: ${user._id})` : 'No',
        );
      }

      // If user exists, update their profile data
      if (user) {
        // If the user was found by email but has a different auth provider,
        // update their auth provider to the one they're signing in with
        if (user.authProvider !== authProvider) {
          console.log(
            `[Backend] Updating auth provider from ${user.authProvider} to ${authProvider}`,
          );
          user.authProvider = authProvider;
          user.authProviderId = profile.id;
        }

        // Update user information
        user.name = profile.name || user.name;
        user.email = profile.email || user.email;
        user.image = profile.image || user.image;
        // Always ensure role is set to streamer for OAuth users
        if (user.role !== UserRole.STREAMER) {
          console.log(
            `[Backend] Updating user role from ${user.role} to ${UserRole.STREAMER}`,
          );
          user.role = UserRole.STREAMER;
        }

        try {
          await user.save();
          console.log(
            '[Backend] User updated successfully:',
            user._id,
            'with role:',
            user.role,
          );
        } catch (saveError) {
          console.error('[Backend] Error saving updated user:', saveError);
          throw new InternalServerErrorException('Failed to save user updates');
        }
      } else {
        // If user doesn't exist, create a new one
        console.log('[Backend] Creating new user for provider:', authProvider);

        try {
          user = await this.usersService.create({
            email: profile.email || `${profile.id}@${provider}.user`,
            name: profile.name || 'User',
            image: profile.image || undefined,
            role: UserRole.STREAMER, // OAuth users are streamers by default
            authProvider,
            authProviderId: profile.id,
            channelUrl: '',
            category: [],
            language: [],
            description: `${authProvider} streamer`,
          });

          console.log(
            '[Backend] New user created:',
            user._id,
            'with role:',
            user.role,
          );
        } catch (createError) {
          console.error('[Backend] Error creating new user:', createError);
          throw new InternalServerErrorException('Failed to create new user');
        }
      }

      // Generate token for the user - this will be stored by NextAuth
      const tokens = await this.login(user);

      // Store the OAuth tokens in our database for future API calls
      console.log('[Backend] Exchange DTO tokens:', {
        hasAccessToken: !!exchangeDto.accessToken,
        hasRefreshToken: !!exchangeDto.refreshToken,
        accessTokenPrefix: exchangeDto.accessToken
          ? exchangeDto.accessToken.substring(0, 10) + '...'
          : 'none',
      });

      if (exchangeDto.accessToken) {
        try {
          // Default expiry time (1 hour if not specified)
          const expiresIn = 3600;

          // Store the tokens using our AuthTokenService - if no refresh token, use access token as fallback
          await this.authTokenService.storeAuthTokens(
            user._id.toString(),
            authProvider,
            exchangeDto.accessToken,
            exchangeDto.refreshToken || exchangeDto.accessToken, // Use access token as fallback
            expiresIn,
          );

          console.log(
            `[Backend] OAuth tokens stored for user ${user._id} (${authProvider})`,
          );
        } catch (tokenStoreError) {
          // Just log the error but don't fail the authentication
          console.error(
            '[Backend] Error storing OAuth tokens:',
            tokenStoreError,
          );
        }
      } else {
        console.warn(
          `[Backend] Missing OAuth tokens for ${authProvider} user ${user._id}`,
        );
      }

      return {
        ...tokens,
        success: true,
      };
    } catch (error) {
      console.error('[Backend] Error in handleOAuthExchange:', error);
      throw new InternalServerErrorException(
        'Failed to process OAuth authentication',
      );
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.NEXTAUTH_SECRET ||
          'refresh-supersecretkey',
      });

      // Check token type for additional security
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      // Find the user
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate a token directly (for testing/debugging)
   */
  async validateToken(token: string) {
    try {
      // This will validate tokens from both NestJS and NextAuth
      // since we use the same secret and validation options
      const payload = this.jwtService.verify(token, {
        secret:
          process.env.JWT_SECRET ||
          process.env.NEXTAUTH_SECRET ||
          'supersecretkey',
      });

      // Get user ID based on token format
      const userId = payload.user?.id || payload.sub;

      // Find user in database
      const user = await this.usersService.findOne(userId);

      if (!user) {
        return { valid: false, message: 'User not found' };
      }

      return {
        valid: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      return { valid: false, message: error.message || 'Invalid token' };
    }
  }
}
