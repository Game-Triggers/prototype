# Eureka Roles & Schema Implementation Plan

## Overview

This document provides a detailed technical implementation plan for integrating the Eureka role-based access control system into the existing GameTriggers platform. This plan follows the feasibility analysis and provides step-by-step implementation guidance.

## Implementation Phases

### Phase 1: Foundation & Schema Design (Weeks 1-6)

#### Week 1-2: Enhanced Schema Design

##### 1.1 Role Enumeration Update
**File: `/lib/schema-types.ts`**

```typescript
// Replace existing UserRole enum
export enum EurekaRole {
  // E1 - Brand Portal Roles
  MARKETING_HEAD = 'marketing_head',
  CAMPAIGN_MANAGER = 'campaign_manager',
  FINANCE_MANAGER = 'finance_manager',
  VALIDATOR_APPROVER = 'validator_approver',
  CAMPAIGN_CONSULTANT = 'campaign_consultant',
  SALES_REPRESENTATIVE = 'sales_representative',
  ADMIN_BRAND = 'admin_brand',
  SUPPORT_1_BRAND = 'support_1_brand',
  SUPPORT_2_BRAND = 'support_2_brand',
  
  // E2 - Ad Exchange Roles
  ADMIN_EXCHANGE = 'admin_exchange',
  PLATFORM_SUCCESS_MANAGER = 'platform_success_manager',
  CUSTOMER_SUCCESS_MANAGER = 'customer_success_manager',
  CAMPAIGN_SUCCESS_MANAGER = 'campaign_success_manager',
  SUPPORT_1_EXCHANGE = 'support_1_exchange',
  SUPPORT_2_EXCHANGE = 'support_2_exchange',
  
  // E3 - Publisher Portal Roles
  ARTISTE_MANAGER = 'artiste_manager',
  STREAMER_INDIVIDUAL = 'streamer_individual',
  INDEPENDENT_PUBLISHER = 'independent_publisher',
  LIAISON_MANAGER = 'liaison_manager',
  SUPPORT_1_PUBLISHER = 'support_1_publisher',
  SUPPORT_2_PUBLISHER = 'support_2_publisher',
  
  // Cross-Platform Role
  SUPER_ADMIN = 'super_admin'
}

export enum Portal {
  E1_BRAND = 'e1_brand',
  E2_EXCHANGE = 'e2_exchange',
  E3_PUBLISHER = 'e3_publisher'
}

export enum Permission {
  // Campaign Permissions
  CREATE_CAMPAIGN = 'create_campaign',
  EDIT_CAMPAIGN = 'edit_campaign',
  DELETE_CAMPAIGN = 'delete_campaign',
  APPROVE_CAMPAIGN = 'approve_campaign',
  PAUSE_CAMPAIGN = 'pause_campaign',
  
  // Financial Permissions
  UPLOAD_FUNDS = 'upload_funds',
  SET_BUDGET_LIMITS = 'set_budget_limits',
  VIEW_BILLING = 'view_billing',
  MANAGE_PAYMENTS = 'manage_payments',
  
  // User Management
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  ASSIGN_ROLES = 'assign_roles',
  
  // Organization Management
  CREATE_ORGANIZATION = 'create_organization',
  MANAGE_ORGANIZATION = 'manage_organization',
  
  // Analytics & Reporting
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_REPORTS = 'export_reports',
  
  // Support & Workflow
  HANDLE_TICKETS = 'handle_tickets',
  ESCALATE_ISSUES = 'escalate_issues',
  OVERRIDE_DECISIONS = 'override_decisions'
}
```

##### 1.2 Organization Schema Creation
**New File: `/schemas/organization.schema.ts`**

```typescript
import { Schema, model, Model, models } from 'mongoose';

export interface IOrganization {
  _id?: string;
  name: string;
  type: 'advertiser' | 'agency' | 'publisher_network';
  parentOrganizationId?: string;
  budgetLimits: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  isActive: boolean;
  settings: {
    approvalWorkflow: boolean;
    budgetAlerts: boolean;
    autoApprovalThreshold?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['advertiser', 'agency', 'publisher_network'],
    required: true 
  },
  parentOrganizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  budgetLimits: {
    daily: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  settings: {
    approvalWorkflow: { type: Boolean, default: false },
    budgetAlerts: { type: Boolean, default: true },
    autoApprovalThreshold: { type: Number }
  }
}, { timestamps: true });

export const OrganizationSchema = organizationSchema;
export const Organization = models.Organization || model<IOrganization>('Organization', organizationSchema);
```

