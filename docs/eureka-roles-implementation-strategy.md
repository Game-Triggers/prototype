# Eureka Roles Integration - Implementation Strategy

## Implementation Overview

This document outlines a **phased approach** to integrate the Eureka E1, E2, and E3 role system into the existing Gametriggers platform. The strategy prioritizes system stability while enabling gradual feature evolution.

## Phase 1: Core Role System Enhancement (Weeks 1-8)

### 1.1 Database Schema Evolution

#### Step 1: Extend UserRole Enum
```typescript
// lib/schema-types.ts
export enum UserRole {
  // Existing roles (backward compatibility)
  STREAMER = 'streamer',
  BRAND = 'brand', 
  ADMIN = 'admin',
  
  // E1 Brand Portal Roles
  MARKETING_HEAD = 'marketing_head',
  CAMPAIGN_MANAGER = 'campaign_manager',
  FINANCE_MANAGER = 'finance_manager',
  VALIDATOR_APPROVER = 'validator_approver',
  CAMPAIGN_CONSULTANT = 'campaign_consultant',
  SALES_REPRESENTATIVE = 'sales_representative',
  BRAND_SUPPORT_2 = 'brand_support_2',
  BRAND_SUPPORT_1 = 'brand_support_1',
  
  // E2 Admin Portal Roles
  PLATFORM_SUCCESS_MANAGER = 'platform_success_manager',
  CUSTOMER_SUCCESS_MANAGER = 'customer_success_manager',
  CAMPAIGN_SUCCESS_MANAGER = 'campaign_success_manager',
  ADMIN_SUPPORT_2 = 'admin_support_2',
  ADMIN_SUPPORT_1 = 'admin_support_1',
  
  // E3 Streamer Portal Roles
  INDEPENDENT_STREAMER = 'independent_streamer',
  ORGANIZATION_HEAD = 'organization_head',
  ARTISTE_MANAGER = 'artiste_manager',
  FINANCE_WALLET_MANAGER = 'finance_wallet_manager',
  PUBLISHER = 'publisher',
  LIAISON_MANAGER = 'liaison_manager',
  STREAMER_SUPPORT_2 = 'streamer_support_2',
  STREAMER_SUPPORT_1 = 'streamer_support_1',
  
  // Cross-portal
  SUPER_ADMIN = 'super_admin',
}
```

#### Step 2: Add Organization Schema
```typescript
// schemas/organization.schema.ts
export interface IOrganization {
  _id: string;
  name: string;
  type: 'brand_company' | 'streamer_agency' | 'internal_team';
  parentOrganizationId?: string; // For hierarchical organizations
  settings: {
    budgetLimit?: number;
    permissions: OrganizationPermissions;
  };
  members: {
    userId: string;
    role: UserRole;
    joinedAt: Date;
    isActive: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Step 3: Enhance User Schema
```typescript
// schemas/user.schema.ts - Add to existing IUser interface
export interface IUser extends IUserDocument {
  // Existing fields...
  
  // New role system fields
  organizationId?: string;
  portalType: 'E1' | 'E2' | 'E3';
  permissions: UserPermissions;
  hierarchyLevel: number; // 1=highest, 5=lowest
  reportingManagerId?: string;
  isSuperAdmin: boolean;
  
