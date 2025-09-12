"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleManager = exports.ROLE_CONFIGURATIONS = exports.Permission = exports.EurekaRole = exports.RoleCategory = exports.Portal = void 0;
var Portal;
(function (Portal) {
    Portal["BRAND"] = "brand";
    Portal["ADMIN"] = "admin";
    Portal["PUBLISHER"] = "publisher";
})(Portal || (exports.Portal = Portal = {}));
var RoleCategory;
(function (RoleCategory) {
    RoleCategory["SUPER_ADMIN"] = "super_admin";
    RoleCategory["MANAGEMENT"] = "management";
    RoleCategory["OPERATIONS"] = "operations";
    RoleCategory["FINANCE"] = "finance";
    RoleCategory["SUPPORT"] = "support";
    RoleCategory["END_USER"] = "end_user";
})(RoleCategory || (exports.RoleCategory = RoleCategory = {}));
var EurekaRole;
(function (EurekaRole) {
    EurekaRole["MARKETING_HEAD"] = "marketing_head";
    EurekaRole["CAMPAIGN_MANAGER"] = "campaign_manager";
    EurekaRole["ADMIN_BRAND"] = "admin_brand";
    EurekaRole["FINANCE_MANAGER"] = "finance_manager";
    EurekaRole["VALIDATOR_APPROVER"] = "validator_approver";
    EurekaRole["CAMPAIGN_CONSULTANT"] = "campaign_consultant";
    EurekaRole["SALES_REPRESENTATIVE"] = "sales_representative";
    EurekaRole["SUPPORT_2_BRAND"] = "support_2_brand";
    EurekaRole["SUPPORT_1_BRAND"] = "support_1_brand";
    EurekaRole["SUPER_ADMIN"] = "super_admin";
    EurekaRole["ADMIN_EXCHANGE"] = "admin_exchange";
    EurekaRole["PLATFORM_SUCCESS_MANAGER"] = "platform_success_manager";
    EurekaRole["CUSTOMER_SUCCESS_MANAGER"] = "customer_success_manager";
    EurekaRole["CAMPAIGN_SUCCESS_MANAGER"] = "campaign_success_manager";
    EurekaRole["SUPPORT_2_ADMIN"] = "support_2_admin";
    EurekaRole["SUPPORT_1_ADMIN"] = "support_1_admin";
    EurekaRole["INDEPENDENT_PUBLISHER"] = "independent_publisher";
    EurekaRole["ARTISTE_MANAGER"] = "artiste_manager";
    EurekaRole["STREAMER_INDIVIDUAL"] = "streamer_individual";
    EurekaRole["LIAISON_MANAGER"] = "liaison_manager";
    EurekaRole["SUPPORT_2_PUBLISHER"] = "support_2_publisher";
    EurekaRole["SUPPORT_1_PUBLISHER"] = "support_1_publisher";
    EurekaRole["STREAMER_LEGACY"] = "streamer";
    EurekaRole["BRAND_LEGACY"] = "brand";
    EurekaRole["ADMIN_LEGACY"] = "admin";
})(EurekaRole || (exports.EurekaRole = EurekaRole = {}));
var Permission;
(function (Permission) {
    Permission["CREATE_USER"] = "create_user";
    Permission["READ_USER"] = "read_user";
    Permission["UPDATE_USER"] = "update_user";
    Permission["DELETE_USER"] = "delete_user";
    Permission["ASSIGN_ROLES"] = "assign_roles";
    Permission["SUSPEND_USER"] = "suspend_user";
    Permission["CREATE_CAMPAIGN"] = "create_campaign";
    Permission["READ_CAMPAIGN"] = "read_campaign";
    Permission["UPDATE_CAMPAIGN"] = "update_campaign";
    Permission["DELETE_CAMPAIGN"] = "delete_campaign";
    Permission["APPROVE_CAMPAIGN"] = "approve_campaign";
    Permission["REJECT_CAMPAIGN"] = "reject_campaign";
    Permission["PAUSE_CAMPAIGN"] = "pause_campaign";
    Permission["OVERRIDE_CAMPAIGN"] = "override_campaign";
    Permission["VIEW_BILLING"] = "view_billing";
    Permission["MANAGE_BUDGET"] = "manage_budget";
    Permission["UPLOAD_FUNDS"] = "upload_funds";
    Permission["PROCESS_PAYOUTS"] = "process_payouts";
    Permission["VIEW_SPEND_HISTORY"] = "view_spend_history";
    Permission["MANAGE_PAYMENT_METHODS"] = "manage_payment_methods";
    Permission["VIEW_ANALYTICS"] = "view_analytics";
    Permission["VIEW_DETAILED_ANALYTICS"] = "view_detailed_analytics";
    Permission["EXPORT_REPORTS"] = "export_reports";
    Permission["VIEW_PERFORMANCE_METRICS"] = "view_performance_metrics";
    Permission["ACCESS_CRM"] = "access_crm";
    Permission["EDIT_CRM"] = "edit_crm";
    Permission["RESOLVE_TICKETS"] = "resolve_tickets";
    Permission["ESCALATE_TICKETS"] = "escalate_tickets";
    Permission["VIEW_SUPPORT_HISTORY"] = "view_support_history";
    Permission["MODIFY_PRICING_LOGIC"] = "modify_pricing_logic";
    Permission["CONFIGURE_PLATFORM"] = "configure_platform";
    Permission["OVERRIDE_SYSTEM"] = "override_system";
    Permission["VIEW_SYSTEM_LOGS"] = "view_system_logs";
    Permission["CREATE_ORGANIZATION"] = "create_organization";
    Permission["MANAGE_ORGANIZATION"] = "manage_organization";
    Permission["ASSIGN_BUDGET_LIMITS"] = "assign_budget_limits";
    Permission["FORM_TEAMS"] = "form_teams";
    Permission["BID_ON_CAMPAIGNS"] = "bid_on_campaigns";
    Permission["CONNECT_PLATFORMS"] = "connect_platforms";
    Permission["UPLOAD_CONTENT"] = "upload_content";
    Permission["MANAGE_PUBLISHERS"] = "manage_publishers";
    Permission["COORDINATE_ONBOARDING"] = "coordinate_onboarding";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_CONFIGURATIONS = {
    [EurekaRole.MARKETING_HEAD]: {
        portal: Portal.BRAND,
        category: RoleCategory.MANAGEMENT,
        description: 'Creates advertiser organization, assigns user roles and budget limits, forms campaign teams',
        permissions: [
            Permission.CREATE_ORGANIZATION,
            Permission.MANAGE_ORGANIZATION,
            Permission.ASSIGN_ROLES,
            Permission.ASSIGN_BUDGET_LIMITS,
            Permission.FORM_TEAMS,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_DETAILED_ANALYTICS,
            Permission.MANAGE_BUDGET,
            Permission.CREATE_CAMPAIGN,
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.DELETE_CAMPAIGN
        ],
        canDelete: true,
        canSuspend: true
    },
    [EurekaRole.CAMPAIGN_MANAGER]: {
        portal: Portal.BRAND,
        category: RoleCategory.OPERATIONS,
        description: 'Creates and manages campaigns, selects targeting, creatives, and bidding strategy',
        permissions: [
            Permission.CREATE_CAMPAIGN,
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_PERFORMANCE_METRICS
        ]
    },
    [EurekaRole.ADMIN_BRAND]: {
        portal: Portal.BRAND,
        category: RoleCategory.MANAGEMENT,
        description: 'Manages advertiser accounts, assigns sales representatives, supports campaign troubleshooting',
        permissions: [
            Permission.READ_USER,
            Permission.UPDATE_USER,
            Permission.ASSIGN_ROLES,
            Permission.ACCESS_CRM,
            Permission.EDIT_CRM,
            Permission.READ_CAMPAIGN,
            Permission.PAUSE_CAMPAIGN,
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS
        ],
        canSuspend: true
    },
    [EurekaRole.FINANCE_MANAGER]: {
        portal: Portal.BRAND,
        category: RoleCategory.FINANCE,
        description: 'Uploads funds, budget management, manages payment methods, views spend history and billing',
        permissions: [
            Permission.UPLOAD_FUNDS,
            Permission.MANAGE_BUDGET,
            Permission.MANAGE_PAYMENT_METHODS,
            Permission.VIEW_SPEND_HISTORY,
            Permission.VIEW_BILLING,
            Permission.PROCESS_PAYOUTS
        ]
    },
    [EurekaRole.VALIDATOR_APPROVER]: {
        portal: Portal.BRAND,
        category: RoleCategory.OPERATIONS,
        description: 'Reviews campaigns before approval, verifies budget, creatives, and targeting',
        permissions: [
            Permission.READ_CAMPAIGN,
            Permission.APPROVE_CAMPAIGN,
            Permission.REJECT_CAMPAIGN,
            Permission.VIEW_ANALYTICS
        ]
    },
    [EurekaRole.CAMPAIGN_CONSULTANT]: {
        portal: Portal.BRAND,
        category: RoleCategory.OPERATIONS,
        description: 'Manages advertiser logistics of campaign setup, execution and analytics on behalf of the advertiser',
        permissions: [
            Permission.CREATE_CAMPAIGN,
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_PERFORMANCE_METRICS
        ],
        requiresAgreement: true
    },
    [EurekaRole.SALES_REPRESENTATIVE]: {
        portal: Portal.BRAND,
        category: RoleCategory.SUPPORT,
        description: 'Assists advertiser onboarding, explains product and campaign setup, guides advertisers',
        permissions: [
            Permission.ACCESS_CRM,
            Permission.EDIT_CRM,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER,
            Permission.RESOLVE_TICKETS
        ]
    },
    [EurekaRole.SUPPORT_2_BRAND]: {
        portal: Portal.BRAND,
        category: RoleCategory.SUPPORT,
        description: 'Investigates complex advertiser-side issues, coordinates with teams for resolution',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_SUPPORT_HISTORY,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER,
            Permission.VIEW_ANALYTICS
        ]
    },
    [EurekaRole.SUPPORT_1_BRAND]: {
        portal: Portal.BRAND,
        category: RoleCategory.SUPPORT,
        description: 'Resolves basic advertiser queries related to campaign creation, login issues, navigation help',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER
        ]
    },
    [EurekaRole.SUPER_ADMIN]: {
        portal: Portal.ADMIN,
        category: RoleCategory.SUPER_ADMIN,
        description: 'Full system control including unrestricted read/write/delete permissions on all entities',
        permissions: Object.values(Permission),
        canDelete: true,
        canSuspend: true
    },
    [EurekaRole.ADMIN_EXCHANGE]: {
        portal: Portal.ADMIN,
        category: RoleCategory.MANAGEMENT,
        description: 'Manages internal workflows of operators and success managers, handles escalations',
        permissions: [
            Permission.READ_USER,
            Permission.UPDATE_USER,
            Permission.ASSIGN_ROLES,
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_SYSTEM_LOGS
        ],
        canSuspend: true
    },
    [EurekaRole.PLATFORM_SUCCESS_MANAGER]: {
        portal: Portal.ADMIN,
        category: RoleCategory.OPERATIONS,
        description: 'Ensures system uptime and operational continuity, can modify SSP pricing logic, payout distribution',
        permissions: [
            Permission.MODIFY_PRICING_LOGIC,
            Permission.CONFIGURE_PLATFORM,
            Permission.VIEW_SYSTEM_LOGS,
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_DETAILED_ANALYTICS,
            Permission.PROCESS_PAYOUTS
        ]
    },
    [EurekaRole.CUSTOMER_SUCCESS_MANAGER]: {
        portal: Portal.ADMIN,
        category: RoleCategory.OPERATIONS,
        description: 'Ensures advertiser satisfaction through ticket resolution and optimization feedback',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_SUPPORT_HISTORY,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_DETAILED_ANALYTICS,
            Permission.ACCESS_CRM,
            Permission.EDIT_CRM
        ]
    },
    [EurekaRole.CAMPAIGN_SUCCESS_MANAGER]: {
        portal: Portal.ADMIN,
        category: RoleCategory.OPERATIONS,
        description: 'Oversees campaign flow from DSP to SSP, tracks live campaign status and ensures inventory matching',
        permissions: [
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.OVERRIDE_CAMPAIGN,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_DETAILED_ANALYTICS,
            Permission.EXPORT_REPORTS
        ]
    },
    [EurekaRole.SUPPORT_2_ADMIN]: {
        portal: Portal.ADMIN,
        category: RoleCategory.SUPPORT,
        description: 'Handle tech failures (uploads, APIs), collaborate with devs for bug reports',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_SYSTEM_LOGS,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER
        ]
    },
    [EurekaRole.SUPPORT_1_ADMIN]: {
        portal: Portal.ADMIN,
        category: RoleCategory.SUPPORT,
        description: 'Resolve common internal queries, help with navigation issues, FAQs',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER
        ]
    },
    [EurekaRole.INDEPENDENT_PUBLISHER]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.END_USER,
        description: 'Independent publisher not under any org/agency, manages their own campaigns and payouts directly',
        permissions: [
            Permission.BID_ON_CAMPAIGNS,
            Permission.CONNECT_PLATFORMS,
            Permission.UPLOAD_CONTENT,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_BILLING,
            Permission.READ_CAMPAIGN
        ]
    },
    [EurekaRole.ARTISTE_MANAGER]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.MANAGEMENT,
        description: 'Recruits and manages publishers (streamers, content creators), monitors campaign performance',
        permissions: [
            Permission.MANAGE_PUBLISHERS,
            Permission.COORDINATE_ONBOARDING,
            Permission.READ_CAMPAIGN,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_PERFORMANCE_METRICS,
            Permission.ASSIGN_ROLES
        ]
    },
    [EurekaRole.STREAMER_INDIVIDUAL]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.END_USER,
        description: 'Bids and runs campaigns, connects platform accounts, uploads content and submits analytics',
        permissions: [
            Permission.BID_ON_CAMPAIGNS,
            Permission.CONNECT_PLATFORMS,
            Permission.UPLOAD_CONTENT,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_BILLING,
            Permission.READ_CAMPAIGN
        ]
    },
    [EurekaRole.LIAISON_MANAGER]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.OPERATIONS,
        description: 'Supports artiste managers in publisher onboarding, assists with dispute resolution',
        permissions: [
            Permission.COORDINATE_ONBOARDING,
            Permission.RESOLVE_TICKETS,
            Permission.VIEW_PERFORMANCE_METRICS,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER
        ]
    },
    [EurekaRole.SUPPORT_2_PUBLISHER]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.SUPPORT,
        description: 'Investigates complex issues by coordinating with finance and technical teams',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_SUPPORT_HISTORY,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER,
            Permission.VIEW_BILLING
        ]
    },
    [EurekaRole.SUPPORT_1_PUBLISHER]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.SUPPORT,
        description: 'Resolves tickets raised by publishers for basic queries related to campaign participation',
        permissions: [
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.READ_CAMPAIGN,
            Permission.READ_USER
        ]
    },
    [EurekaRole.STREAMER_LEGACY]: {
        portal: Portal.PUBLISHER,
        category: RoleCategory.END_USER,
        description: 'Legacy streamer role - maps to Streamer Individual',
        permissions: [
            Permission.BID_ON_CAMPAIGNS,
            Permission.CONNECT_PLATFORMS,
            Permission.UPLOAD_CONTENT,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_BILLING,
            Permission.READ_CAMPAIGN
        ]
    },
    [EurekaRole.BRAND_LEGACY]: {
        portal: Portal.BRAND,
        category: RoleCategory.OPERATIONS,
        description: 'Legacy brand role - maps to Campaign Manager',
        permissions: [
            Permission.CREATE_CAMPAIGN,
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_PERFORMANCE_METRICS
        ]
    },
    [EurekaRole.ADMIN_LEGACY]: {
        portal: Portal.ADMIN,
        category: RoleCategory.MANAGEMENT,
        description: 'Legacy admin role - maps to Admin Exchange',
        permissions: [
            Permission.READ_USER,
            Permission.UPDATE_USER,
            Permission.ASSIGN_ROLES,
            Permission.READ_CAMPAIGN,
            Permission.UPDATE_CAMPAIGN,
            Permission.RESOLVE_TICKETS,
            Permission.ESCALATE_TICKETS,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_SYSTEM_LOGS
        ],
        canSuspend: true
    }
};
class RoleManager {
    static getPortal(role) {
        return exports.ROLE_CONFIGURATIONS[role]?.portal || Portal.PUBLISHER;
    }
    static getPermissions(role) {
        return exports.ROLE_CONFIGURATIONS[role]?.permissions || [];
    }
    static hasPermission(role, permission) {
        const permissions = this.getPermissions(role);
        return permissions.includes(permission);
    }
    static canDelete(role) {
        return exports.ROLE_CONFIGURATIONS[role]?.canDelete || false;
    }
    static canSuspend(role) {
        return exports.ROLE_CONFIGURATIONS[role]?.canSuspend || false;
    }
    static getRolesByPortal(portal) {
        return Object.entries(exports.ROLE_CONFIGURATIONS)
            .filter(([, config]) => config.portal === portal)
            .map(([role]) => role);
    }
    static getRolesByCategory(category) {
        return Object.entries(exports.ROLE_CONFIGURATIONS)
            .filter(([, config]) => config.category === category)
            .map(([role]) => role);
    }
    static shouldRenderBrandComponents(role) {
        return this.getPortal(role) === Portal.BRAND;
    }
    static shouldRenderAdminComponents(role) {
        return this.getPortal(role) === Portal.ADMIN;
    }
    static shouldRenderPublisherComponents(role) {
        return this.getPortal(role) === Portal.PUBLISHER;
    }
    static mapLegacyRole(legacyRole) {
        switch (legacyRole.toLowerCase()) {
            case 'streamer':
                return EurekaRole.STREAMER_INDIVIDUAL;
            case 'brand':
                return EurekaRole.CAMPAIGN_MANAGER;
            case 'admin':
                return EurekaRole.ADMIN_EXCHANGE;
            default:
                return EurekaRole.STREAMER_INDIVIDUAL;
        }
    }
    static getEscalationTarget(role) {
        switch (role) {
            case EurekaRole.SUPPORT_1_BRAND:
                return [EurekaRole.SUPPORT_2_BRAND, EurekaRole.ADMIN_BRAND];
            case EurekaRole.SUPPORT_2_BRAND:
                return [EurekaRole.CUSTOMER_SUCCESS_MANAGER, EurekaRole.PLATFORM_SUCCESS_MANAGER];
            case EurekaRole.SUPPORT_1_ADMIN:
                return [EurekaRole.SUPPORT_2_ADMIN, EurekaRole.ADMIN_EXCHANGE];
            case EurekaRole.SUPPORT_2_ADMIN:
                return [EurekaRole.PLATFORM_SUCCESS_MANAGER];
            case EurekaRole.SUPPORT_1_PUBLISHER:
                return [EurekaRole.SUPPORT_2_PUBLISHER, EurekaRole.LIAISON_MANAGER];
            case EurekaRole.SUPPORT_2_PUBLISHER:
                return [EurekaRole.PLATFORM_SUCCESS_MANAGER];
            default:
                return [EurekaRole.SUPER_ADMIN];
        }
    }
}
exports.RoleManager = RoleManager;
//# sourceMappingURL=eureka-roles.js.map