##### 1.3 Enhanced User Schema
**File: `/schemas/user.schema.ts`** - Major modifications:

```typescript
// Add new fields to IUser interface
export interface IUser extends IUserDocument {
  // Enhanced role system
  role: EurekaRole;
  portalAccess: Portal[];
  permissions: Permission[];
  
  // Organization linkage
  organizationId?: string;
  teamIds?: string[];
  
  // Financial controls
  budgetLimits?: {
    daily: number;
    campaign: number;
    canOverride: boolean;
  };
  
  // Workflow state
  approvalLevel: number; // 1-5 based on role hierarchy
  canDelegate: boolean;
  delegatedTo?: string[];
  
  // Audit fields
  lastLoginPortal?: Portal;
  actionHistory?: Array<{
    action: string;
    timestamp: Date;
    portal: Portal;
    details?: any;
  }>;
  
  // Existing fields...
  password?: string;
  isActive?: boolean;
  // ... rest of existing fields
}
```

#### Week 3-4: Permission & Role Mapping System

##### 1.4 Role Permission Mapping
**New File: `/lib/role-permissions.ts`**

```typescript
import { EurekaRole, Permission, Portal } from './schema-types';

export const ROLE_PERMISSIONS: Record<EurekaRole, Permission[]> = {
  // E1 Brand Portal
  [EurekaRole.MARKETING_HEAD]: [
    Permission.CREATE_ORGANIZATION,
    Permission.ASSIGN_ROLES,
    Permission.SET_BUDGET_LIMITS,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_CAMPAIGN,
    Permission.EDIT_CAMPAIGN
  ],
  
  [EurekaRole.CAMPAIGN_MANAGER]: [
    Permission.CREATE_CAMPAIGN,
    Permission.EDIT_CAMPAIGN,
    Permission.PAUSE_CAMPAIGN,
    Permission.VIEW_ANALYTICS
  ],
  
  // ... complete mapping for all 18+ roles
  
  [EurekaRole.SUPER_ADMIN]: Object.values(Permission) // All permissions
};

export const ROLE_PORTAL_ACCESS: Record<EurekaRole, Portal[]> = {
  [EurekaRole.MARKETING_HEAD]: [Portal.E1_BRAND],
  [EurekaRole.CAMPAIGN_MANAGER]: [Portal.E1_BRAND],
  // ... complete mapping
  [EurekaRole.SUPER_ADMIN]: [Portal.E1_BRAND, Portal.E2_EXCHANGE, Portal.E3_PUBLISHER]
};

export class PermissionChecker {
  static hasPermission(userRole: EurekaRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
  }
  
  static hasPortalAccess(userRole: EurekaRole, portal: Portal): boolean {
    return ROLE_PORTAL_ACCESS[userRole]?.includes(portal) || false;
  }
  
  static canApprove(userRole: EurekaRole, targetRole: EurekaRole): boolean {
    // Implement hierarchy-based approval logic
    const hierarchy = {
      [EurekaRole.SUPER_ADMIN]: 10,
      [EurekaRole.MARKETING_HEAD]: 8,
      [EurekaRole.ADMIN_BRAND]: 7,
      [EurekaRole.CAMPAIGN_MANAGER]: 5,
      // ... complete hierarchy
    };
    
    return hierarchy[userRole] > hierarchy[targetRole];
  }
}
```

#### Week 5-6: Database Migration & Authentication Updates

##### 1.5 Migration Scripts
**New File: `/backend/scripts/role-migration.js`**