  // Role-specific settings
  roleSettings: {
    budgetLimit?: number; // For finance-related roles
    accessLevel: 'read' | 'write' | 'admin' | 'super_admin';
    departmentAccess: string[]; // Which departments can access
    functionalPermissions: string[]; // Specific function permissions
  };
}
```

#### Step 4: Permission System Design
```typescript
// schemas/permissions.schema.ts
export interface UserPermissions {
  // Campaign Management
  campaigns: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canView: boolean;
  };
  
  // User Management
  users: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssignRoles: boolean;
    canViewProfiles: boolean;
  };
  
  // Financial Operations
  finance: {
    canViewBudgets: boolean;
    canSetBudgets: boolean;
    canApprovePayouts: boolean;
    canViewTransactions: boolean;
    canManageWallets: boolean;
  };
  
  // Analytics & Reporting
  analytics: {
    canViewReports: boolean;
    canExportData: boolean;
    canViewFinancialReports: boolean;
    canConfigureDashboards: boolean;
  };
  
  // System Administration
  system: {
    canConfigureSystem: boolean;
    canAccessAuditLogs: boolean;
    canManageIntegrations: boolean;
    canOverridePermissions: boolean;
  };
  
  // Support Functions
  support: {
    canAccessTickets: boolean;
    canEscalateIssues: boolean;
    canAccessCRM: boolean;
    canProvideTechnicalSupport: boolean;
  };
}
```

### 1.2 Database Migration Strategy

#### Migration Script Template
```typescript
// scripts/migrate-to-eureka-roles.ts
export async function migrateToEurekaRoles() {
  const users = await User.find({});
  
  for (const user of users) {
    let newRole: UserRole;
    let portalType: 'E1' | 'E2' | 'E3';
    let permissions: UserPermissions;
    
    // Map existing roles to new system
    switch (user.role) {
      case 'brand':
        newRole = UserRole.MARKETING_HEAD; // Default brand users to Marketing Head
        portalType = 'E1';
        permissions = getBrandDefaultPermissions();
        break;
        
      case 'streamer':
        newRole = UserRole.INDEPENDENT_STREAMER;
        portalType = 'E3';
        permissions = getStreamerDefaultPermissions();
        break;
        
      case 'admin':
        newRole = UserRole.SUPER_ADMIN;
        portalType = 'E2';
        permissions = getSuperAdminPermissions();
        break;
    }
    
    // Update user with new role structure
    await User.findByIdAndUpdate(user._id, {
      role: newRole,
      portalType,
      permissions,
      hierarchyLevel: getDefaultHierarchyLevel(newRole),
      isSuperAdmin: newRole === UserRole.SUPER_ADMIN,
      roleSettings: getDefaultRoleSettings(newRole),
    });
  }
}
```

### 1.3 Backend Implementation

#### Step 1: Enhanced Guards System
```typescript
// backend/src/guards/enhanced-roles.guard.ts
@Injectable()
export class EnhancedRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Super admin bypass
    if (user.isSuperAdmin) {
      return true;
    }
    
    // Check specific permissions
    return this.hasRequiredPermissions(user.permissions, requiredPermissions);
  }
  
  private hasRequiredPermissions(
    userPermissions: UserPermissions, 
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.every(permission => 
      this.checkPermission(userPermissions, permission)
    );
  }
}
```

#### Step 2: Permission Decorators
```typescript
// backend/src/decorators/permissions.decorator.ts
export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

// Usage examples:
@RequirePermissions('campaigns.canCreate', 'finance.canViewBudgets')
@Post('campaigns')
async createCampaign() {
  // Implementation
}
```

#### Step 3: Role-Based Service Layer
```typescript
// backend/src/services/role.service.ts
@Injectable()
export class RoleService {
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const user = await this.userService.findById(userId);
    return user.permissions;
  }
  
  async checkPermission(
    userId: string, 
    permission: string
  ): Promise<boolean> {
    const user = await this.userService.findById(userId);
    
    if (user.isSuperAdmin) return true;
    
    return this.evaluatePermission(user.permissions, permission);
  }
  
  async getOrganizationMembers(
    organizationId: string,
    requestingUserId: string
  ): Promise<User[]> {
    // Check if requesting user has permission to view organization members
    const hasPermission = await this.checkPermission(
      requestingUserId, 
      'users.canViewProfiles'
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return this.organizationService.getMembers(organizationId);
  }
}
```

### 1.4 Frontend Implementation

#### Step 1: Enhanced Authentication Context
```typescript
// components/providers/auth-provider.tsx
interface AuthContextType {
  user: User | null;
  permissions: UserPermissions | null;
  organization: Organization | null;
  portalType: 'E1' | 'E2' | 'E3' | null;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  
  const hasPermission = useCallback((permission: string) => {
    if (!permissions) return false;
    if (session?.user?.isSuperAdmin) return true;
    
    return evaluatePermissionString(permissions, permission);
  }, [permissions, session?.user?.isSuperAdmin]);
  
  const canAccess = useCallback((resource: string, action: string) => {
    return hasPermission(`${resource}.${action}`);
  }, [hasPermission]);
  
