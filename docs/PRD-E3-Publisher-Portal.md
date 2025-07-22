# Product Requirements Document: E3 Publisher Portal

## Executive Summary

The E3 Publisher Portal (publishers.gametriggers.com) is a comprehensive platform designed for streamers, content creators, agencies, and artist management companies. This portal enables publishers to participate in campaigns, manage their streaming integrations, and optimize their revenue through the Gametriggers ecosystem.

## Project Overview

**Product Name**: Gametriggers E3 Publisher Portal  
**Version**: 1.0  
**Target Release**: Q2 2025  
**Development Timeline**: 12 weeks  
**Portal URL**: publishers.gametriggers.com

### Vision Statement
To empower content creators and their management teams with the most comprehensive and user-friendly platform for monetizing their streaming content through intelligent, non-intrusive advertising campaigns.

### Success Metrics
- 1000+ active publishers by end of year 1
- 500+ agencies/management companies onboarded
- $75K+ in monthly payouts to publishers
- 90%+ publisher satisfaction rating
- <5 minutes overlay setup time

## Architecture Overview

### Technology Stack

**Frontend:**
- Framework: Next.js 15 with App Router
- Authentication: NextAuth.js v5 with OAuth integrations
- Styling: Tailwind CSS + shadcn/ui
- State Management: Zustand
- Real-time Features: WebSockets for live overlay updates
- Media Handling: React Player for video preview
- HTTP Client: Axios
- Forms: React Hook Form + Zod

**Backend Services (Microservices):**
- Publisher Service (NestJS 10) - Publisher management
- Participation Service (NestJS 10) - Campaign participation
- Overlay Service (NestJS 10) - Overlay generation and delivery
- Wallet Service (NestJS 10) - Earnings and payouts
- Analytics Service (NestJS 10) - Performance analytics
- Organization Service (NestJS 10) - Agency management
- Upload Service (NestJS 10) - Content and media uploads

**Database:**
- MongoDB: Publisher profiles and campaign data
- PostgreSQL: Financial transactions and analytics
- Redis: Real-time overlay data and session management

**External Integrations:**
- Twitch API: Channel verification and stream data
- YouTube API: Channel verification and analytics
- OBS WebSocket: Real-time overlay control
- Streamlabs API: Widget integration
- PayPal/Stripe: Payout processing

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               E3 Publisher Portal                           │
│                 (Next.js 15)                                │
├─────────────────────────────────────────────────────────────┤
│ Dashboard | Campaigns | Overlay | Analytics | Earnings |    │
│ Settings | Agency (for managers)                            │
└───────────────────────────────────f──────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │  API Gateway  │
                    │ (Publisher)   │
                    └───────┬───────┘
                            │
    ┌───────┬───────┬───────┼───────┬───────┬───────┬───────┐
    │       │       │       │       │       │       │       │
┌───▼───┐ ┌─▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐ ┌─▼──┐
│Publish│ │Part│ │Over.│ │Wall│ │Anal.│ │Org. │ │Upld.│ │Auth│
│Service│ │Serv│ │Serv.│ │Serv│ │Serv.│ │Serv.│ │Serv.│ │Serv│
└───────┘ └────┘ └─────┘ └────┘ └─────┘ └─────┘ └─────┘ └────┘
    │       │       │       │       │       │       │       │
    │       │       │       │       │       │       │       │
┌───▼───────▼───────▼───────▼───────▼───────▼───────▼───────▼───┐
│                      MongoDB + PostgreSQL                    │
└───────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control

### Publisher Roles

| Role | Level | Key Responsibilities | Primary Use Cases |
|------|-------|---------------------|-------------------|
| **Artiste Manager** | 6 | Recruit publishers, manage teams, coordinate campaigns | Agency operations, multi-publisher management |
| **Streamer (Individual)** | 3 | Campaign participation, content creation, overlay management | Individual streaming, campaign execution |
| **Independent Publisher** | 3 | Self-managed operations, direct platform integration | Solo content creators, self-management |
| **Liaison Manager** | 4 | Support artiste managers, handle disputes, assist onboarding | Publisher relations, conflict resolution |
| **Support 1 (Publisher)** | 1 | Basic publisher support, navigation help | Common questions, basic troubleshooting |
| **Support 2 (Publisher)** | 2 | Advanced technical support, cross-team coordination | Complex issues, technical problems |

### Permission Matrix