```javascript
// Migration script to convert existing roles to new system
const mongoose = require('mongoose');

async function migrateUsers() {
  const users = await mongoose.connection.collection('users').find({}).toArray();
  
  for (const user of users) {
    let newRole;
    let portalAccess;
    
    switch(user.role) {
      case 'streamer':
        newRole = 'streamer_individual';
        portalAccess = ['e3_publisher'];
        break;
      case 'brand':
        newRole = 'campaign_manager';
        portalAccess = ['e1_brand'];
        break;
      case 'admin':
        newRole = 'super_admin';
        portalAccess = ['e1_brand', 'e2_exchange', 'e3_publisher'];
        break;
    }
    
    await mongoose.connection.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          role: newRole,
          portalAccess: portalAccess,
          permissions: [], // Will be populated by role mapping
          approvalLevel: 1,
          canDelegate: false
        }
      }
    );
  }
}
```

##### 1.6 Enhanced NextAuth Configuration
**File: `/lib/auth.ts`** - Major updates:

```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Fetch complete user data including role and permissions
        const fullUser = await fetch(`${API_URL}/api/users/${user.id}`);
        const userData = await fullUser.json();
        
        token.role = userData.role;
        token.portalAccess = userData.portalAccess;
        token.permissions = ROLE_PERMISSIONS[userData.role];
        token.organizationId = userData.organizationId;
      }
      return token;
    },
    
    async session({ session, token }) {
      session.user.role = token.role as EurekaRole;
      session.user.portalAccess = token.portalAccess as Portal[];
      session.user.permissions = token.permissions as Permission[];
      session.user.organizationId = token.organizationId as string;
      return session;
    }
  }
};
```

### Phase 2: Backend Implementation (Weeks 7-12)

#### Week 7-8: NestJS Guards & Decorators

##### 2.1 Role-based Guards
**New File: `/backend/src/guards/role.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EurekaRole, Permission, Portal } from '../../../lib/schema-types';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<EurekaRole[]>('roles', context.getHandler());
    const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler());
    const requiredPortal = this.reflector.get<Portal>('portal', context.getHandler());
    
    if (!requiredRoles && !requiredPermissions && !requiredPortal) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check role
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role privileges');
    }

    // Check permissions
    if (requiredPermissions && !requiredPermissions.every(p => user.permissions.includes(p))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check portal access
    if (requiredPortal && !user.portalAccess.includes(requiredPortal)) {
      throw new ForbiddenException('Portal access denied');
    }

    return true;
  }
}
```

##### 2.2 Custom Decorators
**New File: `/backend/src/decorators/auth.decorators.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';
import { EurekaRole, Permission, Portal } from '../../../lib/schema-types';

export const Roles = (...roles: EurekaRole[]) => SetMetadata('roles', roles);
export const Permissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);
export const RequirePortal = (portal: Portal) => SetMetadata('portal', portal);

// Composite decorators for common use cases
export const BrandPortalOnly = () => RequirePortal(Portal.E1_BRAND);
export const ExchangePortalOnly = () => RequirePortal(Portal.E2_EXCHANGE);
export const PublisherPortalOnly = () => RequirePortal(Portal.E3_PUBLISHER);

export const SuperAdminOnly = () => Roles(EurekaRole.SUPER_ADMIN);
export const CanCreateCampaign = () => Permissions(Permission.CREATE_CAMPAIGN);
export const CanManageUsers = () => Permissions(Permission.CREATE_USER, Permission.EDIT_USER);
```

#### Week 9-10: API Endpoint Restructuring

##### 2.3 Portal-Specific Controllers
**New File: `/backend/src/modules/brand-portal/brand.controller.ts`**

```typescript
@Controller('api/v1/brand')
@UseGuards(RoleGuard)
@BrandPortalOnly()
export class BrandController {
  
  @Post('campaigns')
  @CanCreateCampaign()
  async createCampaign(@Body() campaignData: CreateCampaignDto, @Req() req) {
    // Validate user can create campaign for their organization
    return this.campaignService.create(campaignData, req.user);
  }
  
  @Put('campaigns/:id/approve')
  @Roles(EurekaRole.VALIDATOR_APPROVER, EurekaRole.MARKETING_HEAD)
  async approveCampaign(@Param('id') id: string, @Req() req) {
    return this.campaignService.approve(id, req.user);
  }
  
  @Post('budget/upload')
  @Permissions(Permission.UPLOAD_FUNDS)
  async uploadFunds(@Body() fundData: UploadFundsDto, @Req() req) {
    return this.financeService.uploadFunds(fundData, req.user);
  }
}
```

