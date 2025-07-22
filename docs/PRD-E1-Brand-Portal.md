# Product Requirements Document: E1 Brand Portal

## Executive Summary

The E1 Brand Portal (brands.gametriggers.com) is a comprehensive campaign management platform designed specifically for advertisers, marketing teams, and brand organizations. This portal enables brands to create, manage, and analyze targeted advertising campaigns that are automatically delivered to qualified streamers through the Gametriggers ecosystem.

## Project Overview

**Product Name**: Gametriggers E1 Brand Portal  
**Version**: 1.0  
**Target Release**: Q2 2025  
**Development Timeline**: 12 weeks  
**Portal URL**: brands.gametriggers.com

### Vision Statement
To provide brands with the most intuitive and powerful platform for creating and managing in-stream advertising campaigns, with complete transparency, control, and measurable ROI.

### Success Metrics
- 100+ active brand organizations by end of year 1
- 500+ campaigns created monthly
- $50K+ in campaign budgets managed monthly
- 95%+ campaign approval efficiency
- <3 minutes average campaign creation time

## Architecture Overview

### Technology Stack

**Frontend:**
- Framework: Next.js 15 with App Router
- Authentication: NextAuth.js v5 with role-based access
- Styling: Tailwind CSS + shadcn/ui
- State Management: Zustand
- Forms: React Hook Form + Zod validation
- HTTP Client: Axios with interceptors
- Charts: Recharts or Chart.js
- File Upload: React Dropzone

**Backend Services (Microservices):**
- Brand Service (NestJS 10)
- Campaign Service (NestJS 10)
- Organization Service (NestJS 10)
- Upload Service (NestJS 10)
- Analytics Service (NestJS 10)
- Payment Service (NestJS 10)
- Workflow Service (NestJS 10)
- Auth Service (NestJS 10)

**Database:**
- MongoDB: Primary data storage
- Redis: Session management and caching
- PostgreSQL: Analytics and financial data

**Infrastructure:**
- API Gateway with role-based routing
- Docker containers
- Kubernetes orchestration
- CDN for asset delivery

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 E1 Brand Portal                             │
│                (Next.js 15)                                 │
├─────────────────────────────────────────────────────────────┤
│  Dashboard | Campaigns | Analytics | Settings | Assets      │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │  API Gateway  │
                    │ (Role-based)  │
                    └───────┬───────┘
                            │
    ┌───────┬───────┬───────┼───────┬───────┬───────┬───────┐
    │       │       │       │       │       │       │       │
┌───▼───┐ ┌─▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐ ┌─▼──┐
│ Auth  │ │Brand│ │Camp.│ │Org.│ │Upload│ │Pay.│ │Work.│ │Anal│
│Service│ │Serv.│ │Serv.│ │Serv│ │Serv. │ │Serv│ │Serv.│ │Serv│
└───────┘ └────┘ └─────┘ └────┘ └──────┘ └────┘ └─────┘ └────┘
    │       │       │       │       │       │       │       │
┌───▼───────▼───────▼───────▼───────▼───────▼───────▼───────▼───┐
│                        MongoDB                                │
└───────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control

### Target Roles

| Role | Level | Key Responsibilities | Primary Use Cases |
|------|-------|---------------------|-------------------|
| **Marketing Head** | 8 | Organization management, team creation, budget allocation | Create organization, assign roles, set global budgets |
| **Campaign Manager** | 5 | Campaign creation and management | Build campaigns, configure targeting, monitor performance |
| **Finance Manager** | 4 | Budget and payment management | Upload funds, manage payment methods, control spending |
| **Validator/Approver** | 5 | Campaign review and approval | Review campaigns, ensure compliance, approve for launch |
| **Campaign Consultant** | 4 | Third-party campaign management | Manage campaigns on behalf of clients |
| **Admin (Brand)** | 7 | Account and user management | Manage brand accounts, assign sales reps |
| **Sales Representative** | 3 | Client onboarding and support | Help with onboarding, provide guidance |
| **Support 1 (Brand)** | 1 | Basic support queries | Answer common questions, provide navigation help |
| **Support 2 (Brand)** | 2 | Advanced technical support | Resolve complex issues, coordinate with teams |

### Permission Matrix

| Feature | Marketing Head | Campaign Manager | Finance Manager | Validator | Consultant | Admin | Sales Rep | Support 1 | Support 2 |
|---------|----------------|------------------|-----------------|-----------|------------|-------|-----------|-----------|-----------|
| Create Organization | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Create Campaign | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve Campaign | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Budget | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upload Assets | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Payment Methods | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Functional Requirements

### Core Features

#### 1. Organization Management
**User Story**: As a Marketing Head, I want to create and manage my organization structure.

**Acceptance Criteria**:
- Create organization with company details
- Set up team hierarchy and departments
- Assign roles to team members
- Configure organization-level settings
- Manage organization budget pools

