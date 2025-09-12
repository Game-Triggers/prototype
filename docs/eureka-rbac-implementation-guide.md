# Eureka Role-Based Account System - Implementation Guide

This guide provides comprehensive instructions for implementing and using the Eureka Role-Based Access Control (RBAC) system in your Gametriggers platform.

## Overview

The Eureka RBAC system provides fine-grained access control across three portals:
- **E1 (Brand Portal)**: For advertisers and brand-side operations
- **E2 (Admin Portal)**: For internal platform management and ad exchange operations  
- **E3 (Publisher Portal)**: For streamers, content creators, and publisher operations

## System Architecture

### Core Components

1. **Role Definitions** (`lib/eureka-roles.ts`)
   - Comprehensive role hierarchy with 25+ roles
   - Permission-based access control with 30+ permissions
   - Portal-based UI rendering logic

2. **Backend Guards** (`backend/src/modules/auth/guards/`)
   - `PermissionsGuard`: Fine-grained permission checking
   - `EurekaRolesGuard`: Role-based access control
   - Enhanced JWT integration

3. **Frontend Hooks** (`lib/hooks/use-eureka-roles.tsx`)
   - React hooks for role/permission checking
   - Components for conditional rendering
   - Higher-order components for route protection

4. **Middleware** (`middleware.ts`)
   - Portal-based routing
   - Automatic redirection to appropriate dashboards
   - Access denied handling

## Implementation Steps

### 1. Backend Implementation

#### Update User Schema
Your user schema already includes the new Eureka roles. Ensure all roles are properly defined:

```typescript
// schemas/user.schema.ts
role: {
  type: String,
  enum: Object.values(UserRole), // Now includes all Eureka roles
  required: true,
}
```

#### Implement Guards in Controllers
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/enhanced-jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../../lib/eureka-roles';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CampaignsController {
  @Post()
  @RequirePermissions(Permission.CREATE_CAMPAIGN)
  async create(@Body() data: CreateCampaignDto) {
    // Only users with CREATE_CAMPAIGN permission can access
  }

  @Put(':id/approve')
  @RequirePermissions(Permission.APPROVE_CAMPAIGN)
  async approve(@Param('id') id: string) {
    // Only validators/approvers can approve campaigns
  }
}
```

#### Use the EurekaRoleService
```typescript
import { EurekaRoleService } from '../auth/services/eureka-role.service';

@Injectable()
export class SomeService {
  constructor(private roleService: EurekaRoleService) {}

  async checkUserAccess(userRole: string, resource: string) {
    // Check specific permission
    const canAccess = this.roleService.hasPermission(userRole, Permission.READ_CAMPAIGN);
    
    // Get user's portal
    const portal = this.roleService.getUserPortal(userRole);
    
    // Check if user can delete
    const canDelete = this.roleService.canDelete(userRole);
    
    return { canAccess, portal, canDelete };
  }
}
```

### 2. Frontend Implementation

#### Use Role-Based Hooks
```typescript
import { useEurekaRole, usePermissions, usePortalAccess } from '../lib/hooks/use-eureka-roles';

export function Dashboard() {
  const { eurekaRole, isAuthenticated } = useEurekaRole();
  const { hasPermission } = usePermissions();
  const { shouldShowBrandComponents, shouldShowAdminComponents } = usePortalAccess();

  if (!isAuthenticated) return <Loading />;

  return (
    <div>
      {shouldShowBrandComponents && <BrandDashboard />}
      {shouldShowAdminComponents && <AdminDashboard />}
      
      {hasPermission(Permission.CREATE_CAMPAIGN) && (
        <CreateCampaignButton />
      )}
    </div>
  );
}
```

#### Use Permission Gates
```typescript
import { PermissionGate, PortalGate } from '../lib/hooks/use-eureka-roles';
import { Permission, Portal } from '../lib/eureka-roles';