| Feature | Artiste Manager | Streamer | Independent | Liaison Manager | Support 1 | Support 2 |
|---------|----------------|----------|-------------|-----------------|-----------|-----------|
| Recruit Publishers | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage Agency | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Campaign Participation | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Overlay Configuration | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Earnings Management | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Payout Requests | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics Access | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Publisher Support | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Dispute Resolution | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |

## Functional Requirements

### Core Features

#### 1. Publisher Onboarding & Profile Management
**User Story**: As a new publisher, I want to easily set up my profile and connect my streaming platforms.

**Acceptance Criteria**:
- Multi-platform registration (Twitch, YouTube, Facebook Gaming)
- OAuth integration for platform verification
- Profile completion wizard with progress tracking
- Channel analytics import and verification
- Content category and audience demographics setup
- Monetization preferences configuration

**Endpoints**:
- `POST /api/v1/publishers/register` - Register new publisher
- `GET /api/v1/publishers/profile` - Get publisher profile
- `PUT /api/v1/publishers/profile` - Update profile
- `POST /api/v1/publishers/platforms/connect` - Connect streaming platform
- `GET /api/v1/publishers/platforms/verify` - Verify platform connection

#### 2. Agency Management (Artiste Manager)
**User Story**: As an Artiste Manager, I want to recruit and manage multiple publishers under my agency.

**Acceptance Criteria**:
- Publisher recruitment and invitation system
- Multi-publisher dashboard with performance overview
- Commission structure setup and management
- Bulk campaign participation management
- Publisher performance comparison tools
- Automated reporting and analytics

**Endpoints**:
- `POST /api/v1/agencies/invite` - Invite publisher to agency
- `GET /api/v1/agencies/publishers` - List agency publishers
- `PUT /api/v1/agencies/publishers/:id/commission` - Set commission rates
- `GET /api/v1/agencies/performance` - Agency performance analytics

#### 3. Campaign Discovery & Participation
**User Story**: As a publisher, I want to discover and participate in relevant campaigns.

**Acceptance Criteria**:
- Intelligent campaign recommendations based on audience
- Advanced filtering options (category, payout, duration)
- Campaign details with requirements and expectations
- One-click campaign acceptance/rejection
- Batch operations for multiple campaigns
- Campaign scheduling and calendar integration

**Endpoints**:
- `GET /api/v1/campaigns/available` - Get available campaigns
- `GET /api/v1/campaigns/recommendations` - Get personalized recommendations
- `POST /api/v1/campaigns/:id/participate` - Join campaign
- `DELETE /api/v1/campaigns/:id/leave` - Leave campaign
- `GET /api/v1/campaigns/calendar` - Get campaign calendar

#### 4. Overlay Management System
**User Story**: As a publisher, I want to customize and control my stream overlays.

**Acceptance Criteria**:
- Drag-and-drop overlay designer
- Real-time preview with stream simulation
- Multiple overlay templates and themes
- Position, size, and animation customization
- OBS/Streamlabs integration with automatic setup
- A/B testing for different overlay configurations

**Endpoints**:
- `GET /api/v1/overlays/templates` - Get overlay templates
- `POST /api/v1/overlays` - Create custom overlay
- `PUT /api/v1/overlays/:id` - Update overlay configuration
- `POST /api/v1/overlays/:id/preview` - Generate preview
- `POST /api/v1/overlays/:id/deploy` - Deploy to OBS/Streamlabs

#### 5. Earnings & Payout Management
**User Story**: As a publisher, I want to track my earnings and request payouts.

**Acceptance Criteria**:
- Real-time earnings dashboard with detailed breakdowns
- Historical earnings data with trend analysis
- Multiple payout methods (PayPal, bank transfer, cryptocurrency)
- Automated payout scheduling
- Tax document generation and management
- Commission tracking for agency-managed publishers

**Endpoints**:
- `GET /api/v1/wallet/earnings` - Get earnings summary
- `GET /api/v1/wallet/transactions` - Get transaction history
- `POST /api/v1/wallet/payout-request` - Request payout
- `GET /api/v1/wallet/payout-methods` - Get payout methods
- `POST /api/v1/wallet/payout-methods` - Add payout method

#### 6. Performance Analytics
**User Story**: As a publisher, I want detailed analytics to optimize my performance.

**Acceptance Criteria**:
- Campaign performance metrics (impressions, clicks, engagement)
- Audience analytics and demographics
- Revenue optimization recommendations
- Comparative performance analysis
- Custom reporting and data export
- Real-time performance monitoring

**Endpoints**:
- `GET /api/v1/analytics/performance` - Get performance metrics
- `GET /api/v1/analytics/campaigns/:id` - Get campaign analytics
- `GET /api/v1/analytics/audience` - Get audience insights
- `POST /api/v1/analytics/reports` - Generate custom report

