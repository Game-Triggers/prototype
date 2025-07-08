import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Extract token from request for logging
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    this.logger.debug(
      `Authentication attempt with token: ${token ? 'Present' : 'Missing'}`,
    );

    // Add the original URL to the logs to help with debugging
    this.logger.debug(`Request URL: ${request.method} ${request.url}`);

    // Continue with standard JWT authentication
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // Enhanced error handling with detailed logs
    if (err) {
      this.logger.error(`Authentication error: ${err.message}`, err.stack);
      throw err;
    }

    if (!user) {
      this.logger.warn(
        `Authentication failed: ${info?.message || 'No user found'}`,
      );
      throw new UnauthorizedException(
        info?.message || 'You are not authorized to access this resource',
      );
    }

    this.logger.log(
      `User authenticated successfully: ${user.email || user.userId}`,
    );
    return user;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
