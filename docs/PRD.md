# Product Requirements Document: Gametriggers Platform

## Executive Summary

Gametriggers is a marketplace platform that connects brands with streamers for automated in-stream sponsorships. The platform enables brands to create targeted advertising campaigns that are automatically delivered to qualified streamers through browser-based overlays during live streams, with real-time analytics and automated payment processing.

## Project Overview

**Product Name**: Gametriggers Platform  
**Version**: 2.0 (Microservices Architecture)  
**Target Release**: Q3 2025  
**Development Timeline**: 26 weeks  

### Vision Statement
To create the world's most efficient and transparent marketplace for in-stream advertising, enabling brands to reach their target audiences while providing streamers with automated, non-intrusive revenue streams.

### Success Metrics
- 1000+ active streamers by end of year 1
- 100+ active brand campaigns by end of year 1
- $100K+ in automated payouts processed monthly
- 95%+ uptime across all services
- <100ms overlay delivery latency

## Architecture Overview

### Microservices Architecture
The platform will be built using a distributed microservices architecture with specialized frontend portals:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Brand Portal  │    │ Streamer Portal │    │  Landing Site   │    │  Admin Portal   │
│    (Next.js)    │    │    (Next.js)    │    │   (Next.js)     │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                    ┌─────────────────┐                  │
                    │   API Gateway   │                  │
                    │   (Express)     │                  │
                    └─────────────────┘                  │
                                 │                       │
    ┌────────────────────────────┼────────────────────────────┬─────────────────┘
    │                            │                            │
┌───▼───┐  ┌─────────┐  ┌───────▼──┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  Auth  │  │ Brand   │  │ Streamer │  │Campaign │  │Analytics│  │  Admin  │
│Service │  │ Service │  │ Service  │  │ Service │  │ Service │  │ Service │
└───────┘  └─────────┘  └──────────┘  └─────────┘  └─────────┘  └─────────┘
    │          │             │            │            │            │