### Advanced Features

#### 7. Content Management
- Upload and manage promotional content
- Content scheduling and automation
- Brand safety and compliance tools
- Content performance tracking
- Collaborative content creation tools

#### 8. Community Features
- Publisher community forum
- Best practices sharing
- Peer-to-peer learning
- Success stories and case studies
- Networking opportunities

#### 9. Advanced Integrations
- Stream management tools integration
- Social media cross-posting
- Analytics tools integration
- CRM system connections
- Third-party monetization platforms

## User Interface Requirements

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Navigation | Earnings | Notifications      │
├─────────────────────────────────────────────────────────────┤
│  Sidebar: Dashboard | Campaigns | Overlay | Analytics |     │
│           Earnings | Settings | Agency (if manager)        │
├─────────────────────────────────────────────────────────────┤
│  Main Content Area:                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Today's     │ │ Active      │ │ This Month  │           │
│  │ Earnings    │ │ Campaigns   │ │ Performance │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  Live Campaigns Status                                      │
│  Performance Charts                                         │
│  Quick Actions Panel                                        │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Components
1. **Campaign Browser**: Card-based layout with filtering and sorting
2. **Overlay Designer**: Visual drag-and-drop interface
3. **Earnings Dashboard**: Interactive charts and breakdown tables
4. **Agency Management**: Multi-publisher overview with performance comparison
5. **Analytics Dashboard**: Customizable charts and metrics
6. **Profile Setup**: Step-by-step onboarding wizard

## Technical Requirements

### Performance
- Dashboard load time < 2 seconds
- Overlay rendering < 500ms
- Real-time updates < 100ms latency
- Campaign matching < 1 second
- Payout processing < 24 hours

### Security
- OAuth 2.0 integration with streaming platforms
- Role-based access control (RBAC)
- Encrypted financial data storage
- Secure API endpoints with rate limiting
- PCI compliance for payment processing
- GDPR compliance for EU publishers

### Integration Requirements
- Twitch API for channel verification and metrics
- YouTube API for channel data and analytics
- OBS WebSocket for real-time overlay control
- Streamlabs API for widget integration
- PayPal/Stripe for international payouts
- Social media APIs for cross-platform analytics

## API Specification

### Core Endpoints

#### Publisher Management
```typescript
// Register Publisher
POST /api/v1/publishers/register
{
  email: string;
  username: string;
  platforms: Array<{
    type: 'twitch' | 'youtube' | 'facebook';
    channelId: string;
    accessToken: string;
  }>;
  preferences: {
    categories: string[];
    minimumPayout: number;
    maxCampaignsPerDay: number;
  };
}

// Response
{
  publisherId: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationSteps: Array<{
    step: string;
    status: 'pending' | 'completed';
    requirements: string[];
  }>;
}
```

#### Campaign Participation
```typescript
// Get Available Campaigns
GET /api/v1/campaigns/available?category=gaming&minPayout=10

// Response
{
  campaigns: Array<{
    id: string;
    title: string;
    brand: string;
    category: string;
    targeting: {
      demographics: object;
      platforms: string[];
      minFollowers: number;
    };
    payout: {
      type: 'cpm' | 'flat' | 'performance';
      amount: number;
      currency: string;
    };
    requirements: string[];
    duration: {
      start: Date;
      end: Date;
      minHours: number;
    };
    matchScore: number;
  }>;
  totalCount: number;
  hasMore: boolean;
}
```

#### Overlay Configuration
```typescript
// Create Overlay
POST /api/v1/overlays
{
  name: string;
  template: string;
  configuration: {
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    styling: {
      theme: string;
      colors: object;
      animations: string[];
    };
    behavior: {
      displayDuration: number;
      frequency: number;
      triggers: string[];
    };
  };
  platforms: string[];
}

// Response
{
  overlayId: string;
  previewUrl: string;
  integrationCode: string;
  obsSetupInstructions: string;
}
```

#### Analytics
```typescript
// Get Performance Analytics
GET /api/v1/analytics/performance?period=30d&campaigns=campaign1,campaign2

// Response
{
  summary: {
    totalEarnings: number;
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averageECPM: number;
  };
  campaigns: Array<{
    campaignId: string;
    campaignName: string;
    impressions: number;
    clicks: number;
    earnings: number;
    ctr: number;
    ecpm: number;
  }>;
  timeline: Array<{
    date: Date;
    impressions: number;
    clicks: number;
    earnings: number;
  }>;
  demographics: {
    ageGroups: object;
    genders: object;
    locations: object;
  };
}
```