  // Implementation...
};
```

#### Step 2: Permission-Aware Components
```typescript
// components/ui/permission-wrapper.tsx
interface PermissionWrapperProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuth();
  
  const hasAccess = Array.isArray(permission)
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission);
    
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Usage:
<PermissionWrapper permission="campaigns.canCreate">
  <Button onClick={createCampaign}>Create Campaign</Button>
</PermissionWrapper>
```

#### Step 3: Role-Specific Navigation
```typescript
// components/navigation/portal-navigation.tsx
export const PortalNavigation: React.FC = () => {
  const { user, portalType, canAccess } = useAuth();
  
  const getNavigationItems = () => {
    switch (portalType) {
      case 'E1':
        return [
          ...(canAccess('campaigns', 'canView') ? [{ href: '/campaigns', label: 'Campaigns' }] : []),
          ...(canAccess('finance', 'canViewBudgets') ? [{ href: '/budgets', label: 'Budgets' }] : []),
          ...(canAccess('analytics', 'canViewReports') ? [{ href: '/analytics', label: 'Analytics' }] : []),
        ];
      case 'E2':
        return [
          ...(canAccess('system', 'canConfigureSystem') ? [{ href: '/admin/system', label: 'System Config' }] : []),
          ...(canAccess('users', 'canViewProfiles') ? [{ href: '/admin/users', label: 'User Management' }] : []),
        ];
      case 'E3':
        return [
          { href: '/streamer/campaigns', label: 'My Campaigns' },
          ...(canAccess('finance', 'canViewTransactions') ? [{ href: '/wallet', label: 'Wallet' }] : []),
        ];
      default:
        return [];
    }
  };
  
  return (
    <nav>
      {getNavigationItems().map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
```

### 1.5 API Route Protection

#### Enhanced API Route Middleware
```typescript
// lib/api-protection.ts
export function withRoleProtection(
  handler: NextApiHandler,
  requiredPermissions: string[]
) {
  return async (req: NextRequest, res: NextResponse) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Super admin bypass
    if (session.user.isSuperAdmin) {
      return handler(req, res);
    }
    
    // Check permissions
    const hasPermission = requiredPermissions.every(permission =>
      checkUserPermission(session.user.permissions, permission)
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' }, 
        { status: 403 }
      );
    }
    
    return handler(req, res);
  };
}

// Usage:
export const POST = withRoleProtection(
  async (req: NextRequest) => {
    // Campaign creation logic
  },
  ['campaigns.canCreate', 'finance.canViewBudgets']
);
```

## Phase 2: Portal Separation (Weeks 9-16)

### 2.1 Portal-Specific Routing

#### App Router Structure
```
app/
├── (auth)/
│   └── login/
├── (portals)/
│   ├── e1/ (Brand Portal)
│   │   ├── dashboard/
│   │   ├── campaigns/
│   │   ├── budgets/
│   │   └── analytics/
│   ├── e2/ (Admin Portal)
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── system/
│   │   └── monitoring/
│   └── e3/ (Streamer Portal)
│       ├── dashboard/
│       ├── campaigns/
│       ├── wallet/
│       └── analytics/
└── api/
    ├── e1/
    ├── e2/
    └── e3/
```

#### Portal-Specific Layouts
```typescript
// app/(portals)/e1/layout.tsx
export default function E1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="e1-portal">
      <E1Navigation />
      <main className="content">
        {children}
      </main>
    </div>
  );
}
```

### 2.2 Portal Access Control

#### Middleware for Portal Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Portal access control
  if (pathname.startsWith('/e1/')) {
    return checkPortalAccess(request, 'E1');
  } else if (pathname.startsWith('/e2/')) {
    return checkPortalAccess(request, 'E2');
  } else if (pathname.startsWith('/e3/')) {
    return checkPortalAccess(request, 'E3');
  }
  
  return NextResponse.next();
}

async function checkPortalAccess(
  request: NextRequest, 
  portalType: 'E1' | 'E2' | 'E3'
) {
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Super admin can access all portals
  if (token.isSuperAdmin) {
    return NextResponse.next();
  }
  
  // Check portal access
  if (token.portalType !== portalType) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
}
```

## Phase 3: Advanced Features (Weeks 17-24)

### 3.1 Organization Management

