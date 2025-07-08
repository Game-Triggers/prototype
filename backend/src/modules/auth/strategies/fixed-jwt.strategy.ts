import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

/**
 * JWT Strategy for validating access tokens
 * Works with both tokens issued by NestJS and NextAuth
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'supersecretkey',
      // More lenient configuration for token validation
      // Don't require specific issuers as NextAuth and NestJS may use different ones
      issuer: undefined,
      // Add debugging and more information
      passReqToCallback: true,
    });

    this.logger.log(
      'JWT Strategy initialized with secret key and flexible validation',
    );
  }

  /**
   * Validate and extract user data from JWT payload
   * This handles both NestJS and NextAuth token formats
   */
  async validate(request: any, payload: any) {
    try {
      this.logger.debug(
        `JWT validation for token payload: ${JSON.stringify({
          sub: payload.sub,
          email: payload.email || payload.user?.email,
          hasUser: !!payload.user,
        })}`,
      );

      // Handle different token formats
      let userId = payload.sub;

      // For NextAuth tokens, sub may contain the user ID
      // If user object is present (NextAuth format), use that directly
      if (payload.user?.id) {
        userId = payload.user.id;
        this.logger.debug(`Using user ID from NextAuth user object: ${userId}`);
      }

      // Find the user by ID
      const user = await this.usersService.findOne(userId);

      if (!user) {
        this.logger.warn(`No user found for ID: ${userId}`);
      } else {
        this.logger.debug(`User found: ${user.email} with role: ${user.role}`);
      }

      // Return user information for the request
      const result = {
        userId,
        email: payload.email || payload.user?.email,
        role: payload.role || payload.user?.role,
        user,
      };

      return result;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
