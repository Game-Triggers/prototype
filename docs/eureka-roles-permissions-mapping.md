# Eureka Roles & Permissions Mapping

## Role Hierarchy & Portal Distribution

### Portal Assignment
- **E1 (Brand Portal)**: 8 roles - Brand-side operations and campaign management
- **E2 (Admin Portal)**: 7 roles - Platform administration and oversight  
- **E3 (Streamer Portal)**: 8 roles - Streamer/publisher operations and management

### Super Admin Cross-Portal Access
The **Super Admin** role exists across all three portals with unrestricted access to all functionalities.

## E1 - Brand Portal Roles

### 1. Marketing Head
**Hierarchy Level**: 1 (Highest)
**Portal**: E1
**Reports To**: None (Top level)

**Responsibilities**:
- Creates advertiser organization
- Assigns user roles and budget limits
- Forms campaign teams
- Reviews analytics and budget allocation
- Sets up high-value spend

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canView: true
  },
  users: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canAssignRoles: true,
    canViewProfiles: true
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: true,
    canApprovePayouts: true,
    canViewTransactions: true,
    canManageWallets: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: true,
    canConfigureDashboards: true
  },
  system: {
    canConfigureSystem: false,
    canAccessAuditLogs: true,
    canManageIntegrations: false,
    canOverridePermissions: false
  }
}
```

### 2. Campaign Manager
**Hierarchy Level**: 2
**Portal**: E1
**Reports To**: Marketing Head

**Responsibilities**:
- Creates and manages campaigns
- Selects targeting, creatives, and bidding strategy
- Collaborates with team
- Analyzes performance metrics

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  users: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignRoles: false,
    canViewProfiles: true
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: true,
    canManageWallets: false
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  }
}
```

### 3. Finance Manager
**Hierarchy Level**: 2
**Portal**: E1
**Reports To**: Marketing Head

**Responsibilities**:
- Uploads funds
- Budget management
- Manages payment methods
- Views spend history and billing
- Cannot create campaigns

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: true,
    canApprovePayouts: true,
    canViewTransactions: true,
    canManageWallets: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: true,
    canConfigureDashboards: false
  }
}
```

### 4. Validator/Approver
**Hierarchy Level**: 2
**Portal**: E1
**Reports To**: Marketing Head

**Responsibilities**:
- Reviews campaigns before approval
- Verifies budget, creatives, and targeting
- Sends approved campaigns to Ad Exchange layer (E2)

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canApprove: true,
    canView: true
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: true,
    canManageWallets: false
  },
  analytics: {
    canViewReports: true,
    canExportData: false,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  }
}
```

### 5. Campaign Consultant
**Hierarchy Level**: 3
**Portal**: E1
**Reports To**: Marketing Head or Campaign Manager

**Responsibilities**:
- Manages advertiser logistics on agreement basis
- Campaign setup, execution, and analytics on behalf of advertiser
- Requires legal terms and advertiser approval
- Can run campaigns but cannot oversee finance

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: false,
    canManageWallets: false
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  }
}
```

### 6. Sales Representative
**Hierarchy Level**: 4
**Portal**: E1
**Reports To**: Marketing Head

**Responsibilities**:
- Assists advertiser onboarding
- Explains product and campaign setup
- Guides advertisers during campaign launch or issue resolution
- Has access to CRM and edits CRM

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  users: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignRoles: false,
    canViewProfiles: true
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: true,
    canProvideTechnicalSupport: false
  }
}
```

### 7. Support 2
**Hierarchy Level**: 4
**Portal**: E1
**Reports To**: Admin or Marketing Head

**Responsibilities**:
- Investigates complex advertiser-side issues
- Coordinates with finance, validator, consultant, and tech teams
- Minimizes back-and-forth with advertisers
- Aims for complete, one-time fixes

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  users: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignRoles: false,
    canViewProfiles: true
  },
  finance: {
    canViewBudgets: false,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: true,
    canManageWallets: false
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: true,
    canProvideTechnicalSupport: true
  }
}
```

### 8. Support 1
**Hierarchy Level**: 5 (Lowest)
**Portal**: E1
**Reports To**: Support 2

**Responsibilities**:
- Resolves basic advertiser queries
- Campaign creation steps, login issues, navigation help
- Wallet visibility and feature usage
- Provides documentation and escalates unresolved issues

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: false
  }
}
```

## E2 - Admin Portal Roles

### 1. Super Admin
**Hierarchy Level**: 0 (Cross-portal highest)
**Portal**: E1, E2, E3 (All portals)
**Reports To**: None

**Responsibilities**:
- Full control over campaign moderation, platform configuration
- Manual override capabilities
- Can delete any profile if needed
- Unrestricted read/write/delete permissions

**Permissions**:
```typescript
{
  // All permissions set to true - Super Admin has unrestricted access
  campaigns: { canCreate: true, canEdit: true, canDelete: true, canApprove: true, canView: true },
  users: { canCreate: true, canEdit: true, canDelete: true, canAssignRoles: true, canViewProfiles: true },
  finance: { canViewBudgets: true, canSetBudgets: true, canApprovePayouts: true, canViewTransactions: true, canManageWallets: true },
  analytics: { canViewReports: true, canExportData: true, canViewFinancialReports: true, canConfigureDashboards: true },
  system: { canConfigureSystem: true, canAccessAuditLogs: true, canManageIntegrations: true, canOverridePermissions: true },
  support: { canAccessTickets: true, canEscalateIssues: true, canAccessCRM: true, canProvideTechnicalSupport: true }
}
```