#### Organization Service
```typescript
// backend/src/services/organization.service.ts
@Injectable()
export class OrganizationService {
  async createOrganization(
    createOrgDto: CreateOrganizationDto,
    creatorId: string
  ): Promise<Organization> {
    // Validate creator has permission to create organizations
    const hasPermission = await this.roleService.checkPermission(
      creatorId,
      'organizations.canCreate'
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Cannot create organizations');
    }
    
    const organization = await this.organizationRepository.create({
      ...createOrgDto,
      createdBy: creatorId,
      members: [{
        userId: creatorId,
        role: UserRole.ORGANIZATION_HEAD,
        joinedAt: new Date(),
        isActive: true,
      }],
    });
    
    return organization;
  }
  
  async addMemberToOrganization(
    organizationId: string,
    userId: string,
    role: UserRole,
    requesterId: string
  ): Promise<void> {
    // Check if requester can manage organization members
    const canManage = await this.canManageOrganization(
      requesterId, 
      organizationId
    );
    
    if (!canManage) {
      throw new ForbiddenException('Cannot manage organization members');
    }
    
    await this.organizationRepository.addMember(
      organizationId,
      userId,
      role
    );
    
    // Update user's organization association
    await this.userService.updateUser(userId, {
      organizationId,
      role,
    });
  }
}
```

### 3.2 Hierarchical Permissions

#### Permission Inheritance System
```typescript
// services/permission-inheritance.service.ts
@Injectable()
export class PermissionInheritanceService {
  async getEffectivePermissions(userId: string): Promise<UserPermissions> {
    const user = await this.userService.findById(userId);
    const organization = user.organizationId 
      ? await this.organizationService.findById(user.organizationId)
      : null;
    
    // Start with role-based permissions
    let permissions = this.getRolePermissions(user.role);
    
    // Apply organization-level restrictions
    if (organization) {
      permissions = this.applyOrganizationRestrictions(
        permissions,
        organization.settings.permissions
      );
    }
    
    // Apply user-specific overrides
    if (user.permissions) {
      permissions = this.mergePermissions(permissions, user.permissions);
    }
    
    return permissions;
  }
  
  private getRolePermissions(role: UserRole): UserPermissions {
    const rolePermissionMap: Record<UserRole, UserPermissions> = {
      [UserRole.MARKETING_HEAD]: {
        campaigns: { canCreate: true, canEdit: true, canDelete: false, canApprove: true, canView: true },
        users: { canCreate: true, canEdit: true, canDelete: false, canAssignRoles: true, canViewProfiles: true },
        finance: { canViewBudgets: true, canSetBudgets: true, canApprovePayouts: false, canViewTransactions: true, canManageWallets: false },
        // ... other permissions
      },
      // ... other role mappings
    };
    
    return rolePermissionMap[role] || this.getDefaultPermissions();
  }
}
```

### 3.3 Audit Logging

#### Audit Service Implementation
```typescript
// services/audit.service.ts
@Injectable()
export class AuditService {
  async logAction(
    userId: string,
    action: string,
    resource: string,
    details: any,
    organizationId?: string
  ): Promise<void> {
    const auditLog = {
      userId,
      action,
      resource,
      details,
      organizationId,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
    };
    
    await this.auditRepository.create(auditLog);
    
    // Real-time notifications for critical actions
    if (this.isCriticalAction(action)) {
      await this.notificationService.sendAuditAlert(auditLog);
    }
  }
  
  async getAuditLogs(
    filters: AuditLogFilters,
    requesterId: string
  ): Promise<AuditLog[]> {
    // Check permission to view audit logs
    const hasPermission = await this.roleService.checkPermission(
      requesterId,
      'system.canAccessAuditLogs'
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Cannot access audit logs');
    }
    
    return this.auditRepository.findWithFilters(filters);
  }
}
```

## Testing Strategy