**Endpoints**:
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/:id` - Get organization details
- `PUT /api/v1/organizations/:id` - Update organization
- `POST /api/v1/organizations/:id/members` - Add team members
- `GET /api/v1/organizations/:id/members` - List team members

#### 2. Campaign Management
**User Story**: As a Campaign Manager, I want to create and manage advertising campaigns.

**Acceptance Criteria**:
- Campaign creation wizard with multiple steps
- Targeting configuration (demographics, geography, interests)
- Budget allocation and bidding strategies
- Creative asset upload and management
- Campaign scheduling and duration settings
- Draft/publish workflow

**Endpoints**:
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns` - List campaigns
- `GET /api/v1/campaigns/:id` - Get campaign details
- `PUT /api/v1/campaigns/:id` - Update campaign
- `POST /api/v1/campaigns/:id/publish` - Submit for approval

#### 3. Asset Management
**User Story**: As a Campaign Manager, I want to upload and manage campaign assets.

**Acceptance Criteria**:
- Support for images, videos, and interactive content
- Asset validation (format, size, content guidelines)
- Asset versioning and approval tracking
- Template library for quick campaign creation
- Asset performance analytics

**Endpoints**:
- `POST /api/v1/assets/upload` - Upload asset
- `GET /api/v1/assets` - List assets
- `GET /api/v1/assets/:id` - Get asset details
- `PUT /api/v1/assets/:id` - Update asset metadata
- `DELETE /api/v1/assets/:id` - Delete asset

#### 4. Financial Management
**User Story**: As a Finance Manager, I want to manage budgets and payment methods.

**Acceptance Criteria**:
- Add and manage payment methods (credit cards, bank accounts)
- Set budget limits at organization/team/campaign levels
- Real-time spending tracking and alerts
- Budget approval workflows for large amounts
- Financial reporting and reconciliation

**Endpoints**:
- `POST /api/v1/payments/methods` - Add payment method
- `GET /api/v1/payments/methods` - List payment methods
- `POST /api/v1/budgets` - Create budget allocation
- `GET /api/v1/budgets/spending` - Get spending analytics
- `POST /api/v1/payments/deposit` - Add funds to account

#### 5. Analytics and Reporting
**User Story**: As various brand roles, I want comprehensive campaign analytics.

**Acceptance Criteria**:
- Real-time campaign performance dashboards
- ROI and conversion tracking
- Audience insights and demographics
- Comparative campaign analysis
- Custom report generation and scheduling
- Export capabilities (PDF, CSV, Excel)

**Endpoints**:
- `GET /api/v1/analytics/campaigns/:id` - Campaign analytics
- `GET /api/v1/analytics/overview` - Organization overview
- `GET /api/v1/analytics/reports` - Generate custom reports
- `POST /api/v1/analytics/exports` - Export data

#### 6. Approval Workflows
**User Story**: As a Validator/Approver, I want to review campaigns before they go live.

**Acceptance Criteria**:
- Campaign review queue with filtering options
- Detailed review interface with compliance checks
- Approval/rejection with comments
- Escalation to higher authorities
- Approval history and audit trail

**Endpoints**:
- `GET /api/v1/workflows/pending` - Get pending approvals
- `POST /api/v1/workflows/:id/approve` - Approve campaign
- `POST /api/v1/workflows/:id/reject` - Reject campaign
- `GET /api/v1/workflows/:id/history` - Get approval history

### Advanced Features

#### 7. Team Collaboration
- Real-time collaboration on campaign creation
- Comment system for internal feedback
- Task assignment and tracking
- Notification system for important updates
- Version control for campaign changes

#### 8. Integration Management
- API key management for third-party integrations
- Webhook configuration for external systems
- Data export/import capabilities
- SSO integration setup
- Custom domain configuration

#### 9. Compliance and Security
- GDPR compliance tools
- Data retention policies
- Audit log viewing
- Security settings management
- Two-factor authentication setup

## User Interface Requirements

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Navigation | User Menu | Notifications      │
├─────────────────────────────────────────────────────────────┤
│  Sidebar: Dashboard | Campaigns | Analytics | Assets |      │
│           Finance | Settings | Team                         │
├─────────────────────────────────────────────────────────────┤
│  Main Content Area:                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Active      │ │ Total       │ │ This Month  │           │
│  │ Campaigns   │ │ Spend       │ │ Performance │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  Recent Campaigns Table                                     │
│  Performance Charts                                         │
│  Quick Actions                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Components
1. **Campaign Builder**: Multi-step wizard with progress indicator
2. **Analytics Dashboard**: Interactive charts and metrics
3. **Asset Library**: Grid view with search and filtering
4. **Budget Manager**: Visual budget allocation and spending tracking
5. **Approval Queue**: List view with quick action buttons
6. **Team Management**: Organization chart with role indicators

