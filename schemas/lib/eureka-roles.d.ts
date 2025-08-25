/**
 * Eureka Role-Based Account System
 *
 * This system implements a comprehensive role hierarchy across three portals:
 * - E1: Brand Portal (advertiser roles)
 * - E2: Admin Portal (internal/exchange roles)
 * - E3: Publisher Portal (streamer/publisher roles)
 */
export declare enum Portal {
    BRAND = "brand",// E1 - Brand side portal
    ADMIN = "admin",// E2 - Admin side portal  
    PUBLISHER = "publisher"
}
export declare enum RoleCategory {
    SUPER_ADMIN = "super_admin",
    MANAGEMENT = "management",
    OPERATIONS = "operations",
    FINANCE = "finance",
    SUPPORT = "support",
    END_USER = "end_user"
}
export declare enum EurekaRole {
    MARKETING_HEAD = "marketing_head",
    CAMPAIGN_MANAGER = "campaign_manager",
    ADMIN_BRAND = "admin_brand",
    FINANCE_MANAGER = "finance_manager",
    VALIDATOR_APPROVER = "validator_approver",
    CAMPAIGN_CONSULTANT = "campaign_consultant",
    SALES_REPRESENTATIVE = "sales_representative",
    SUPPORT_2_BRAND = "support_2_brand",
    SUPPORT_1_BRAND = "support_1_brand",
    SUPER_ADMIN = "super_admin",
    ADMIN_EXCHANGE = "admin_exchange",
    PLATFORM_SUCCESS_MANAGER = "platform_success_manager",
    CUSTOMER_SUCCESS_MANAGER = "customer_success_manager",
    CAMPAIGN_SUCCESS_MANAGER = "campaign_success_manager",
    SUPPORT_2_ADMIN = "support_2_admin",
    SUPPORT_1_ADMIN = "support_1_admin",
    INDEPENDENT_PUBLISHER = "independent_publisher",
    ARTISTE_MANAGER = "artiste_manager",
    STREAMER_INDIVIDUAL = "streamer_individual",
    LIAISON_MANAGER = "liaison_manager",
    SUPPORT_2_PUBLISHER = "support_2_publisher",
    SUPPORT_1_PUBLISHER = "support_1_publisher",
    STREAMER_LEGACY = "streamer",
    BRAND_LEGACY = "brand",
    ADMIN_LEGACY = "admin"
}
export declare enum Permission {
    CREATE_USER = "create_user",
    READ_USER = "read_user",
    UPDATE_USER = "update_user",
    DELETE_USER = "delete_user",
    ASSIGN_ROLES = "assign_roles",
    SUSPEND_USER = "suspend_user",
    CREATE_CAMPAIGN = "create_campaign",
    READ_CAMPAIGN = "read_campaign",
    UPDATE_CAMPAIGN = "update_campaign",
    DELETE_CAMPAIGN = "delete_campaign",
    APPROVE_CAMPAIGN = "approve_campaign",
    REJECT_CAMPAIGN = "reject_campaign",
    PAUSE_CAMPAIGN = "pause_campaign",
    OVERRIDE_CAMPAIGN = "override_campaign",
    VIEW_BILLING = "view_billing",
    MANAGE_BUDGET = "manage_budget",
    UPLOAD_FUNDS = "upload_funds",
    PROCESS_PAYOUTS = "process_payouts",
    VIEW_SPEND_HISTORY = "view_spend_history",
    MANAGE_PAYMENT_METHODS = "manage_payment_methods",
    VIEW_ANALYTICS = "view_analytics",
    VIEW_DETAILED_ANALYTICS = "view_detailed_analytics",
    EXPORT_REPORTS = "export_reports",
    VIEW_PERFORMANCE_METRICS = "view_performance_metrics",
    ACCESS_CRM = "access_crm",
    EDIT_CRM = "edit_crm",
    RESOLVE_TICKETS = "resolve_tickets",
    ESCALATE_TICKETS = "escalate_tickets",
    VIEW_SUPPORT_HISTORY = "view_support_history",
    MODIFY_PRICING_LOGIC = "modify_pricing_logic",
    CONFIGURE_PLATFORM = "configure_platform",
    OVERRIDE_SYSTEM = "override_system",
    VIEW_SYSTEM_LOGS = "view_system_logs",
    CREATE_ORGANIZATION = "create_organization",
    MANAGE_ORGANIZATION = "manage_organization",
    ASSIGN_BUDGET_LIMITS = "assign_budget_limits",
    FORM_TEAMS = "form_teams",
    BID_ON_CAMPAIGNS = "bid_on_campaigns",
    CONNECT_PLATFORMS = "connect_platforms",
    UPLOAD_CONTENT = "upload_content",
    MANAGE_PUBLISHERS = "manage_publishers",
    COORDINATE_ONBOARDING = "coordinate_onboarding"
}
export interface RoleConfig {
    portal: Portal;
    category: RoleCategory;
    permissions: Permission[];
    description: string;
    canDelete?: boolean;
    canSuspend?: boolean;
    requiresAgreement?: boolean;
}
export declare const ROLE_CONFIGURATIONS: Record<EurekaRole, RoleConfig>;
/**
 * Utility functions for role management
 */
export declare class RoleManager {
    /**
     * Get portal for a specific role
     */
    static getPortal(role: EurekaRole): Portal;
    /**
     * Get all permissions for a specific role
     */
    static getPermissions(role: EurekaRole): Permission[];
    /**
     * Check if a role has a specific permission
     */
    static hasPermission(role: EurekaRole, permission: Permission): boolean;
    /**
     * Check if a role can delete entities
     */
    static canDelete(role: EurekaRole): boolean;
    /**
     * Check if a role can suspend users
     */
    static canSuspend(role: EurekaRole): boolean;
    /**
     * Get roles by portal
     */
    static getRolesByPortal(portal: Portal): EurekaRole[];
    /**
     * Get roles by category
     */
    static getRolesByCategory(category: RoleCategory): EurekaRole[];
    /**
     * Check if user should see brand components
     */
    static shouldRenderBrandComponents(role: EurekaRole): boolean;
    /**
     * Check if user should see admin components
     */
    static shouldRenderAdminComponents(role: EurekaRole): boolean;
    /**
     * Check if user should see publisher/streamer components
     */
    static shouldRenderPublisherComponents(role: EurekaRole): boolean;
    /**
     * Map legacy roles to new Eureka roles
     */
    static mapLegacyRole(legacyRole: string): EurekaRole;
    /**
     * Get escalation path for support roles
     */
    static getEscalationTarget(role: EurekaRole): EurekaRole[];
}
//# sourceMappingURL=eureka-roles.d.ts.map