### 2. Admin
**Hierarchy Level**: 1
**Portal**: E2
**Reports To**: Super Admin

**Responsibilities**:
- Manages internal workflows of operators and success managers
- Handles escalations from campaign issues or routing conflicts
- Cannot delete entities
- Assigns roles

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canApprove: true,
    canView: true
  },
  users: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canAssignRoles: true,
    canViewProfiles: true
  },
  system: {
    canConfigureSystem: false,
    canAccessAuditLogs: true,
    canManageIntegrations: false,
    canOverridePermissions: false
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: true,
    canProvideTechnicalSupport: true
  }
}
```

### 3. Platform Success Manager
**Hierarchy Level**: 2
**Portal**: E2
**Reports To**: Admin

**Responsibilities**:
- Ensures system uptime and operational continuity
- Can modify SSP pricing logic, payout distribution
- Token conversion rules for Glo/Blo coins
- Acts as Support 3 for platform-related tickets

**Permissions**:
```typescript
{
  system: {
    canConfigureSystem: true,
    canAccessAuditLogs: true,
    canManageIntegrations: true,
    canOverridePermissions: false
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: true,
    canApprovePayouts: true,
    canViewTransactions: true,
    canManageWallets: true
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: true,
    canProvideTechnicalSupport: true
  }
}
```

### 4. Customer Success Manager
**Hierarchy Level**: 2
**Portal**: E2
**Reports To**: Admin

**Responsibilities**:
- Ensures advertiser satisfaction through ticket resolution
- Optimization feedback
- Supports coordination between DSP and Ad Exchange
- Acts as Support 3 for customer-related tickets

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  users: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignRoles: false,
    canViewProfiles: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: true,
    canProvideTechnicalSupport: true
  }
}
```

### 5. Campaign Success Manager
**Hierarchy Level**: 2
**Portal**: E2
**Reports To**: Admin

**Responsibilities**:
- Oversees campaign flow from DSP to SSP
- Tracks live campaign status and ensures inventory matching
- Generates campaign analytics and insights

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canApprove: true,
    canView: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: true,
    canConfigureDashboards: true
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: false
  }
}
```

### 6. Support 2 (Admin)
**Hierarchy Level**: 4
**Portal**: E2
**Reports To**: Success Managers

**Responsibilities**:
- Handle tech failures (uploads, APIs)
- Collaborate with devs for bug reports

**Permissions**:
```typescript
{
  system: {
    canConfigureSystem: false,
    canAccessAuditLogs: true,
    canManageIntegrations: false,
    canOverridePermissions: false
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: true
  }
}
```

### 7. Support 1 (Admin)
**Hierarchy Level**: 5
**Portal**: E2
**Reports To**: Support 2

**Responsibilities**:
- Resolve common internal queries
- Help with navigation issues, FAQs

**Permissions**:
```typescript
{
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: false
  }
}
```

## E3 - Streamer Portal Roles

### 1. Organization/Agency Head
**Hierarchy Level**: 1
**Portal**: E3
**Reports To**: None (within organization)

**Responsibilities**:
- Onboards and manages Artiste Managers under their org
- Oversees publisher performance
- Reviews earnings and analytics for the full group

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: true,
    canView: true
  },
  users: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canAssignRoles: true,
    canViewProfiles: true
  },
  finance: {
    canViewBudgets: true,
    canSetBudgets: true,
    canApprovePayouts: true,
    canViewTransactions: true,
    canManageWallets: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: true,
    canConfigureDashboards: true
  }
}
```

### 2. Artiste Manager
**Hierarchy Level**: 2
**Portal**: E3
**Reports To**: Organization Head

**Responsibilities**:
- Recruits and manages Publishers (streamers, content creators)
- Monitors campaign performance per publisher
- Coordinates onboarding and campaign bidding

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  users: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canAssignRoles: false,
    canViewProfiles: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  }
}
```

### 3. Finance/Wallet Manager
**Hierarchy Level**: 2
**Portal**: E3
**Reports To**: Organization Head

**Responsibilities**:
- Tracks and verifies publisher Glo/Blo coin payouts
- Initiates and approves redemptions (bank transfer, gift cards)
- Resolves wallet-related disputes

**Permissions**:
```typescript
{
  finance: {
    canViewBudgets: true,
    canSetBudgets: false,
    canApprovePayouts: true,
    canViewTransactions: true,
    canManageWallets: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: true,
    canConfigureDashboards: false
  }
}
```

### 4. Publishers (Individual)
**Hierarchy Level**: 3
**Portal**: E3
**Reports To**: Artiste Manager (if in org) or Independent

**Responsibilities**:
- Bids and runs campaigns
- Connects platform accounts (YouTube, Twitch, etc.)
- Uploads content and submits analytics
- Can operate as solo publishers or under agencies

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  finance: {
    canViewBudgets: false,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: true,
    canManageWallets: false
  },
  analytics: {
    canViewReports: true,
    canExportData: false,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  }
}
```