export function CampaignManagement() {
  return (
    <div>
      <PortalGate portal={Portal.BRAND}>
        <h1>Brand Campaign Management</h1>
      </PortalGate>

      <PermissionGate permissions={[Permission.CREATE_CAMPAIGN]}>
        <CreateCampaignForm />
      </PermissionGate>

      <PermissionGate 
        anyPermission={[Permission.APPROVE_CAMPAIGN, Permission.REJECT_CAMPAIGN]}
        fallback={<div>No approval permissions</div>}
      >
        <CampaignApprovalPanel />
      </PermissionGate>
    </div>
  );
}
```

#### Protect Routes with HOCs
```typescript
import { withPermissions, withPortalAccess } from '../lib/hooks/use-eureka-roles';
import { Permission, Portal } from '../lib/eureka-roles';

// Protect component with permissions
const ProtectedAdminPanel = withPermissions(
  AdminPanel,
  [Permission.CONFIGURE_PLATFORM, Permission.VIEW_SYSTEM_LOGS]
);

// Protect component with portal access
const BrandOnlyComponent = withPortalAccess(
  BrandSettings,
  Portal.BRAND
);
```

### 3. Database Migration

If you have existing users with legacy roles, run a migration:

```typescript
import { EurekaRoleService } from '../backend/src/modules/auth/services/eureka-role.service';

async function migrateUserRoles() {
  const users = await User.find({});
  const roleService = new EurekaRoleService();
  
  for (const user of users) {
    const newRole = roleService.migrateRole(user.role);
    await User.updateOne(
      { _id: user._id },
      { role: newRole }
    );
  }
}
```

### 4. Environment Configuration

Update your auth configuration to handle the new role system:

```typescript
// lib/auth.ts - Update the JWT callback
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      // Map legacy role to Eureka role
      const roleService = new EurekaRoleService();
      const eurekaRole = roleService.mapToEurekaRole(user.role);
      token.user = { ...user, role: eurekaRole };
    }
    return token;
  }
}
```

## Role Definitions and Permissions

### E1: Brand Portal Roles

| Role | Portal | Key Permissions | Description |
|------|--------|----------------|-------------|
| `marketing_head` | Brand | All campaign + team management | Creates organizations, assigns roles |
| `campaign_manager` | Brand | Campaign CRUD, analytics | Manages campaigns and performance |
| `finance_manager` | Brand | Financial operations | Handles billing and budgets |
| `validator_approver` | Brand | Campaign approval | Reviews and approves campaigns |

### E2: Admin Portal Roles

| Role | Portal | Key Permissions | Description |
|------|--------|----------------|-------------|
| `super_admin` | Admin | All permissions | Full system control |
| `platform_success_manager` | Admin | System config, pricing | Ensures platform operations |
| `customer_success_manager` | Admin | Support L3, CRM | Handles escalated support |
| `campaign_success_manager` | Admin | Campaign oversight | Monitors campaign flow |

### E3: Publisher Portal Roles

| Role | Portal | Key Permissions | Description |
|------|--------|----------------|-------------|
| `streamer_individual` | Publisher | Campaign participation | Individual content creators |
| `artiste_manager` | Publisher | Publisher management | Manages multiple creators |
| `independent_publisher` | Publisher | Self-management | Independent creators |

## Best Practices

### 1. Permission Checking
```typescript
// ✅ Good - Check permissions in controllers
@RequirePermissions(Permission.CREATE_CAMPAIGN)
async createCampaign() {}

// ✅ Good - Check permissions in frontend
{hasPermission(Permission.CREATE_CAMPAIGN) && <Button />}

// ❌ Bad - Don't rely only on frontend checks
```

### 2. Role Assignment Validation
```typescript
// ✅ Good - Validate role assignments
const validation = roleService.validateRoleChange(
  currentRole,
  targetRole, 
  assignerRole
);

if (!validation.isValid) {
  throw new BadRequestException(validation.reason);
}
```

### 3. Portal-Based Routing
```typescript
// ✅ Good - Use middleware for automatic routing
// middleware.ts handles portal-based redirects

// ✅ Good - Use portal gates in components
<PortalGate portal={Portal.BRAND}>
  <BrandSpecificContent />
