/**
 * Role Validation and Management Utilities
 * 
 * Provides utilities for validating user roles, permissions, and managing
 * role transitions within the Eureka RBAC system.
 */

// import { EurekaRole, Permission, Portal, RoleManager, ROLE_CONFIGURATIONS } from '../lib/eureka-roles';
import { EurekaRole, Permission, Portal, RoleManager, ROLE_CONFIGURATIONS } from '@gametriggers/shared-roles';

export interface UserWithRoles {
  _id: string;
  email: string;
  eurekaRole?: EurekaRole;
  role?: string; // Legacy role
  portal?: Portal;
  permissions?: Permission[];
  isActive?: boolean;
}

export interface RoleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: EurekaRole[];
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  requiredPermissions: Permission[];
  userPermissions: Permission[];
  missingPermissions: Permission[];
}

/**
 * Role validation and management utilities
 */
export class RoleValidationService {

  /**
   * Validate if a user's role assignment is valid
   */
  static validateUserRole(user: UserWithRoles): RoleValidationResult {
    const result: RoleValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check if user has Eureka role
    if (!user.eurekaRole) {
      if (user.role) {
        result.warnings.push(`User has legacy role '${user.role}' but no Eureka role assigned`);
        result.suggestions.push(RoleManager.mapLegacyRole(user.role));
      } else {
        result.errors.push('User has no role assigned');
        result.isValid = false;
      }
      return result;
    }

    // Validate Eureka role exists in configuration
    if (!ROLE_CONFIGURATIONS[user.eurekaRole]) {
      result.errors.push(`Invalid Eureka role: ${user.eurekaRole}`);
      result.isValid = false;
      return result;
    }

    // Check portal consistency
    const expectedPortal = RoleManager.getPortal(user.eurekaRole);
    if (user.portal && user.portal !== expectedPortal) {
      result.errors.push(`Portal mismatch: user has ${user.portal}, but role ${user.eurekaRole} requires ${expectedPortal}`);
      result.isValid = false;
    }

    // Check if user is active for roles that require it
    if (!user.isActive) {
      const config = ROLE_CONFIGURATIONS[user.eurekaRole];
      if (config.requiresAgreement) {
        result.warnings.push(`Role ${user.eurekaRole} requires active agreement but user is inactive`);
      }
    }

    return result;
  }

  /**
   * Check if user has required permission(s)
   */
  static checkPermission(
    user: UserWithRoles, 
    requiredPermissions: Permission | Permission[]
  ): PermissionCheckResult {
    const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const userPermissions = this.getUserPermissions(user);
    
    const missingPermissions = required.filter(permission => 
      !userPermissions.includes(permission)
    );

    return {
      hasPermission: missingPermissions.length === 0,
      requiredPermissions: required,
      userPermissions,
      missingPermissions
    };
  }

  /**
   * Check if user has ANY of the required permissions
   */
  static checkAnyPermission(
    user: UserWithRoles, 
    requiredPermissions: Permission[]
  ): PermissionCheckResult {
    const userPermissions = this.getUserPermissions(user);
    
    const hasAnyPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    const missingPermissions = hasAnyPermission ? [] : requiredPermissions;

    return {
      hasPermission: hasAnyPermission,
      requiredPermissions,
      userPermissions,
      missingPermissions
    };
  }

  /**
   * Get all permissions for a user based on their Eureka role
   */
  static getUserPermissions(user: UserWithRoles): Permission[] {
    // If user has explicit permissions, use those
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    // Otherwise, derive from Eureka role
    if (user.eurekaRole) {
      return RoleManager.getPermissions(user.eurekaRole);
    }

    // Fallback to empty permissions
    return [];
  }

  /**
   * Suggest appropriate Eureka role based on current permissions or context
   */
  static suggestEurekaRole(
    currentPermissions: Permission[], 
    preferredPortal?: Portal
  ): EurekaRole[] {
    const suggestions: Array<{ role: EurekaRole; score: number }> = [];

    Object.entries(ROLE_CONFIGURATIONS).forEach(([role, config]) => {
      let score = 0;
      
      // Calculate permission overlap
      const rolePermissions = config.permissions;
      const commonPermissions = currentPermissions.filter(p => 
        rolePermissions.includes(p)
      );
      
      if (rolePermissions.length > 0) {
        score = commonPermissions.length / rolePermissions.length;
      }

      // Bonus for preferred portal
      if (preferredPortal && config.portal === preferredPortal) {
        score += 0.2;
      }

      suggestions.push({ role: role as EurekaRole, score });
    });

    // Sort by score and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.role);
  }

