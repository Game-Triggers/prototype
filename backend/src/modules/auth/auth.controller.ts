import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import {
  RegisterCredentialsDto,
  LoginCredentialsDto,
  OAuthExchangeDto,
} from './dto/auth.dto';
import { Request } from 'express';
import { IUser } from '@schemas/user.schema';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

// Define RequestWithUser interface for type safety
interface RequestWithUser extends Request {
  user: IUser & { _id: Types.ObjectId };
}

/**
 * Authentication Controller
 *
 * Serves as backend for NextAuth integration and provides endpoints for user authentication,
 * including email/password login, registration, and OAuth token exchange for social providers
 * like Twitch and YouTube. Also handles token validation, refresh, and user profile retrieval.
 *
 * Used by: All users for authentication purposes, and by NextAuth integration on the frontend.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Register a new user (used by NextAuth credential provider)
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Create a new user account with email/password or social provider',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'streamer',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid input data or user already exists',
  })
  async register(@Body() registerDto: RegisterCredentialsDto) {
    const user = await this.authService.register(registerDto);
    return this.authService.login(user);
  }

  /**
   * Login with email/password (used by NextAuth credential provider)
   */
  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user with email and password credentials',
  })
  @ApiCreatedResponse({
    description: 'User successfully authenticated',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'streamer',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  /**
   * Twitch OAuth token exchange endpoint
   * Used by NextAuth to validate Twitch tokens and create/update users
   */
  @Post('twitch/token-exchange')
  @ApiOperation({
    summary: 'Exchange Twitch OAuth token for JWT',
    description: 'Convert Twitch OAuth tokens into application JWT tokens',
  })
  @ApiBody({
    schema: {
      $ref: '#/components/schemas/OAuthExchangeDto',
    },
  })
  @ApiCreatedResponse({
    description: 'Token successfully exchanged',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        email: 'twitch-user@example.com',
        name: 'TwitchStreamer',
        role: 'streamer',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid OAuth token' })
  async twitchTokenExchange(@Body() exchangeDto: OAuthExchangeDto) {
    return this.authService.handleOAuthExchange('twitch', exchangeDto);
  }

  /**
   * YouTube OAuth token exchange endpoint
   * Used by NextAuth to validate YouTube tokens and create/update users
   */
  @Post('youtube/token-exchange')
  async handleYouTubeOAuth(@Body() exchangeDto: OAuthExchangeDto) {
    console.log('[Backend] Received YouTube token exchange request');

    try {
      return await this.authService.handleOAuthExchange('youtube', exchangeDto);
    } catch (error) {
      console.error('[Backend] Error processing YouTube OAuth:', error);
      throw new InternalServerErrorException(
        'Failed to process YouTube authentication',
      );
    }
  }

  /**
   * Refresh an access token using a refresh token
   * May be used by NextAuth refresh token rotation
   */
  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * Get the current user profile
   * Used for verifying authentication
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get the authenticated user profile',
    description: 'Returns the profile of the currently authenticated user',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '60d21b4667d0d8992e610c85',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'streamer',
        image: 'https://example.com/avatar.jpg',
        authProvider: 'twitch',
        channelUrl: 'https://twitch.tv/username',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  /**
   * Validate a token directly
   * Used for debugging authentication issues
   */
  @Post('validate-token')
  async validateToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }
}