## Database Schema

### Publishers Collection
```typescript
{
  _id: ObjectId;
  email: string;
  username: string;
  status: 'pending' | 'active' | 'suspended';
  role: 'streamer' | 'independent' | 'artiste_manager';
  profile: {
    displayName: string;
    avatar: string;
    bio: string;
    location: string;
    languages: string[];
  };
  platforms: Array<{
    type: 'twitch' | 'youtube' | 'facebook';
    channelId: string;
    channelName: string;
    followers: number;
    averageViewers: number;
    categories: string[];
    verified: boolean;
    connectedAt: Date;
  }>;
  preferences: {
    categories: string[];
    minimumPayout: number;
    maxCampaignsPerDay: number;
    autoAcceptCampaigns: boolean;
    contentRating: string;
  };
  agency: {
    managerId: ObjectId;
    commissionRate: number;
    joinedAt: Date;
  };
  earnings: {
    totalEarned: number;
    pendingEarnings: number;
    paidOut: number;
    currency: string;
  };
  payoutMethods: Array<{
    type: 'paypal' | 'bank' | 'crypto';
    details: object;
    isDefault: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campaign Participation Collection
```typescript
{
  _id: ObjectId;
  campaignId: ObjectId;
  publisherId: ObjectId;
  status: 'active' | 'completed' | 'cancelled';
  joinedAt: Date;
  completedAt: Date;
  requirements: Array<{
    type: string;
    description: string;
    status: 'pending' | 'completed';
    completedAt: Date;
  }>;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    earnings: number;
  };
  overlayConfiguration: {
    overlayId: ObjectId;
    customizations: object;
    deployedAt: Date;
  };
  payoutStatus: 'pending' | 'processing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Overlay Configurations Collection
```typescript
{
  _id: ObjectId;
  publisherId: ObjectId;
  name: string;
  template: string;
  configuration: {
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    styling: {
      theme: string;
      colors: object;
      fonts: object;
      animations: string[];
    };
    behavior: {
      displayDuration: number;
      frequency: number;
      triggers: string[];
      interactivity: boolean;
    };
  };
  platforms: string[];
  isActive: boolean;
  performanceMetrics: {
    impressions: number;
    clicks: number;
    engagement: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Development Phases

### Phase 1: Foundation (Weeks 1-3)
- Project setup and authentication
- Publisher registration and profile management
- Basic dashboard and navigation
- Platform integrations (Twitch, YouTube)

### Phase 2: Core Features (Weeks 4-6)
- Campaign discovery and participation
- Basic overlay system
- Earnings tracking
- Agency management features

### Phase 3: Advanced Features (Weeks 7-9)
- Advanced overlay designer
- Comprehensive analytics dashboard
- Payout system integration
- Performance optimization tools

### Phase 4: Integration & Testing (Weeks 10-11)
- OBS/Streamlabs integration
- Real-time features implementation
- Comprehensive testing
- Performance optimization

### Phase 5: Deployment & Polish (Week 12)
- Production deployment
- User acceptance testing
- Documentation and training materials
- Launch preparation

## Testing Strategy

### Unit Testing
- Service logic testing with Jest
- React component testing
- API endpoint testing
- Database operation testing

### Integration Testing
- Platform API integration testing
- Overlay system testing
- Payment processing testing
- Real-time features testing

### User Acceptance Testing
- Publisher onboarding flow
- Campaign participation workflow
- Overlay setup and deployment
- Earnings and payout flow

### Performance Testing
- Load testing for high-traffic scenarios
- Overlay rendering performance
- Real-time update latency testing
- Database query optimization

## Success Metrics

### Business Metrics
- Publisher acquisition: 1000+ active publishers
- Revenue generation: $75K+ monthly payouts
- Platform adoption: 80%+ overlay deployment rate
- User satisfaction: 4.5/5 rating
- Retention rate: 85%+ monthly retention

### Technical Metrics
- System uptime: 99.5%
- Overlay load time: <500ms
- Dashboard performance: <2s load time
- API response time: <200ms
- Real-time update latency: <100ms

### User Experience Metrics
- Onboarding completion: 85%+
- Campaign participation rate: 70%+
- Overlay customization usage: 60%+
- Payout request success: 99%+
- Support ticket resolution: <24 hours

---

**Document Version**: 1.0  
**Last Updated**: July 22, 2025  
**Next Review**: August 22, 2025  
**Approved By**: Publisher Success Team  
**Technical Review**: Engineering Team
