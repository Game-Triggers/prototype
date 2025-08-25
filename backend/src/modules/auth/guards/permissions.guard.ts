import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  EurekaRole,
  Permission,
  RoleManager,
  Portal,
} from '../../../../../lib/eureka-roles';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RequestWithUser } from '../interfaces/enhanced-request.interface';

/**
 * Enhanced Permissions Guard for Eureka Role System
 *
 * This guard implements fine-grained permission checking based on the user's role.
 * It supports:
 * - Specific permission requirements (@RequirePermissions)
 * - Any permission requirements (@RequireAnyPermission)
 * - Portal-based access control (@RequirePortal)
 * - Legacy role-based access (@Roles)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Map legacy roles to Eureka roles if necessary
    const userRole = this.mapToEurekaRole(user.role);

    // Check required permissions (AND logic - user must have ALL permissions)
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        RoleManager.hasPermission(userRole, permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    // Check any permission requirements (OR logic - user needs at least one)
    const anyPermissions = this.reflector.getAllAndOverride<Permission[]>(
      `${PERMISSIONS_KEY}_ANY`,
      [context.getHandler(), context.getClass()],
    );

    if (anyPermissions && anyPermissions.length > 0) {
      const hasAnyPermission = anyPermissions.some((permission) =>
        RoleManager.hasPermission(userRole, permission),
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Need at least one of: ${anyPermissions.join(', ')}`,
        );
      }
    }

    // Check portal access
    const requiredPortals = this.reflector.getAllAndOverride<Portal[]>(
      'portals',
      [context.getHandler(), context.getClass()],
    );

    if (requiredPortals && requiredPortals.length > 0) {
      const userPortal = RoleManager.getPortal(userRole);
      const hasPortalAccess = requiredPortals.includes(userPortal);

      if (!hasPortalAccess) {
        throw new ForbiddenException(
          `Portal access denied. User portal: ${userPortal}, Required: ${requiredPortals.join(', ')}`,
        );
      }
    }

    // Legacy role-based access (for backward compatibility)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(
        (role) => user.role === role || userRole === role,
      );

      if (!hasRole) {
        throw new ForbiddenException(
          `Role access denied. User role: ${user.role}, Required: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Attach processed role information to request for downstream use
    request.userRole = userRole;
    request.userPortal = RoleManager.getPortal(userRole);
    request.userPermissions = RoleManager.getPermissions(userRole);

    return true;
  }

  /**
   * Map legacy roles to new Eureka role system
   * @param role - User's current role
   * @returns Mapped Eureka role
   */
  private mapToEurekaRole(role: string): EurekaRole {
    // If it's already a valid Eureka role, return as-is
    if (Object.values(EurekaRole).includes(role as EurekaRole)) {
      return role as EurekaRole;
    }

    // Map legacy roles
    return RoleManager.mapLegacyRole(role);
  }
}

/**
 * Role-specific guard that checks if user belongs to specific roles
 * This is a simpler alternative to PermissionsGuard for basic role checking
 */
@Injectable()
export class EurekaRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<EurekaRole[]>(
      'eureka_roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userRole = this.mapToEurekaRole(user.role);
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Role access denied. User role: ${userRole}, Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  private mapToEurekaRole(role: string): EurekaRole {
    if (Object.values(EurekaRole).includes(role as EurekaRole)) {
      return role as EurekaRole;
    }
    return RoleManager.mapLegacyRole(role);
  }
}

/**
 * Decorator for EurekaRolesGuard
 * @param roles - Array of required Eureka roles
 * @example @RequireEurekaRoles(EurekaRole.MARKETING_HEAD, EurekaRole.CAMPAIGN_MANAGER)
 */
export const RequireEurekaRoles = (...roles: EurekaRole[]) =>
  SetMetadata('eureka_roles', roles);

/**
 * Helper function to create a composed guard with multiple checks
 * @param permissions - Required permissions
 * @param roles - Required roles
 * @param portals - Required portals
 */
export const createPermissionGuard = (
  permissions?: Permission[],
  roles?: EurekaRole[],
  portals?: Portal[],
) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    if (permissions) {
      SetMetadata(PERMISSIONS_KEY, permissions)(
        target,
        propertyName,
        descriptor,
      );
    }
    if (roles) {
      SetMetadata('eureka_roles', roles)(target, propertyName, descriptor);
    }
    if (portals) {
      SetMetadata('portals', portals)(target, propertyName, descriptor);
    }
  };
};