##### 2.4 Workflow Engine Implementation
**New File: `/backend/src/services/workflow.service.ts`**

```typescript
@Injectable()
export class WorkflowService {
  
  async initiateCampaignApproval(campaignId: string, initiatorId: string) {
    const workflow = {
      entityId: campaignId,
      entityType: 'campaign',
      currentStep: 'validator_review',
      steps: [
        { step: 'validator_review', requiredRole: EurekaRole.VALIDATOR_APPROVER, status: 'pending' },
        { step: 'final_approval', requiredRole: EurekaRole.MARKETING_HEAD, status: 'waiting' }
      ],
      initiatedBy: initiatorId,
      createdAt: new Date()
    };
    
    return this.workflowModel.create(workflow);
  }
  
  async approveStep(workflowId: string, approverId: string, decision: 'approve' | 'reject', comments?: string) {
    const workflow = await this.workflowModel.findById(workflowId);
    
    // Validate approver has correct role
    const approver = await this.userModel.findById(approverId);
    const currentStep = workflow.steps.find(s => s.step === workflow.currentStep);
    
    if (!ROLE_PERMISSIONS[approver.role].includes(Permission.APPROVE_CAMPAIGN)) {
      throw new ForbiddenException('User cannot approve this workflow step');
    }
    
    // Update workflow state
    currentStep.status = decision;
    currentStep.approvedBy = approverId;
    currentStep.approvedAt = new Date();
    currentStep.comments = comments;
    
    if (decision === 'approve') {
      // Move to next step or complete
      const nextStepIndex = workflow.steps.findIndex(s => s.step === workflow.currentStep) + 1;
      if (nextStepIndex < workflow.steps.length) {
        workflow.currentStep = workflow.steps[nextStepIndex].step;
        workflow.steps[nextStepIndex].status = 'pending';
      } else {
        workflow.status = 'completed';
        // Execute final approval logic (e.g., activate campaign)
        await this.campaignService.activate(workflow.entityId);
      }
    } else {
      workflow.status = 'rejected';
      // Execute rejection logic
      await this.campaignService.reject(workflow.entityId, comments);
    }
    
    return workflow.save();
  }
}
```

### Phase 3: Frontend Implementation (Weeks 13-18)

#### Week 13-14: Portal Routing & Layout

