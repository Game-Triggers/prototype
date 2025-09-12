import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../../../../lib/eureka-roles';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for an endpoint
 * @param permissions - Array of required permissions
 * @example @RequirePermissions(Permission.CREATE_CAMPAIGN, Permission.APPROVE_CAMPAIGN)
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to require any of the specified permissions (OR logic)
 * @param permissions - Array of permissions (user needs at least one)
 * @example @RequireAnyPermission(Permission.READ_CAMPAIGN, Permission.VIEW_ANALYTICS)
 */
export const RequireAnyPermission = (...permissions: Permission[]) =>
  SetMetadata(`${PERMISSIONS_KEY}_ANY`, permissions);

/**
 * Decorator to check portal access
 * @param portals - Array of allowed portals
 * @example @RequirePortal(Portal.BRAND, Portal.ADMIN)
 */
export const RequirePortal = (...portals: string[]) =>
  SetMetadata('portals', portals);

/**
 * Decorator for role-based access (legacy support)
 * @param roles - Array of allowed roles
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