### 1. Unit Testing
```typescript
// tests/role.service.spec.ts
describe('RoleService', () => {
  let service: RoleService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RoleService],
    }).compile();
    
    service = module.get<RoleService>(RoleService);
  });
  
  describe('checkPermission', () => {
    it('should allow super admin all permissions', async () => {
      const result = await service.checkPermission(
        'super-admin-id',
        'campaigns.canDelete'
      );
      expect(result).toBe(true);
    });
    
    it('should respect role-based permissions', async () => {
      const result = await service.checkPermission(
        'campaign-manager-id',
        'campaigns.canCreate'
      );
      expect(result).toBe(true);
    });
    
    it('should deny unauthorized permissions', async () => {
      const result = await service.checkPermission(
        'support-1-id',
        'users.canDelete'
      );
      expect(result).toBe(false);
    });
  });
});
```

### 2. Integration Testing
```typescript
// tests/e2e/role-integration.spec.ts
describe('Role Integration', () => {
  it('should enforce permissions across API routes', async () => {
    const campaignManager = await createTestUser(UserRole.CAMPAIGN_MANAGER);
    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${campaignManager.token}`)
      .send(campaignData);
      
    expect(response.status).toBe(201);
  });
  
  it('should prevent unauthorized access', async () => {
    const support1 = await createTestUser(UserRole.BRAND_SUPPORT_1);
    const response = await request(app)
      .delete('/api/campaigns/123')
      .set('Authorization', `Bearer ${support1.token}`);
      
    expect(response.status).toBe(403);
  });
});
```

## Deployment Strategy

### 1. Feature Flags
```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  EUREKA_ROLES_ENABLED: process.env.EUREKA_ROLES_ENABLED === 'true',
  PORTAL_SEPARATION_ENABLED: process.env.PORTAL_SEPARATION_ENABLED === 'true',
  ORGANIZATION_SUPPORT_ENABLED: process.env.ORGANIZATION_SUPPORT_ENABLED === 'true',
};

// Usage in components
if (FEATURE_FLAGS.EUREKA_ROLES_ENABLED) {
  // New role system logic
} else {
  // Fallback to legacy role system
}
```

### 2. Gradual Rollout
1. **Week 1-2**: Deploy database migrations in maintenance window
2. **Week 3-4**: Enable new role system for internal users only
3. **Week 5-6**: Beta test with select brand customers
4. **Week 7-8**: Full rollout with monitoring and rollback capabilities

### 3. Monitoring and Alerting
```typescript
// monitoring/role-system-metrics.ts
export class RoleSystemMetrics {
  static trackPermissionCheck(permission: string, result: boolean) {
    metrics.increment('permission_checks_total', {
      permission,
      result: result.toString(),
    });
  }
  
  static trackRoleUsage(role: UserRole) {
    metrics.increment('role_usage_total', {
      role,
    });
  }
  
  static trackOrganizationActivity(organizationId: string, action: string) {
    metrics.increment('organization_activity_total', {
      organization: organizationId,
      action,
    });
  }
}
```

## Risk Mitigation

### 1. Data Backup Strategy
- **Pre-migration backup**: Full database backup before role system migration
- **Incremental backups**: Hourly backups during rollout period
- **Rollback plan**: Automated rollback scripts if issues detected

### 2. Performance Monitoring
- **Permission check latency**: Monitor API response times
- **Database query optimization**: Index creation for permission checks
- **Caching strategy**: Cache user permissions with TTL

### 3. Security Considerations
- **Permission escalation prevention**: Strict validation of role assignments
- **Audit all permission changes**: Complete audit trail for role modifications
- **Regular permission reviews**: Automated reports for role anomalies

## Success Metrics

### 1. Technical Metrics
- **Permission check performance**: < 50ms average response time
- **System availability**: > 99.9% uptime during migration
- **Error rates**: < 0.1% error rate for permission-related operations

### 2. Business Metrics
- **User adoption**: 90% of users successfully using new role system within 4 weeks
- **Support ticket reduction**: 30% reduction in access-related support tickets
- **Administrative efficiency**: 50% reduction in manual role management tasks

### 3. Security Metrics
- **Zero privilege escalation incidents**
- **100% audit coverage** for all role-related operations
- **Successful security review** with external audit

## Conclusion

This implementation strategy provides a comprehensive, phased approach to integrating the Eureka role system while maintaining system stability and user experience. The modular design allows for incremental rollout and easy rollback if issues arise.

The strategy balances technical complexity with business requirements, ensuring that the enhanced role system provides value while minimizing risk to the existing platform.