##### 3.1 Portal-based Routing
**New File: `/app/portals/layout.tsx`**

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Portal } from '@/lib/schema-types';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Determine required portal based on path
    let requiredPortal: Portal | null = null;
    if (pathname.startsWith('/portals/brand')) requiredPortal = Portal.E1_BRAND;
    else if (pathname.startsWith('/portals/exchange')) requiredPortal = Portal.E2_EXCHANGE;
    else if (pathname.startsWith('/portals/publisher')) requiredPortal = Portal.E3_PUBLISHER;
    
    // Check portal access
    if (requiredPortal && !session.user.portalAccess?.includes(requiredPortal)) {
      router.push('/access-denied');
      return;
    }
    
    // Redirect to appropriate default portal if on base portals path
    if (pathname === '/portals') {
      const defaultPortal = session.user.portalAccess?.[0];
      switch (defaultPortal) {
        case Portal.E1_BRAND:
          router.push('/portals/brand/dashboard');
          break;
        case Portal.E2_EXCHANGE:
          router.push('/portals/exchange/dashboard');
          break;
        case Portal.E3_PUBLISHER:
          router.push('/portals/publisher/dashboard');
          break;
        default:
          router.push('/access-denied');
      }
    }
  }, [session, status, pathname, router]);
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return null;
  }
  
  return (
    <div className="portal-layout">
      <PortalNavigation />
      <main className="portal-content">
        {children}
      </main>
    </div>
  );
}
```

##### 3.2 Portal-Specific Navigation
**New File: `/components/portal-navigation.tsx`**

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Portal, EurekaRole, Permission } from '@/lib/schema-types';

export function PortalNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const currentPortal = getCurrentPortal(pathname);
  const userRole = session?.user?.role as EurekaRole;
  const userPermissions = session?.user?.permissions as Permission[];
  
  const getNavigationItems = () => {
    switch (currentPortal) {
      case Portal.E1_BRAND:
        return getBrandNavigationItems(userRole, userPermissions);
      case Portal.E2_EXCHANGE:
        return getExchangeNavigationItems(userRole, userPermissions);
      case Portal.E3_PUBLISHER:
        return getPublisherNavigationItems(userRole, userPermissions);
      default:
        return [];
    }
  };
  
  const navigationItems = getNavigationItems();
  
  return (
    <nav className="portal-navigation">
      <div className="portal-selector">
        <PortalSwitcher currentPortal={currentPortal} />
      </div>
      
      <ul className="nav-items">
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link 
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function getBrandNavigationItems(role: EurekaRole, permissions: Permission[]) {
  const items = [
    { href: '/portals/brand/dashboard', label: 'Dashboard' }
  ];
  
  if (permissions.includes(Permission.CREATE_CAMPAIGN)) {
    items.push({ href: '/portals/brand/campaigns', label: 'Campaigns' });
  }
  
  if (permissions.includes(Permission.VIEW_ANALYTICS)) {
    items.push({ href: '/portals/brand/analytics', label: 'Analytics' });
  }
  
  if (permissions.includes(Permission.UPLOAD_FUNDS)) {
    items.push({ href: '/portals/brand/finance', label: 'Finance' });
  }
  
  // Role-specific items
  switch (role) {
    case EurekaRole.MARKETING_HEAD:
      items.push({ href: '/portals/brand/organization', label: 'Organization' });
      items.push({ href: '/portals/brand/team', label: 'Team Management' });
      break;
    case EurekaRole.VALIDATOR_APPROVER:
      items.push({ href: '/portals/brand/approvals', label: 'Approvals' });
      break;
    case EurekaRole.SALES_REPRESENTATIVE:
      items.push({ href: '/portals/brand/crm', label: 'CRM' });
      break;
  }
  
  return items;
}
```

#### Week 15-16: Role-Specific UI Components

##### 3.3 Permission-Based Components
**New File: `/components/auth/permission-gate.tsx`**

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { EurekaRole, Permission, Portal } from '@/lib/schema-types';
import { PermissionChecker } from '@/lib/role-permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: EurekaRole | EurekaRole[];
  requiredPermission?: Permission | Permission[];
  requiredPortal?: Portal;
}

