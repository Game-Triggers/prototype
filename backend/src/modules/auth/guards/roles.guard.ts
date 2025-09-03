import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@schemas/user.schema';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check role from multiple possible sources due to different JWT token formats
    const userRole = user?.role || user?.user?.role;
    
    if (!userRole) {
      this.logger.warn('No role found in user object', { user });
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => userRole === role);
    this.logger.debug(
      `Role check: required [${requiredRoles.join(', ')}], user has ${userRole}, result: ${hasRole}`,
    );
    
    return hasRole;
  }
}