┌───▼───┐  ┌───▼───┐     ┌───▼───┐    ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│Payment│  │Overlay│     │Wallet │    │Upload │    │ Event │    │Audit  │
│Service│  │Service│     │Service│    │Service│    │ Bus   │    │Service│
└───────┘  └───────┘     └───────┘    └───────┘    └───────┘    └───────┘
```

### Technology Stack

**Frontend Applications:**
- Framework: Next.js 15 with App Router
- Authentication: NextAuth.js v5
- Styling: Tailwind CSS + shadcn/ui
- State Management: Zustand
- Forms: React Hook Form + Zod
- HTTP Client: Axios

**Backend Services:**
- Framework: NestJS 10
- Runtime: Node.js 20
- Validation: class-validator
- Databases: MongoDB (primary), PostgreSQL (analytics), Redis (caching)
- Authentication: JWT + Passport
- API Style: REST with GraphQL where needed

## Service Breakdown & Portal Mapping

### 1. Brand Portal (brands.gametriggers.com)
**Served by:**
- Brand Service
- Campaign Service  
- Analytics Service
- Payment Service
- Upload Service

**Core Features:**
- Campaign creation and management
- Brand profile management
- Analytics dashboard
- Payment and billing management
- Asset upload and management

### 2. Streamer Portal (streamers.gametriggers.com)
**Served by:**
- Streamer Service
- Participation Service
- Overlay Service
- Wallet Service
- Analytics Service

**Core Features:**
- Streamer profile and integration setup
- Overlay configuration and testing
- Earnings tracking and payout requests
- Campaign participation history
- Performance analytics

### 3. Landing Site (gametriggers.com)
**Served by:**
- Auth Service (for registration)
- Static content service

**Core Features:**
- Marketing landing pages
- User registration and onboarding
- Platform information and pricing
- Contact and support

### 4. Admin Portal (admin.gametriggers.com)
**Served by:**
- Admin Service
- All backend services (read access)
- Audit Service

**Core Features:**
- Platform monitoring and management
- User and campaign moderation
- System configuration
- Audit logs and compliance

## Detailed Functional Requirements

### User Management & Authentication

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR001 | User Registration | As a new user, I want to register for the platform so I can access brand or streamer features. | System provides separate registration flows for brands and streamers with role-specific data collection. Email verification required. | Auth Service |
| FR002 | OAuth Integration | As a streamer, I want to connect my Twitch/YouTube account so the platform can verify my streaming status. | System integrates with Twitch, YouTube APIs. Stores OAuth tokens securely. Validates streaming eligibility. | Auth Service, Streamer Service |
| FR003 | Role-based Access | As a user, I want to access only the features relevant to my role (brand/streamer/admin). | System enforces role-based permissions. Users can only access their designated portal. Clear role switching if applicable. | Auth Service, API Gateway |
| FR004 | Profile Management | As a user, I want to manage my profile information so I can keep my account updated. | Users can update personal information, contact details, preferences. Validation for required fields. | Brand Service, Streamer Service |

### Brand Campaign Management

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR005 | Campaign Creation | As a brand, I want to create advertising campaigns so I can reach my target audience. | Form-based campaign creation with media upload, targeting options, budget setting. Draft/publish workflow. | Campaign Service, Upload Service |
| FR006 | Media Upload | As a brand, I want to upload campaign assets so they can be displayed to streamers. | Support for images, videos, GIFs. File validation for size, format, content. CDN integration for performance. | Upload Service |
| FR007 | Targeting Configuration | As a brand, I want to set targeting criteria so my ads reach the right streamers. | Options for categories, languages, viewer count, geography. Real-time audience estimation. | Campaign Service |
| FR008 | Budget Management | As a brand, I want to set and track campaign budgets so I can control spending. | Budget allocation, spending tracking, automatic pause when budget exhausted. Alerts for budget thresholds. | Campaign Service, Payment Service |
| FR009 | Campaign Analytics | As a brand, I want to see campaign performance so I can optimize my advertising strategy. | Real-time metrics: impressions, clicks, conversions. Demographic breakdowns. Export capabilities. | Analytics Service |

### Streamer Integration & Overlay

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR010 | Overlay Integration | As a streamer, I want to add the Gametriggers overlay to my stream so I can display ads and earn money. | Browser source URL generation for OBS/Streamlabs. Easy copy-paste integration. Setup validation. | Overlay Service |
| FR011 | Overlay Customization | As a streamer, I want to customize the overlay appearance so it matches my stream aesthetic. | Position, size, opacity, background color options. Real-time preview. Template selection. | Overlay Service |
| FR012 | Campaign Selection | As a streamer, I want control over which campaigns appear on my stream so I can maintain brand alignment. | Campaign filtering options. Blacklist/whitelist functionality. Category preferences. | Participation Service |
| FR013 | Earnings Tracking | As a streamer, I want to track my earnings so I can see how much I'm making from the platform. | Real-time earnings display. Historical data. Breakdown by campaign. Tax reporting features. | Wallet Service, Analytics Service |
| FR014 | Payout Management | As a streamer, I want to request payouts so I can receive my earnings. | Minimum payout thresholds. Multiple payout methods (PayPal, Stripe). Payout history tracking. | Payment Service, Wallet Service |

### Real-time Ad Delivery

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR015 | Automated Ad Serving | As a streamer, I want ads to appear automatically on my overlay so I don't have to manually manage them. | Algorithm-based campaign selection. Rotation strategies. Performance optimization. | Overlay Service, Campaign Service |
| FR016 | Real-time Updates | As a streamer, I want the overlay to update in real-time so viewers see current campaigns. | WebSocket/SSE connections. <100ms latency. Fallback mechanisms. | Overlay Service, Event Bus |
| FR017 | Engagement Tracking | As a brand, I want to track viewer engagement with my ads so I can measure effectiveness. | Click tracking, view duration, interaction rates. Real-time data collection. | Analytics Service |
| FR018 | Conflict Resolution | As a platform, I want to prevent conflicting campaigns from being shown simultaneously. | Business rules engine. Campaign conflict detection. Fair rotation algorithms. | Campaign Service, Participation Service |

### Analytics & Reporting

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR019 | Real-time Dashboard | As a brand/streamer, I want to see real-time performance data so I can make informed decisions. | Live updating dashboards. Key metrics visualization. Responsive design. | Analytics Service |
| FR020 | Historical Reporting | As a user, I want to access historical performance data so I can analyze trends. | Date range selection. Data export options. Comparative analysis tools. | Analytics Service |
| FR021 | Revenue Analytics | As a streamer, I want detailed revenue analytics so I can optimize my earning potential. | Revenue per hour/day/month. Campaign performance comparison. Optimization recommendations. | Analytics Service, Wallet Service |

### Payment Processing

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR022 | Automated Billing | As a brand, I want to be automatically billed for campaign spending so I don't have to manually process payments. | Credit card auto-charging. Invoice generation. Payment failure handling. | Payment Service |
| FR023 | Payout Processing | As a streamer, I want to receive automated payouts so I get paid without delays. | Automated payout scheduling. Multiple payment methods. International support. | Payment Service |
| FR024 | Financial Reporting | As a user, I want access to financial reports so I can track my spending/earnings for tax purposes. | Monthly statements. Tax-ready reports. PDF generation. | Payment Service |

### Admin & Moderation

| ID | Feature | User Story | Acceptance Criteria | Microservice |
|----|---------|------------|---------------------|--------------|
| FR025 | Platform Monitoring | As an admin, I want to monitor platform health so I can ensure optimal performance. | Service health dashboards. Real-time alerts. Performance metrics. | Admin Service |
| FR026 | Content Moderation | As an admin, I want to review and moderate campaign content so I can maintain platform quality standards. | Content approval workflows. Automated screening. Manual review tools. | Admin Service |
| FR027 | User Management | As an admin, I want to manage user accounts so I can handle support requests and policy violations. | User search and management. Account suspension/activation. Support ticket integration. | Admin Service |
| FR028 | Audit Logging | As an admin, I want comprehensive audit logs so I can track all platform activities for compliance. | All user actions logged. Searchable audit interface. Compliance reports. | Audit Service |

## Technical Requirements

### Performance Requirements
- API response times < 200ms (95th percentile)
- Overlay delivery latency < 100ms
- Platform uptime > 99.5%
- Database query performance < 50ms average
- File upload processing < 30 seconds

### Security Requirements
- OAuth 2.0 authentication for all services
- JWT tokens with short expiration times
- API rate limiting and DDoS protection
- Input validation and sanitization
- Encrypted sensitive data storage
- GDPR compliance for EU users

### Scalability Requirements
- Horizontal scaling for all microservices
- Auto-scaling based on traffic patterns
- Database sharding strategies
- CDN integration for static assets
- Message queue for asynchronous processing

### Integration Requirements
- Twitch API integration for streamer verification
- YouTube API integration for platform diversity
- Stripe integration for payment processing
- PayPal integration for international payouts
- OBS/Streamlabs browser source compatibility

## Data Models & Database Strategy

### Service-Specific Database Distribution

**MongoDB Services:**
- Auth Service: User authentication and profiles
- Brand Service: Company information and preferences
- Streamer Service: Creator profiles and integrations
- Campaign Service: Campaign data and targeting rules
- Upload Service: Asset metadata

**PostgreSQL Services:**
- Analytics Service: Time-series data and aggregations
- Payment Service: Financial transactions and compliance
- Admin Service: Audit logs and system operations

**Redis Services:**
- Session storage and caching
- Real-time overlay data
- Message queuing for notifications

### Key Data Relationships
- Users have roles (brand/streamer/admin)
- Brands create campaigns with targeting criteria
- Streamers participate in campaigns through overlay
- Analytics track performance across all entities
- Payments link brands to streamers through campaigns

## Migration Strategy

### Phase 1: Foundation (Weeks 1-8)
- Set up microservices infrastructure
- Implement Auth Service
- Create API Gateway
- Migrate user authentication

### Phase 2: Core Services (Weeks 9-16)
- Implement Brand and Streamer services
- Migrate campaign management
- Set up overlay delivery system

### Phase 3: Advanced Features (Weeks 17-22)
- Implement analytics and reporting
- Add payment processing
- Create admin portal

### Phase 4: Optimization (Weeks 23-26)
- Performance optimization
- Security hardening
- Load testing and scaling

## Success Criteria

### Business Metrics
- User acquisition targets met
- Revenue targets achieved
- Platform adoption rates
- Customer satisfaction scores

### Technical Metrics
- Performance benchmarks met
- Security standards compliance
- Scalability requirements satisfied
- System reliability targets achieved

### User Experience Metrics
- Onboarding completion rates
- Feature adoption rates
- User engagement levels
- Support ticket volumes

## Risk Assessment

### Technical Risks
- Microservices complexity management
- Data consistency across services
- Performance optimization challenges
- Third-party API reliability

### Business Risks
- Market competition
- Platform policy changes (Twitch/YouTube)
- Regulatory compliance requirements
- User acquisition challenges

### Mitigation Strategies
- Comprehensive testing strategies
- Fallback mechanisms for critical features
- Regular security audits
- Agile development practices

## Appendices

### A. API Documentation
- Detailed endpoint specifications
- Authentication flows
- Error handling standards
- Rate limiting policies

### B. Database Schemas
- Complete schema definitions
- Migration scripts
- Performance optimization indexes
- Backup and recovery procedures

### C. Deployment Architecture
- Container orchestration setup
- CI/CD pipeline configuration
- Monitoring and alerting setup
- Disaster recovery procedures

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2025  
**Next Review**: February 21, 2025  
**Approved By**: Product Team  
**Technical Review**: Engineering Team  