</PortalGate>
```

### 4. Error Handling
```typescript
// ✅ Good - Provide clear error messages
throw new ForbiddenException(
  `Insufficient permissions. Required: ${permissions.join(', ')}`
);

// ✅ Good - Use access denied page for better UX
// /app/access-denied/page.tsx
```

## Testing the Implementation

### 1. Backend API Testing
```bash
# Test with different roles
curl -H "Authorization: Bearer <token>" \
     -X POST /api/campaigns \
     -d '{"title": "Test Campaign"}'

# Should return 403 for users without CREATE_CAMPAIGN permission
```

### 2. Frontend Component Testing
```typescript
import { render } from '@testing-library/react';
import { useEurekaRole } from '../lib/hooks/use-eureka-roles';

// Mock the hook for testing
jest.mock('../lib/hooks/use-eureka-roles');

test('shows create button for campaign managers', () => {
  (useEurekaRole as jest.Mock).mockReturnValue({
    eurekaRole: EurekaRole.CAMPAIGN_MANAGER,
    portal: Portal.BRAND
  });
  
  const { getByText } = render(<CampaignDashboard />);
  expect(getByText('Create Campaign')).toBeInTheDocument();
});
```

### 3. Role Migration Testing
```typescript
// Test role migration
const roleService = new EurekaRoleService();

test('migrates legacy streamer role correctly', () => {
  const newRole = roleService.migrateRole('streamer');
  expect(newRole).toBe(EurekaRole.STREAMER_INDIVIDUAL);
});
```

## Common Patterns

### 1. Conditional UI Rendering
```typescript
const { hasPermission, hasAnyPermission } = usePermissions();

return (
  <div>
    {/* Show create button only if user can create */}
    {hasPermission(Permission.CREATE_CAMPAIGN) && (
      <CreateButton />
    )}
    
    {/* Show admin panel if user has any admin permission */}
    {hasAnyPermission([
      Permission.CONFIGURE_PLATFORM,
      Permission.VIEW_SYSTEM_LOGS
    ]) && (
      <AdminPanel />
    )}
  </div>
);
```

### 2. API Response Customization
```typescript
@Get('campaigns')
@RequirePermissions(Permission.READ_CAMPAIGN)
async getCampaigns(@Request() req: RequestWithUser) {
  const campaigns = await this.campaignService.findAll();
  
  // Customize response based on permissions
  return campaigns.map(campaign => ({
    ...campaign,
    // Include sensitive data only if user has detailed analytics permission
    ...(req.userPermissions?.includes(Permission.VIEW_DETAILED_ANALYTICS) && {
      detailedMetrics: campaign.analytics
    })
  }));
}
```

### 3. Dynamic Navigation
```typescript
const { portal, hasPermission } = useEurekaRole();

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', show: true },
  { 
    path: '/campaigns', 
    label: 'Campaigns', 
    show: hasPermission(Permission.READ_CAMPAIGN) 
  },
  { 
    path: '/admin', 
    label: 'Admin', 
    show: portal === Portal.ADMIN 
  }
].filter(item => item.show);
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required permission in `ROLE_CONFIGURATIONS`
   - Verify the guard is properly applied to the route
   - Ensure the token contains the correct role information

2. **Portal Routing Issues**
   - Check middleware configuration in `middleware.ts`
   - Verify `PORTAL_ROUTES` mapping includes the route
   - Ensure user role maps to correct portal

3. **Frontend Hook Issues**
   - Verify NextAuth session contains role information
   - Check if role mapping function works correctly
   - Ensure hooks are used within session provider context

## Security Considerations

1. **Never rely solely on frontend permission checks**
2. **Always validate permissions on the backend**
3. **Regularly audit role assignments and permissions**
4. **Use principle of least privilege**
5. **Log permission changes and access attempts**
6. **Implement proper session management**

## Next Steps

1. **Implement audit logging** for role changes and permission usage
2. **Add role-based analytics** to track system usage by role
3. **Create admin UI** for role management
4. **Implement dynamic permissions** that can be configured without code changes
5. **Add integration tests** for the complete permission flow

This implementation provides a robust, scalable role-based access control system that aligns with your business requirements while maintaining security and usability.