  /**
   * Check if a role transition is allowed
   */
  static canTransitionToRole(
    currentRole: EurekaRole, 
    targetRole: EurekaRole,
    isAdminAction = false
  ): { allowed: boolean; reason?: string } {
    // Super admin can do anything
    if (isAdminAction && currentRole === EurekaRole.SUPER_ADMIN) {
      return { allowed: true };
    }

    const currentConfig = ROLE_CONFIGURATIONS[currentRole];
    const targetConfig = ROLE_CONFIGURATIONS[targetRole];

    // Cannot transition to a different portal without admin action
    if (currentConfig.portal !== targetConfig.portal && !isAdminAction) {
      return { 
        allowed: false, 
        reason: `Cannot transition between portals (${currentConfig.portal} -> ${targetConfig.portal}) without admin approval` 
      };
    }

    // Cannot transition to super admin without being super admin
    if (targetRole === EurekaRole.SUPER_ADMIN && currentRole !== EurekaRole.SUPER_ADMIN && !isAdminAction) {
      return { 
        allowed: false, 
        reason: 'Cannot transition to Super Admin role' 
      };
    }

    // Check if current role can assign roles to others
    if (!isAdminAction && !RoleManager.hasPermission(currentRole, Permission.ASSIGN_ROLES)) {
      return { 
        allowed: false, 
        reason: 'Current role does not have permission to assign roles' 
      };
    }

    return { allowed: true };
  }

  /**
   * Generate role comparison report
   */
  static compareRoles(role1: EurekaRole, role2: EurekaRole): {
    role1Only: Permission[];
    role2Only: Permission[];
    common: Permission[];
    portals: { role1: Portal; role2: Portal };
  } {
    const permissions1 = RoleManager.getPermissions(role1);
    const permissions2 = RoleManager.getPermissions(role2);

    const common = permissions1.filter(p => permissions2.includes(p));
    const role1Only = permissions1.filter(p => !permissions2.includes(p));
    const role2Only = permissions2.filter(p => !permissions1.includes(p));

    return {
      role1Only,
      role2Only,
      common,
      portals: {
        role1: RoleManager.getPortal(role1),
        role2: RoleManager.getPortal(role2)
      }
    };
  }

  /**
   * Get users that need role migration
   */
  static identifyUsersNeedingMigration(users: UserWithRoles[]): {
    needsMigration: UserWithRoles[];
    hasErrors: UserWithRoles[];
    isValid: UserWithRoles[];
  } {
    const needsMigration: UserWithRoles[] = [];
    const hasErrors: UserWithRoles[] = [];
    const isValid: UserWithRoles[] = [];

    users.forEach(user => {
      if (!user.eurekaRole && user.role) {
        needsMigration.push(user);
      } else if (user.eurekaRole) {
        const validation = this.validateUserRole(user);
        if (validation.isValid) {
          isValid.push(user);
        } else {
          hasErrors.push(user);
        }
      } else {
        hasErrors.push(user);
      }
    });

    return { needsMigration, hasErrors, isValid };
  }

  /**
   * Generate role statistics report
   */
  static generateRoleStatsReport(users: UserWithRoles[]): {
    totalUsers: number;
    byPortal: Record<Portal, number>;
    byEurekaRole: Record<string, number>;
    byLegacyRole: Record<string, number>;
    migrationStatus: {
      migrated: number;
      pending: number;
      errors: number;
    };
  } {
    const stats = {
      totalUsers: users.length,
      byPortal: {} as Record<Portal, number>,
      byEurekaRole: {} as Record<string, number>,
      byLegacyRole: {} as Record<string, number>,
      migrationStatus: {
        migrated: 0,
        pending: 0,
        errors: 0
      }
    };

    // Initialize portal counts
    Object.values(Portal).forEach(portal => {
      stats.byPortal[portal] = 0;
    });

    users.forEach(user => {
      // Portal statistics
      if (user.portal) {
        stats.byPortal[user.portal]++;
      }

      // Eureka role statistics
      if (user.eurekaRole) {
        stats.byEurekaRole[user.eurekaRole] = (stats.byEurekaRole[user.eurekaRole] || 0) + 1;
        stats.migrationStatus.migrated++;
      } else if (user.role) {
        stats.migrationStatus.pending++;
      } else {
        stats.migrationStatus.errors++;
      }

      // Legacy role statistics
      if (user.role) {
        stats.byLegacyRole[user.role] = (stats.byLegacyRole[user.role] || 0) + 1;
      }
    });

    return stats;
  }
}