## Technical Requirements

### Performance
- Page load times < 2 seconds
- API response times < 200ms
- Real-time dashboard updates < 5 seconds
- File upload processing < 30 seconds
- Campaign creation < 3 minutes

### Security
- Role-based access control (RBAC)
- JWT authentication with refresh tokens
- API rate limiting per organization
- Input validation and sanitization
- Encrypted data storage
- Audit logging for all actions

### Scalability
- Support 1000+ concurrent users
- Handle 10,000+ campaigns
- Process 1TB+ asset storage
- Auto-scaling based on usage
- Database optimization for large datasets

## API Specification

### Authentication
```typescript
// JWT Token Structure
interface AuthToken {
  userId: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  exp: number;
}
```

### Core API Endpoints

#### Campaign Management
```typescript
// Create Campaign
POST /api/v1/campaigns
{
  name: string;
  description: string;
  targeting: {
    demographics: object;
    geography: string[];
    interests: string[];
  };
  budget: {
    total: number;
    daily: number;
    bidStrategy: string;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  assets: string[];
}

// Response
{
  id: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Analytics
```typescript
// Get Campaign Analytics
GET /api/v1/analytics/campaigns/:id?period=7d

// Response
{
  campaignId: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    cpm: number;
    ctr: number;
    conversionRate: number;
  };
  timeline: Array<{
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
  }>;
  demographics: object;
}
```

## Database Schema

### Organizations Collection
```typescript
{
  _id: ObjectId;
  name: string;
  domain: string;
  settings: {
    timezone: string;
    currency: string;
    budgetAlerts: boolean;
  };
  billing: {
    paymentMethods: Array<{
      id: string;
      type: 'card' | 'bank';
      last4: string;
      isDefault: boolean;
    }>;
    budgets: Array<{
      type: 'monthly' | 'quarterly' | 'annual';
      amount: number;
      spent: number;
    }>;
  };
  members: Array<{
    userId: ObjectId;
    role: string;
    permissions: string[];
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campaigns Collection
```typescript
{
  _id: ObjectId;
  organizationId: ObjectId;
  createdBy: ObjectId;
  name: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed';
  targeting: {
    demographics: {
      ageRange: [number, number];
      genders: string[];
      interests: string[];
    };
    geography: string[];
    platforms: string[];
  };
  budget: {
    total: number;
    daily: number;
    spent: number;
    bidStrategy: string;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  assets: ObjectId[];
  analytics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  };
  approvals: Array<{
    userId: ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    comments: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Development Phases

### Phase 1: Foundation (Weeks 1-3)
- Project setup and infrastructure
- Authentication and authorization system
- Basic organization management
- User interface framework

### Phase 2: Core Features (Weeks 4-7)
- Campaign creation and management
- Asset upload and management
- Basic analytics dashboard
- Approval workflow system

### Phase 3: Advanced Features (Weeks 8-10)
- Advanced analytics and reporting
- Financial management system
- Team collaboration features
- Integration capabilities

### Phase 4: Polish & Deployment (Weeks 11-12)
- Performance optimization
- Security hardening
- User acceptance testing
- Production deployment

## Testing Strategy

### Unit Testing
- Service layer testing with Jest
- React component testing with React Testing Library
- API endpoint testing
- Database model testing

### Integration Testing
- End-to-end workflow testing
- API integration testing
- Third-party service integration testing
- Database integration testing

### User Acceptance Testing
- Role-based feature testing
- Workflow validation
- Performance testing
- Security testing

## Deployment & Operations

### Environment Setup
- Development: Local development with Docker
- Staging: Kubernetes cluster for testing
- Production: Kubernetes with auto-scaling

### Monitoring & Alerting
- Application performance monitoring (APM)
- Error tracking and logging
- User analytics and behavior tracking
- Infrastructure monitoring

### Security Measures
- Regular security audits
- Penetration testing
- Dependency vulnerability scanning
- Compliance monitoring

## Success Metrics

### Business Metrics
- User adoption rate: 80% of invited users complete onboarding
- Campaign creation rate: 10+ campaigns per organization per month
- Feature utilization: 70% of features used within 30 days
- User satisfaction score: 4.5/5 or higher

### Technical Metrics
- System uptime: 99.5%
- API response time: <200ms average
- Page load time: <2 seconds
- Error rate: <0.1%

### User Experience Metrics
- Time to first campaign: <10 minutes
- Campaign approval time: <24 hours
- Support ticket resolution: <4 hours average
- User retention: 90% monthly retention

---

**Document Version**: 1.0  
**Last Updated**: July 22, 2025  
**Next Review**: August 22, 2025  
**Approved By**: Product Team  
**Technical Review**: Engineering Team
