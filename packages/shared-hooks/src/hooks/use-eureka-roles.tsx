/**
 * Client-side Role Management Utilities for React Components
 * 
 * This module provides React hooks and utilities for role-based UI rendering
 * and permission checking in the frontend.
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { EurekaRole, Permission, RoleManager,Portal, RoleCategory } from '@gametriggers/shared-auth';

/**
 * Hook for accessing user role information and permissions
 */
export function useEurekaRole() {
  const { data: session, status } = useSession();

  const roleInfo = useMemo(() => {
    if (!session?.user?.role) {
      return {
        role: null,
        eurekaRole: null,
        portal: null,
        permissions: [],
        isLoading: status === 'loading',
        isAuthenticated: false,
        canDelete: false,
        canSuspend: false,
      };
    }

    const eurekaRole = mapLegacyRole(session.user.role);
    const portal = RoleManager.getPortal(eurekaRole);
    const permissions = RoleManager.getPermissions(eurekaRole);

    return {
      role: session.user.role,
      eurekaRole,
      portal,
      permissions,
      isLoading: false,
      isAuthenticated: true,
      canDelete: RoleManager.canDelete(eurekaRole),
      canSuspend: RoleManager.canSuspend(eurekaRole),
    };
  }, [session, status]);

  return roleInfo;
}

/**
 * Hook for permission checking
 */
export function usePermissions() {
  const { eurekaRole, permissions } = useEurekaRole();

  const hasPermission = (permission: Permission): boolean => {
    if (!eurekaRole) return false;
    return RoleManager.hasPermission(eurekaRole, permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (!eurekaRole) return false;
    return requiredPermissions.some((permission) =>
      permissions.includes(permission),
    );
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (!eurekaRole) return false;
    return requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
  };
}

/**
 * Hook for portal-based UI rendering
 */
export function usePortalAccess() {
  const { portal, eurekaRole } = useEurekaRole();

  return {
    portal,
    shouldShowBrandComponents: portal === Portal.BRAND,
    shouldShowAdminComponents: portal === Portal.ADMIN,
    shouldShowPublisherComponents: portal === Portal.PUBLISHER,
    isBrandUser: portal === Portal.BRAND,
    isAdminUser: portal === Portal.ADMIN,
    isPublisherUser: portal === Portal.PUBLISHER,
    isSuperAdmin: eurekaRole === EurekaRole.SUPER_ADMIN,
  };
}

/**
 * Component for conditional rendering based on permissions
 */
interface PermissionGateProps {
  permissions?: Permission[];
  anyPermission?: Permission[];
  roles?: EurekaRole[];
  portal?: Portal;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permissions,
  anyPermission,
  roles,
  portal,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();
  const { portal: userPortal, eurekaRole } = useEurekaRole();

  // Check permissions (AND logic - user must have ALL)
  if (permissions && !hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  // Check any permissions (OR logic - user needs at least one)
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>;
  }

  // Check specific roles
  if (roles && eurekaRole && !roles.includes(eurekaRole)) {
    return <>{fallback}</>;
  }

  // Check portal access
  if (portal && userPortal !== portal) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component for portal-based conditional rendering
 */
interface PortalGateProps {
  portal: Portal;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PortalGate({ portal, fallback = null, children }: PortalGateProps) {
  const { portal: userPortal } = usePortalAccess();

  if (userPortal !== portal) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component for role-based conditional rendering
 */
interface RoleGateProps {
  roles: EurekaRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { eurekaRole } = useEurekaRole();

  if (!eurekaRole || !roles.includes(eurekaRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes based on permissions
 */
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: Permission[],
  fallback?: React.ComponentType,
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasAllPermissions } = usePermissions();

    if (!hasAllPermissions(requiredPermissions)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Higher-order component for protecting routes based on portal access
 */
export function withPortalAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPortal: Portal,
  fallback?: React.ComponentType,
) {
  return function PortalProtectedComponent(props: P) {
    const { portal } = usePortalAccess();

    if (portal !== requiredPortal) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Portal Access Denied
            </h2>
            <p className="text-gray-600">
              This section is not available for your role type.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Utility function to get user-friendly role name
 */
export function getRoleName(role: EurekaRole): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Utility function to get role category display name
 */
export function getCategoryName(category: RoleCategory): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Utility function to get portal display name
 */
export function getPortalName(portal: Portal): string {
  switch (portal) {
    case Portal.BRAND:
      return 'Brand Portal';
    case Portal.ADMIN:
      return 'Admin Portal';
    case Portal.PUBLISHER:
      return 'Publisher Portal';
    default:
      return 'Unknown Portal';
  }
}

/**
 * Map legacy roles to Eureka roles (client-side version)
 */
function mapLegacyRole(role: string): EurekaRole {
  // If it's already a valid Eureka role, return as-is
  if (Object.values(EurekaRole).includes(role as EurekaRole)) {
    return role as EurekaRole;
  }

  // Map legacy roles
  switch (role.toLowerCase()) {
    case 'streamer':
      return EurekaRole.STREAMER_INDIVIDUAL;
    case 'brand':
      return EurekaRole.CAMPAIGN_MANAGER;
    case 'admin':
      return EurekaRole.ADMIN_EXCHANGE;
    default:
      return EurekaRole.STREAMER_INDIVIDUAL; // Default fallback
  }
}

/**
 * Custom hook for role-based navigation
 */
export function useRoleBasedNavigation() {
  const { portal, eurekaRole } = useEurekaRole();
  const { hasPermission } = usePermissions();

  const getDefaultRoute = (): string => {
    switch (portal) {
      case Portal.BRAND:
        return '/dashboard/brand';
      case Portal.ADMIN:
        return '/dashboard/admin';
      case Portal.PUBLISHER:
        return '/dashboard/publisher';
      default:
        return '/dashboard';
    }
  };

  const canAccessRoute = (route: string, requiredPermissions?: Permission[]): boolean => {
    if (!eurekaRole) return false;
    
    if (requiredPermissions) {
      return requiredPermissions.every((permission) => hasPermission(permission));
    }
    
    return true;
  };

  return {
    getDefaultRoute,
    canAccessRoute,
    portal,
    eurekaRole,
  };
}

/**
 * Export commonly used permission sets for convenience
 */
export const CommonPermissions = {
  CAMPAIGN_MANAGEMENT: [
    Permission.CREATE_CAMPAIGN,
    Permission.READ_CAMPAIGN,
    Permission.UPDATE_CAMPAIGN,
  ],
  USER_MANAGEMENT: [
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
  ],
  FINANCIAL_OPERATIONS: [
    Permission.VIEW_BILLING,
    Permission.MANAGE_BUDGET,
    Permission.PROCESS_PAYOUTS,
  ],
  ANALYTICS_ACCESS: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_PERFORMANCE_METRICS,
  ],
  ADMIN_OPERATIONS: [
    Permission.CONFIGURE_PLATFORM,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.OVERRIDE_SYSTEM,
  ],
} as const;
