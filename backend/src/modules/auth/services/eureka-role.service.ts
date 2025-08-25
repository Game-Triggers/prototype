import { Injectable } from '@nestjs/common';
import {
  EurekaRole,
  Permission,
  RoleManager,
  Portal,
  RoleCategory,
  ROLE_CONFIGURATIONS,
} from '../../../../../lib/eureka-roles';
import { UserRole } from '../../../../../lib/schema-types';

/**
 * Enhanced Role Management Service
 * 
 * Provides comprehensive role management functionality including:
 * - Role validation and mapping
 * - Permission checking
 * - Portal access management
 * - Role hierarchy management
 * - Migration utilities for existing roles
 */
@Injectable()
export class EurekaRoleService {
  /**
   * Check if a user has a specific permission
   * @param userRole - User's role
   * @param permission - Permission to check
   * @returns boolean indicating if user has permission
   */
  hasPermission(userRole: string, permission: Permission): boolean {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return RoleManager.hasPermission(eurekaRole, permission);
  }

  /**
   * Check if a user has any of the specified permissions
   * @param userRole - User's role
   * @param permissions - Array of permissions to check
   * @returns boolean indicating if user has at least one permission
   */
  hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
    const eurekaRole = this.mapToEurekaRole(userRole);
    const userPermissions = RoleManager.getPermissions(eurekaRole);
    return permissions.some((permission) => userPermissions.includes(permission));
  }

  /**
   * Check if a user has all specified permissions
   * @param userRole - User's role
   * @param permissions - Array of permissions to check
   * @returns boolean indicating if user has all permissions
   */
  hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return permissions.every((permission) =>
      RoleManager.hasPermission(eurekaRole, permission),
    );
  }

  /**
   * Get the portal for a user's role
   * @param userRole - User's role
   * @returns Portal enum value
   */
  getUserPortal(userRole: string): Portal {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return RoleManager.getPortal(eurekaRole);
  }

  /**
   * Get all permissions for a user's role
   * @param userRole - User's role
   * @returns Array of permissions
   */
  getUserPermissions(userRole: string): Permission[] {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return RoleManager.getPermissions(eurekaRole);
  }

  /**
   * Check if a user can delete entities
   * @param userRole - User's role
   * @returns boolean indicating delete capability
   */
  canDelete(userRole: string): boolean {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return RoleManager.canDelete(eurekaRole);
  }

  /**
   * Check if a user can suspend other users
   * @param userRole - User's role
   * @returns boolean indicating suspend capability
   */
  canSuspend(userRole: string): boolean {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return RoleManager.canSuspend(eurekaRole);
  }

  /**
   * Get roles available for a specific portal
   * @param portal - Portal to filter by
   * @returns Array of roles for the portal
   */
  getRolesByPortal(portal: Portal): EurekaRole[] {
    return RoleManager.getRolesByPortal(portal);
  }

  /**
   * Get roles by category
   * @param category - Role category to filter by
   * @returns Array of roles in the category
   */
  getRolesByCategory(category: RoleCategory): EurekaRole[] {
    return RoleManager.getRolesByCategory(category);
  }

  /**
   * Check which UI components to render based on user role
   * @param userRole - User's role
   * @returns Object indicating which portal components to show
   */
  getUIComponentFlags(userRole: string): {
    showBrandComponents: boolean;
    showAdminComponents: boolean;
    showPublisherComponents: boolean;
    portal: Portal;
  } {
    const eurekaRole = this.mapToEurekaRole(userRole);
    const portal = RoleManager.getPortal(eurekaRole);

    return {
      showBrandComponents: portal === Portal.BRAND,
      showAdminComponents: portal === Portal.ADMIN,
      showPublisherComponents: portal === Portal.PUBLISHER,
      portal,
    };
  }

  /**
   * Get escalation target roles for support roles
   * @param userRole - User's support role
   * @returns Array of roles that can handle escalated issues
   */
  getEscalationTargets(userRole: string): EurekaRole[] {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return RoleManager.getEscalationTarget(eurekaRole);
  }

  /**
   * Validate if a role change is allowed
   * @param currentRole - User's current role
   * @param targetRole - Desired role
   * @param assignerRole - Role of the person making the change
   * @returns Object with validation result and reason
   */
  validateRoleChange(
    currentRole: string,
    targetRole: string,
    assignerRole: string,
  ): { isValid: boolean; reason?: string } {
    const currentEurekaRole = this.mapToEurekaRole(currentRole);
    const targetEurekaRole = this.mapToEurekaRole(targetRole);
    const assignerEurekaRole = this.mapToEurekaRole(assignerRole);

    // Super admin can assign any role
    if (assignerEurekaRole === EurekaRole.SUPER_ADMIN) {
      return { isValid: true };
    }

    // Check if assigner has permission to assign roles
    if (!this.hasPermission(assignerRole, Permission.ASSIGN_ROLES)) {
      return {
        isValid: false,
        reason: 'Insufficient permissions to assign roles',
      };
    }

    // Prevent users from assigning roles higher than their own
    const assignerConfig = ROLE_CONFIGURATIONS[assignerEurekaRole];
    const targetConfig = ROLE_CONFIGURATIONS[targetEurekaRole];

    if (
      assignerConfig.category === RoleCategory.SUPPORT &&
      targetConfig.category === RoleCategory.MANAGEMENT
    ) {
      return {
        isValid: false,
        reason: 'Cannot assign management roles',
      };
    }

    if (
      assignerConfig.category !== RoleCategory.SUPER_ADMIN &&
      targetConfig.category === RoleCategory.SUPER_ADMIN
    ) {
      return {
        isValid: false,
        reason: 'Cannot assign super admin role',
      };
    }

    return { isValid: true };
  }

  /**
   * Get role hierarchy level (higher number = more privileged)
   * @param userRole - User's role
   * @returns Numerical hierarchy level
   */
  getRoleHierarchyLevel(userRole: string): number {
    const eurekaRole = this.mapToEurekaRole(userRole);
    const config = ROLE_CONFIGURATIONS[eurekaRole];

    switch (config.category) {
      case RoleCategory.SUPER_ADMIN:
        return 100;
      case RoleCategory.MANAGEMENT:
        return 80;
      case RoleCategory.OPERATIONS:
        return 60;
      case RoleCategory.FINANCE:
        return 50;
      case RoleCategory.SUPPORT:
        return userRole.includes('support_2') ? 30 : 20;
      case RoleCategory.END_USER:
        return 10;
      default:
        return 0;
    }
  }

  /**
   * Map legacy or unknown roles to Eureka role system
   * @param role - Role string to map
   * @returns Mapped Eureka role
   */
  mapToEurekaRole(role: string): EurekaRole {
    // If it's already a valid Eureka role, return as-is
    if (Object.values(EurekaRole).includes(role as EurekaRole)) {
      return role as EurekaRole;
    }

    // Map legacy UserRole enum values
    switch (role as UserRole) {
      case UserRole.STREAMER:
        return EurekaRole.STREAMER_INDIVIDUAL;
      case UserRole.BRAND:
        return EurekaRole.CAMPAIGN_MANAGER;
      case UserRole.ADMIN:
        return EurekaRole.ADMIN_EXCHANGE;
      default:
        // Use RoleManager for additional legacy mapping
        return RoleManager.mapLegacyRole(role);
    }
  }

  /**
   * Get role configuration
   * @param userRole - User's role
   * @returns Role configuration object
   */
  getRoleConfiguration(userRole: string) {
    const eurekaRole = this.mapToEurekaRole(userRole);
    return ROLE_CONFIGURATIONS[eurekaRole];
  }

  /**
   * Check if role requires agreement/contract
   * @param userRole - User's role
   * @returns boolean indicating if agreement is required
   */
  requiresAgreement(userRole: string): boolean {
    const eurekaRole = this.mapToEurekaRole(userRole);
    const config = ROLE_CONFIGURATIONS[eurekaRole];
    return config.requiresAgreement || false;
  }

  /**
   * Get all available roles for role assignment UI
   * @param assignerRole - Role of person doing the assignment
   * @returns Array of assignable roles with descriptions
   */
  getAssignableRoles(assignerRole: string): Array<{
    role: EurekaRole;
    name: string;
    description: string;
    portal: Portal;
    category: RoleCategory;
  }> {
    const assignerEurekaRole = this.mapToEurekaRole(assignerRole);
    const assignerLevel = this.getRoleHierarchyLevel(assignerRole);

    return Object.entries(ROLE_CONFIGURATIONS)
      .filter(([role, config]) => {
        // Super admin can assign any role
        if (assignerEurekaRole === EurekaRole.SUPER_ADMIN) {
          return true;
        }

        // Users can only assign roles at or below their level
        const targetLevel = this.getRoleHierarchyLevel(role);
        return targetLevel <= assignerLevel;
      })
      .map(([role, config]) => ({
        role: role as EurekaRole,
        name: role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: config.description,
        portal: config.portal,
        category: config.category,
      }));
  }

  /**
   * Migrate existing users' roles to new Eureka system
   * This is a utility method for database migration
   * @param oldRole - Legacy role
   * @returns New Eureka role
   */
  migrateRole(oldRole: string): EurekaRole {
    return this.mapToEurekaRole(oldRole);
  }

  /**
   * Get role statistics for admin dashboard
   * @returns Object with role distribution stats
   */
  getRoleStatistics(): {
    totalRoles: number;
    rolesByPortal: Record<Portal, number>;
    rolesByCategory: Record<RoleCategory, number>;
  } {
    const roles = Object.values(EurekaRole);
    const rolesByPortal: Record<Portal, number> = {
      [Portal.BRAND]: 0,
      [Portal.ADMIN]: 0,
      [Portal.PUBLISHER]: 0,
    };
    const rolesByCategory: Record<RoleCategory, number> = {
      [RoleCategory.SUPER_ADMIN]: 0,
      [RoleCategory.MANAGEMENT]: 0,
      [RoleCategory.OPERATIONS]: 0,
      [RoleCategory.FINANCE]: 0,
      [RoleCategory.SUPPORT]: 0,
      [RoleCategory.END_USER]: 0,
    };

    roles.forEach((role) => {
      const config = ROLE_CONFIGURATIONS[role];
      rolesByPortal[config.portal]++;
      rolesByCategory[config.category]++;
    });

    return {
      totalRoles: roles.length,
      rolesByPortal,
      rolesByCategory,
    };
  }
}