### 5. Independent Streamer
**Hierarchy Level**: 1 (for independent streamers)
**Portal**: E3
**Reports To**: None

**Responsibilities**:
- Same as Publishers but not under any org/agency
- Manages their own campaigns and payouts directly

**Permissions**:
```typescript
{
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  finance: {
    canViewBudgets: false,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: true,
    canManageWallets: true
  },
  analytics: {
    canViewReports: true,
    canExportData: true,
    canViewFinancialReports: false,
    canConfigureDashboards: false
  }
}
```

### 6. Liaison Manager
**Hierarchy Level**: 3
**Portal**: E3
**Reports To**: Artiste Manager

**Responsibilities**:
- Supports Artiste Managers in publisher onboarding
- Assists with onboarding and dispute resolution
- Tracks performance and suggests campaign opportunities
- Flags issues or misconduct for internal review

**Permissions**:
```typescript
{
  users: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignRoles: false,
    canViewProfiles: true
  },
  campaigns: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canView: true
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: false
  }
}
```

### 7. Support 2 (Streamer)
**Hierarchy Level**: 4
**Portal**: E3
**Reports To**: Finance/Wallet Manager or Artiste Manager

**Responsibilities**:
- Investigates complex issues by coordinating with finance and technical teams
- Handles escalated cases such as failed redemptions, data mismatches
- Ensures problem resolution with minimal user input dependency
- Escalates unresolved cases to Platform Success Manager

**Permissions**:
```typescript
{
  finance: {
    canViewBudgets: false,
    canSetBudgets: false,
    canApprovePayouts: false,
    canViewTransactions: true,
    canManageWallets: false
  },
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: true
  }
}
```

### 8. Support 1 (Streamer)
**Hierarchy Level**: 5
**Portal**: E3
**Reports To**: Support 2

**Responsibilities**:
- Resolves tickets for basic queries related to campaign participation
- Wallet visibility, redemption process, platform navigation
- Provides documentation links and escalates when needed

**Permissions**:
```typescript
{
  support: {
    canAccessTickets: true,
    canEscalateIssues: true,
    canAccessCRM: false,
    canProvideTechnicalSupport: false
  }
}
```

## Role Assignment & Migration Strategy

### Default Role Mapping for Existing Users
```typescript
const LEGACY_TO_EUREKA_MAPPING = {
  'brand': UserRole.MARKETING_HEAD,      // Existing brand users → Marketing Head
  'streamer': UserRole.INDEPENDENT_STREAMER, // Existing streamers → Independent
  'admin': UserRole.SUPER_ADMIN,         // Existing admins → Super Admin
};
```

### Organization Creation Patterns
```typescript
// When a Marketing Head creates an organization
const DEFAULT_BRAND_ORG_STRUCTURE = {
  organizationHead: UserRole.MARKETING_HEAD,
  defaultMembers: [
    UserRole.CAMPAIGN_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.VALIDATOR_APPROVER,
  ],
  supportTeam: [
    UserRole.SALES_REPRESENTATIVE,
    UserRole.BRAND_SUPPORT_2,
    UserRole.BRAND_SUPPORT_1,
  ],
};

// When an Organization Head creates a streamer agency
const DEFAULT_STREAMER_ORG_STRUCTURE = {
  organizationHead: UserRole.ORGANIZATION_HEAD,
  management: [
    UserRole.ARTISTE_MANAGER,
    UserRole.FINANCE_WALLET_MANAGER,
  ],
  publishers: [
    UserRole.PUBLISHER,
    UserRole.LIAISON_MANAGER,
  ],
  support: [
    UserRole.STREAMER_SUPPORT_2,
    UserRole.STREAMER_SUPPORT_1,
  ],
};
```

### Cross-Portal Access Rules
```typescript
const CROSS_PORTAL_ACCESS = {
  [UserRole.SUPER_ADMIN]: ['E1', 'E2', 'E3'], // Full access
  [UserRole.PLATFORM_SUCCESS_MANAGER]: ['E2', 'E1'], // Platform + Brand coordination
  [UserRole.CUSTOMER_SUCCESS_MANAGER]: ['E2', 'E1'], // Customer support coordination
  // All other roles are restricted to their primary portal
};
```

## Security Considerations

### Permission Inheritance Rules
1. **Organization-level restrictions** override individual permissions
2. **Role-based permissions** are the baseline
3. **User-specific overrides** can only reduce permissions, not expand them
4. **Super Admin** bypasses all restrictions

### Audit Requirements
- All role assignments must be logged
- Permission changes require approval from higher hierarchy level
- Cross-portal access is logged with additional detail
- Financial permissions require additional verification

### Emergency Procedures
- Super Admin can temporarily elevate permissions in emergencies
- All emergency permission changes expire after 24 hours
- Emergency actions require post-incident review and approval

This comprehensive role mapping provides the foundation for implementing the Eureka role system while maintaining security, auditability, and proper access control across all three portals.