export function PermissionGate({ 
  children, 
  fallback = null, 
  requiredRole, 
  requiredPermission, 
  requiredPortal 
}: PermissionGateProps) {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return <>{fallback}</>;
  }
  
  const userRole = session.user.role as EurekaRole;
  const userPermissions = session.user.permissions as Permission[];
  const userPortalAccess = session.user.portalAccess as Portal[];
  
  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) {
      return <>{fallback}</>;
    }
  }
  
  // Check permission requirement
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    if (!permissions.every(p => userPermissions.includes(p))) {
      return <>{fallback}</>;
    }
  }
  
  // Check portal access
  if (requiredPortal && !userPortalAccess.includes(requiredPortal)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Convenience components
export const SuperAdminOnly = ({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) => (
  <PermissionGate requiredRole={EurekaRole.SUPER_ADMIN} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanCreateCampaign = ({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) => (
  <PermissionGate requiredPermission={Permission.CREATE_CAMPAIGN} fallback={fallback}>
    {children}
  </PermissionGate>
);
```

##### 3.4 Role-Based Dashboard Components
**New File: `/app/portals/brand/dashboard/page.tsx`**

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { EurekaRole } from '@/lib/schema-types';
import { PermissionGate } from '@/components/auth/permission-gate';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { CampaignMetrics } from '@/components/campaigns/campaign-metrics';
import { FinancialOverview } from '@/components/finance/financial-overview';
import { TeamActivity } from '@/components/team/team-activity';
import { ApprovalQueue } from '@/components/workflow/approval-queue';

export default function BrandDashboard() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as EurekaRole;
  
  return (
    <div className="dashboard-grid">
      {/* Common metrics for all brand roles */}
      <DashboardCard title="Campaign Performance">
        <CampaignMetrics />
      </DashboardCard>
      
      {/* Role-specific content */}
      <PermissionGate requiredRole={EurekaRole.MARKETING_HEAD}>
        <DashboardCard title="Financial Overview">
          <FinancialOverview />
        </DashboardCard>
        <DashboardCard title="Team Activity">
          <TeamActivity />
        </DashboardCard>
      </PermissionGate>
      
      <PermissionGate requiredRole={EurekaRole.VALIDATOR_APPROVER}>
        <DashboardCard title="Pending Approvals">
          <ApprovalQueue />
        </DashboardCard>
      </PermissionGate>
      
      <PermissionGate requiredRole={EurekaRole.FINANCE_MANAGER}>
        <DashboardCard title="Budget Management">
          <BudgetManagement />
        </DashboardCard>
      </PermissionGate>
      
      {/* Support roles get ticket overview */}
      <PermissionGate requiredRole={[EurekaRole.SUPPORT_1_BRAND, EurekaRole.SUPPORT_2_BRAND]}>
        <DashboardCard title="Support Tickets">
          <SupportTicketsOverview />
        </DashboardCard>
      </PermissionGate>
    </div>
  );
}
```

### Phase 4: Advanced Features (Weeks 19-22)

#### Week 19-20: Organization & Team Management

##### 4.1 Organization Management Service
**New File: `/backend/src/modules/organization/organization.service.ts`**

```typescript
@Injectable()
export class OrganizationService {
  
  @Permissions(Permission.CREATE_ORGANIZATION)
  async createOrganization(orgData: CreateOrganizationDto, creatorId: string) {
    // Validate creator has permission
    const creator = await this.userService.findById(creatorId);
    
    const organization = new this.organizationModel({
      ...orgData,
      createdBy: creatorId,
      members: [creatorId] // Creator is automatically a member
    });
    
    await organization.save();
    
    // Update creator's organizationId
    await this.userService.updateUser(creatorId, { organizationId: organization._id });
    
    return organization;
  }
  
  @Permissions(Permission.ASSIGN_ROLES)
  async addMemberToOrganization(orgId: string, userId: string, role: EurekaRole, addedBy: string) {
    // Validate permissions and hierarchy
    const adder = await this.userService.findById(addedBy);
    const targetUser = await this.userService.findById(userId);
    
    if (!PermissionChecker.canApprove(adder.role, role)) {
      throw new ForbiddenException('Cannot assign higher or equal level role');
    }
    
    // Add user to organization
    await this.organizationModel.findByIdAndUpdate(
      orgId,
      { $addToSet: { members: userId } }
    );
    
    // Update user's role and organization
    await this.userService.updateUser(userId, {
      organizationId: orgId,
      role: role
    });
    
    // Log the action
    await this.auditService.log({
      action: 'ROLE_ASSIGNED',
      performedBy: addedBy,
      targetUser: userId,
      details: { newRole: role, organization: orgId }
    });
    
    return { success: true };
  }
  
  async setBudgetLimits(orgId: string, budgetLimits: BudgetLimitsDto, setBy: string) {
    const setter = await this.userService.findById(setBy);
    
    if (!setter.permissions.includes(Permission.SET_BUDGET_LIMITS)) {
      throw new ForbiddenException('Insufficient permissions to set budget limits');
    }
    
    return this.organizationModel.findByIdAndUpdate(
      orgId,
      { budgetLimits },
      { new: true }
    );
  }
}
```

##### 4.2 Budget Control System
**New File: `/backend/src/services/budget.service.ts`**

```typescript
@Injectable()
export class BudgetService {
  
  async checkBudgetAvailability(
    userId: string, 
    amount: number, 
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
    
    const user = await this.userService.findById(userId);
    const organization = await this.organizationService.findById(user.organizationId);
    
    // Check user-level limits first
    if (user.budgetLimits) {
      const userLimit = user.budgetLimits[period];
      const userSpent = await this.getSpentAmount(userId, period);
      
      if (userSpent + amount > userLimit) {
        return {
          allowed: false,
          remaining: userLimit - userSpent,
          reason: `User ${period} budget limit exceeded`
        };
      }
    }
    
    // Check organization-level limits
    if (organization) {
      const orgLimit = organization.budgetLimits[period];
      const orgSpent = await this.getOrganizationSpentAmount(organization._id, period);
      
      if (orgSpent + amount > orgLimit) {
        return {
          allowed: false,
          remaining: orgLimit - orgSpent,
          reason: `Organization ${period} budget limit exceeded`
        };
      }
    }
    
    return { allowed: true, remaining: 0 };
  }
  
  async requestBudgetIncrease(
    userId: string, 
    requestedAmount: number, 
    justification: string
  ) {
    const user = await this.userService.findById(userId);
    
    // Create workflow for budget increase approval
    const workflow = await this.workflowService.create({
      type: 'budget_increase',
      initiatedBy: userId,
      data: {
        currentLimit: user.budgetLimits?.daily || 0,
        requestedLimit: requestedAmount,
        justification
      },
      approvers: await this.getApproversForBudgetIncrease(user.organizationId)
    });
    
    // Notify approvers
    await this.notificationService.notifyApprovers(workflow);
    
    return workflow;
  }
}
```

#### Week 21-22: Audit System & Compliance

##### 4.3 Audit Logging System
**New File: `/backend/src/services/audit.service.ts`**

```typescript
@Injectable()
export class AuditService {
  
  async log(auditData: {
    action: string;
    performedBy: string;
    targetUser?: string;
    targetEntity?: string;
    entityType?: 'campaign' | 'user' | 'organization';
    portal: Portal;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const auditLog = new this.auditLogModel({
      ...auditData,
      timestamp: new Date()
    });
    
    await auditLog.save();
    
    // Check for suspicious patterns
    await this.checkForAnomalies(auditData);
    
    return auditLog;
  }
  
  async checkForAnomalies(auditData: any) {
    // Check for rapid successive actions
    const recentActions = await this.auditLogModel
      .find({
        performedBy: auditData.performedBy,
        action: auditData.action,
        timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
      })
      .countDocuments();
    
    if (recentActions > 10) {
      // Potential suspicious activity
      await this.securityService.flagUser(auditData.performedBy, 'RAPID_ACTIONS');
    }
    
    // Check for privilege escalation
    if (auditData.action === 'ROLE_ASSIGNED') {
      await this.checkPrivilegeEscalation(auditData);
    }
  }
  
  async getAuditTrail(filters: {
    userId?: string;
    entityId?: string;
    action?: string;
    portal?: Portal;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const query: any = {};
    
    if (filters.userId) query.performedBy = filters.userId;
    if (filters.entityId) query.targetEntity = filters.entityId;
    if (filters.action) query.action = filters.action;
    if (filters.portal) query.portal = filters.portal;
    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {};
      if (filters.dateFrom) query.timestamp.$gte = filters.dateFrom;
      if (filters.dateTo) query.timestamp.$lte = filters.dateTo;
    }
    
    return this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email role')
      .limit(1000);
  }
}
```

### Phase 5: Testing & Deployment (Weeks 23-24)

#### Week 23: Testing Framework

##### 5.1 Role-Based Testing Suite
**New File: `/backend/test/role-permissions.e2e-spec.ts`**

```typescript
describe('Role-Based Access Control (E2E)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  describe('Campaign Creation Permissions', () => {
    it('should allow Marketing Head to create campaigns', async () => {
      const marketingHeadToken = await getAuthToken(EurekaRole.MARKETING_HEAD);
      
      return request(app.getHttpServer())
        .post('/api/v1/brand/campaigns')
        .set('Authorization', `Bearer ${marketingHeadToken}`)
        .send(mockCampaignData)
        .expect(201);
    });
    
    it('should deny Finance Manager from creating campaigns', async () => {
      const financeManagerToken = await getAuthToken(EurekaRole.FINANCE_MANAGER);
      
      return request(app.getHttpServer())
        .post('/api/v1/brand/campaigns')
        .set('Authorization', `Bearer ${financeManagerToken}`)
        .send(mockCampaignData)
        .expect(403);
    });
  });
  
  describe('Cross-Portal Access', () => {
    it('should deny Brand portal user access to Exchange portal endpoints', async () => {
      const campaignManagerToken = await getAuthToken(EurekaRole.CAMPAIGN_MANAGER);
      
      return request(app.getHttpServer())
        .get('/api/v1/exchange/campaigns')
        .set('Authorization', `Bearer ${campaignManagerToken}`)
        .expect(403);
    });
  });
  
  describe('Approval Workflow', () => {
    it('should properly route campaign approvals through hierarchy', async () => {
      // Create campaign as Campaign Manager
      const cmToken = await getAuthToken(EurekaRole.CAMPAIGN_MANAGER);
      const campaign = await createTestCampaign(cmToken);
      
      // Validate can't self-approve
      await request(app.getHttpServer())
        .put(`/api/v1/brand/campaigns/${campaign.id}/approve`)
        .set('Authorization', `Bearer ${cmToken}`)
        .expect(403);
      
      // Approve as Validator
      const validatorToken = await getAuthToken(EurekaRole.VALIDATOR_APPROVER);
      await request(app.getHttpServer())
        .put(`/api/v1/brand/campaigns/${campaign.id}/approve`)
        .set('Authorization', `Bearer ${validatorToken}`)
        .send({ decision: 'approve', comments: 'Test approval' })
        .expect(200);
      
      // Verify campaign status updated
      const updatedCampaign = await getCampaign(campaign.id);
      expect(updatedCampaign.workflowStatus).toBe('pending_final_approval');
    });
  });
});
```

#### Week 24: Production Deployment

##### 5.2 Production Migration Strategy
**New File: `/scripts/production-migration.sh`**

```bash
#!/bin/bash

echo "Starting Eureka Roles Production Migration..."

# Step 1: Backup current database
echo "Creating database backup..."
mongodump --uri="$MONGODB_URI" --out="./backup/$(date +%Y%m%d_%H%M%S)"

# Step 2: Deploy new schema with feature flags
echo "Deploying new schemas..."
npm run build
npm run deploy:staging

# Step 3: Run migration scripts
echo "Running user role migration..."
node scripts/migrate-user-roles.js

# Step 4: Validate data integrity
echo "Validating migration..."
node scripts/validate-migration.js

# Step 5: Enable new role system gradually
echo "Enabling role-based features..."
# Start with Super Admin only
node scripts/enable-features.js --role=super_admin

# Wait for validation
read -p "Validate Super Admin access, then press enter to continue..."

# Enable for other roles gradually
node scripts/enable-features.js --role=marketing_head,admin_brand
read -p "Validate admin access, then press enter to continue..."

node scripts/enable-features.js --role=all

echo "Migration complete! Monitoring system for 24 hours..."
```

## Success Criteria & Monitoring

### Technical Metrics
1. **Response Time**: <100ms additional latency for role checks
2. **Uptime**: 99.9% during migration and post-deployment
3. **Data Integrity**: Zero data loss, 100% successful role mapping
4. **Permission Coverage**: All 18 roles properly configured with correct permissions

### Business Metrics
1. **User Adoption**: 90% of users successfully using new portal system within 30 days
2. **Efficiency**: 40% reduction in cross-role task confusion
3. **Security**: Zero unauthorized access incidents
4. **Support**: 30% reduction in role-related support tickets

### Rollback Plan
1. **Feature Flags**: Instant disable of new role system
2. **Database Rollback**: Restore from pre-migration backup
3. **Code Rollback**: Revert to previous stable version
4. **User Communication**: Automated notifications about system changes

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Foundation | 6 weeks | Enhanced schemas, role mapping, auth system |
| Backend | 6 weeks | NestJS guards, API restructuring, workflow engine |
| Frontend | 6 weeks | Portal routing, role-based UI, permission gates |
| Advanced | 4 weeks | Organization management, budget controls, audit |
| Deployment | 2 weeks | Testing, migration, production rollout |
| **Total** | **24 weeks** | Complete Eureka role system integration |

---

*Implementation Plan prepared on: July 22, 2025*  
*Ready for development team assignment and project kickoff*
