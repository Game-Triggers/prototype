export declare enum Portal {
    BRAND = "brand",
    ADMIN = "admin",
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
export declare class RoleManager {
    static getPortal(role: EurekaRole): Portal;
    static getPermissions(role: EurekaRole): Permission[];
    static hasPermission(role: EurekaRole, permission: Permission): boolean;
    static canDelete(role: EurekaRole): boolean;
    static canSuspend(role: EurekaRole): boolean;
    static getRolesByPortal(portal: Portal): EurekaRole[];
    static getRolesByCategory(category: RoleCategory): EurekaRole[];
    static shouldRenderBrandComponents(role: EurekaRole): boolean;
    static shouldRenderAdminComponents(role: EurekaRole): boolean;
    static shouldRenderPublisherComponents(role: EurekaRole): boolean;
    static mapLegacyRole(legacyRole: string): EurekaRole;
    static getEscalationTarget(role: EurekaRole): EurekaRole[];
}
