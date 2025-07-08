import { Controller, Get, UseGuards, Req, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/enhanced-jwt-auth.guard';
import { Request } from 'express';

@Controller('auth-debug')
export class AuthDebugController {
  private readonly logger = new Logger(AuthDebugController.name);

  @Get('status')
  @UseGuards(JwtAuthGuard)
  checkAuthStatus(@Req() request: Request) {
    this.logger.debug('Auth debug endpoint called with user:', request.user);

    return {
      authenticated: true,
      user: request.user,
      headers: {
        authorization: request.headers.authorization
          ? 'Bearer [token]'
          : 'Missing',
        cookie: request.headers.cookie ? 'Present' : 'Missing',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('public')
  publicEndpoint() {
    this.logger.debug('Public endpoint called');

    return {
      message: 'This is a public endpoint',
      timestamp: new Date().toISOString(),
    };
  }
}
