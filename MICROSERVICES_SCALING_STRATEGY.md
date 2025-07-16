# Gametriggers Microservices Scaling Strategy

## Executive Summary

This document outlines a comprehensive strategy to scale the Gametriggers platform from its current monolithic Next.js + embedded NestJS architecture to a robust microservices-based system while maintaining NextAuth for authentication and separating frontend concerns appropriately.

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Target Microservices Architecture](#target-microservices-architecture)
3. [Entity Separation Strategy](#entity-separation-strategy)
4. [Microservices Breakdown](#microservices-breakdown)
5. [Frontend Separation Strategy](#frontend-separation-strategy)
6. [Authentication Strategy with NextAuth](#authentication-strategy-with-nextauth)
7. [API Gateway Implementation](#api-gateway-implementation)
8. [Data Management & Migration Strategy](#data-management--migration-strategy)
9. [Service Communication Patterns](#service-communication-patterns)
10. [Infrastructure & DevOps Strategy](#infrastructure--devops-strategy)
11. [Migration Roadmap](#migration-roadmap)
12. [Monitoring & Observability](#monitoring--observability)
13. [Cost Analysis & Resource Planning](#cost-analysis--resource-planning)

## Current Architecture Analysis

### Existing Structure

```
gametriggers/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy to backend)
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Auth pages
├── backend/               # Embedded NestJS backend
│   └── src/
│       ├── modules/
│       │   ├── users/
│       │   ├── campaigns/
│       │   ├── analytics/
│       │   ├── auth/
│       │   ├── earnings/
│       │   ├── overlay/
│       │   └── wallet/
│       └── main.ts
├── components/            # Shared UI components
├── lib/                   # Utilities and auth config
└── schemas/               # MongoDB schemas
```

### Current Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: NestJS embedded in backend folder
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth with Google, Twitch providers
- **Deployment**: Unified server.js running both frontend and backend

### Current Limitations

1. **Scalability Bottleneck**: Monolithic backend limits independent scaling
2. **Tight Coupling**: Frontend and backend deployed together
3. **Single Database**: All data in one MongoDB instance
4. **Resource Allocation**: Cannot optimize resources per service type
5. **Development Complexity**: Teams work on same codebase leading to conflicts

## Target Microservices Architecture

### High-Level Architecture

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
│Identity│  │ Brand   │  │ Streamer │  │Campaign │  │Analytics│  │  Admin  │
│Service │  │ Service │  │ Service  │  │ Service │  │ Service │  │ Service │
└───────┘  └─────────┘  └──────────┘  └─────────┘  └─────────┘  └─────────┘
    │          │             │            │            │            │
┌───▼───┐  ┌───▼───┐     ┌───▼───┐    ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│Payment│  │Overlay│     │Wallet │    │Upload │    │ Event │    │Audit  │
│Service│  │Service│     │Service│    │Service│    │ Bus   │    │Service│
└───────┘  └───────┘     └───────┘    └───────┘    └───────┘    └───────┘
```

## Entity Separation Strategy

### Current Unified User Model

```typescript
// Current user schema with role-based access
interface User {
  _id: ObjectId;
  email: string;
  name?: string;
  role: "brand" | "streamer" | "admin";
  profile: {
    // Mixed brand/streamer fields
  };
}
```

### New Separated Entities

#### Brand Entity

```typescript
interface Brand {
  _id: ObjectId;
  email: string;
  companyInfo: {
    name: string;
    industry: string;
    size: "startup" | "small" | "medium" | "enterprise";
    website?: string;
  };
  contactPerson: {
    name: string;
    position: string;
    phone?: string;
  };
  preferences: {
    targetAudience: string[];
    contentCategories: string[];
    budgetRange: {
      min: number;
      max: number;
    };
    regions: string[];
  };
  billingInfo: {
    address: Address;
    taxId?: string;
    currency: string;
  };
  verification: {
    status: "pending" | "verified" | "rejected";
    documents: string[];
    verifiedAt?: Date;
  };
  campaigns: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Streamer Entity

```typescript
interface Streamer {
  _id: ObjectId;
  email: string;
  displayName: string;
  platforms: {
    type: "twitch" | "youtube" | "tiktok" | "facebook";
    username: string;
    channelId: string;
    channelUrl: string;
    verified: boolean;
    metrics: {
      followers: number;
      averageViewers: number;
      totalViews: number;
      monthlyHours: number;
    };
    oauth: {
      accessToken: string; // Encrypted
      refreshToken: string; // Encrypted
      expiresAt: Date;
    };
  }[];
  content: {
    primaryCategory: string;
    secondaryCategories: string[];
    language: string;
    rating: "everyone" | "teen" | "mature";
  };
  demographics: {
    country: string;
    timezone: string;
    streamingSchedule: {
      days: string[];
      startTime: string;
      endTime: string;
    };
  };
  earnings: {
    totalEarned: number;
    payoutInfo: {
      method: "bank" | "paypal" | "crypto";
      details: string; // Encrypted
    };
  };
  participations: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Admin Entity

```typescript
interface Admin {
  _id: ObjectId;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "moderator" | "support";
  permissions: {
    canManageUsers: boolean;
    canVerifyBrands: boolean;
    canVerifyStreamers: boolean;
    canManageCampaigns: boolean;
    canViewFinancials: boolean;
    canModerateContent: boolean;
    canAccessAuditLogs: boolean;
    canManageDisputes: boolean;
    canConfigureSystem: boolean;
  };
  lastLoginAt: Date;
  loginAttempts: number;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Microservices Breakdown

### 1. Identity Service

**Purpose**: Centralized authentication and user management
**Responsibilities**:

- NextAuth integration and JWT token management
- OAuth provider integration (Google, Twitch)
- Session management and refresh tokens
- Role-based access control
- Password reset and email verification

**Tech Stack**: NestJS, MongoDB, NextAuth, JWT
**Database**: Users collection with basic auth info
**API Endpoints**:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`

### 2. Brand Service

**Purpose**: Brand profile and company management
**Responsibilities**:

- Brand profile CRUD operations
- Company verification process
- Brand preferences management
- Campaign creation interface
- Billing information management

**Tech Stack**: NestJS, MongoDB
**Database**: Brands collection
**API Endpoints**:

- `GET /brands/:id`
- `PUT /brands/:id`
- `POST /brands/:id/verify`
- `GET /brands/:id/campaigns`

### 3. Streamer Service

**Purpose**: Streamer profile and platform integration
**Responsibilities**:

- Streamer profile management
- Platform OAuth integration (Twitch, YouTube)
- Audience metrics tracking
- Stream schedule management
- Performance analytics

**Tech Stack**: NestJS, MongoDB, Platform APIs
**Database**: Streamers collection
**API Endpoints**:

- `GET /streamers/:id`
- `PUT /streamers/:id`
- `POST /streamers/:id/platforms`
- `GET /streamers/:id/metrics`

### 4. Campaign Service

**Purpose**: Campaign lifecycle management
**Responsibilities**:

- Campaign creation and editing
- Targeting criteria management
- Campaign scheduling
- Asset management integration
- Performance tracking

**Tech Stack**: NestJS, MongoDB
**Database**: Campaigns collection
**API Endpoints**:

- `POST /campaigns`
- `GET /campaigns/:id`
- `PUT /campaigns/:id`
- `POST /campaigns/:id/launch`

### 5. Participation Service

**Purpose**: Streamer-Campaign relationship management
**Responsibilities**:

- Campaign application process
- Participation approval workflow
- Ad delivery tracking
- Performance metrics collection
- Earnings calculation

**Tech Stack**: NestJS, MongoDB
**Database**: Participations collection
**API Endpoints**:

- `POST /participations`
- `GET /participations/:id`
- `PUT /participations/:id/status`

### 6. Analytics Service

**Purpose**: Data analytics and reporting
**Responsibilities**:

- Real-time metrics collection
- Campaign performance reports
- Audience analytics
- Revenue analytics
- Custom dashboard data

**Tech Stack**: NestJS, TimescaleDB/InfluxDB
**Database**: Time-series database for metrics
**API Endpoints**:

- `GET /analytics/campaigns/:id`
- `GET /analytics/streamers/:id`
- `POST /analytics/events`

### 7. Payment Service

**Purpose**: Financial transactions and payouts
**Responsibilities**:

- Payment processing (Stripe integration)
- Automated streamer payouts
- Invoice generation
- Financial reporting
- Tax document generation

**Tech Stack**: NestJS, PostgreSQL, Stripe
**Database**: PostgreSQL for ACID compliance
**API Endpoints**:

- `POST /payments/charge`
- `POST /payments/payout`
- `GET /payments/invoices`

### 8. Asset Service

**Purpose**: Media asset management
**Responsibilities**:

- File upload and storage
- Image/video processing
- Asset optimization
- CDN integration
- Overlay generation

**Tech Stack**: NestJS, AWS S3/MinIO, Sharp
**Database**: MongoDB for metadata, S3 for files
**API Endpoints**:

- `POST /assets/upload`
- `GET /assets/:id`
- `DELETE /assets/:id`

### 9. Notification Service

**Purpose**: Communication management
**Responsibilities**:

- Email notifications
- In-app notifications
- SMS notifications (future)
- Push notifications
- Communication preferences

**Tech Stack**: NestJS, Redis, SendGrid
**Database**: Redis for queues, MongoDB for persistence
**API Endpoints**:

- `POST /notifications/send`
- `GET /notifications/:userId`
- `PUT /notifications/:id/read`

### 10. Overlay Service

**Purpose**: Streaming overlay management
**Responsibilities**:

- Overlay template management
- Real-time overlay updates
- WebSocket connections for streamers
- Overlay customization
- Ad delivery tracking

**Tech Stack**: NestJS, Socket.IO, Redis
**Database**: MongoDB for templates, Redis for real-time data
**API Endpoints**:

- `GET /overlay/:streamerId`
- `POST /overlay/:streamerId/update`
- WebSocket endpoints for real-time updates

### 11. Admin Service

**Purpose**: Platform administration and management
**Responsibilities**:

- Admin user management and role-based access control
- Platform-wide statistics and monitoring
- Brand and streamer verification workflows
- Content moderation and compliance
- System configuration management
- Audit logging and compliance reporting
- Platform health monitoring and alerts
- Revenue and financial reporting
- Conflict resolution and dispute management

**Tech Stack**: NestJS, MongoDB, PostgreSQL
**Database**: MongoDB for admin operations, PostgreSQL for audit logs
**API Endpoints**:

- `GET /admin/dashboard`
- `GET /admin/users` (brands and streamers overview)
- `POST /admin/verify/brand/:id`
- `POST /admin/verify/streamer/:id`
- `GET /admin/campaigns` (all campaigns overview)
- `PUT /admin/campaigns/:id/status`
- `GET /admin/analytics/platform`
- `GET /admin/reports/financial`
- `GET /admin/audit-logs`
- `POST /admin/moderate/content`
- `GET /admin/disputes`
- `PUT /admin/disputes/:id/resolve`

## Frontend Separation Strategy

### Target Frontend Architecture

We'll create a monorepo with separate applications:

```
frontend/
├── apps/
│   ├── brand-portal/        # Brand-focused application
│   ├── streamer-portal/     # Streamer-focused application
│   ├── admin-portal/        # Admin management interface
│   └── landing-site/        # Marketing and authentication
├── packages/
│   ├── ui/                  # Shared components
│   ├── auth/                # NextAuth configuration
│   ├── api-client/          # API client libraries
│   └── utils/               # Shared utilities
└── tools/
    └── config/              # Shared configurations
```

### Brand Portal Features

- Campaign creation and management
- Brand profile setup
- Analytics dashboard
- Payment and billing
- Asset upload and management
- Streamer discovery and outreach

### Streamer Portal Features

- Streamer profile management
- Platform integration
- Campaign discovery and application
- Earnings dashboard
- Performance analytics
- Overlay management

### Admin Portal Features

- Platform-wide dashboard and statistics
- User management (brands, streamers, admins)
- Brand and streamer verification workflows
- Campaign oversight and management
- Financial reporting and analytics
- Content moderation tools
- Audit log viewing and compliance
- Dispute resolution interface
- System configuration and settings
- Real-time platform monitoring

### Shared Components Strategy

- Design system components in `packages/ui`
- Shared authentication logic in `packages/auth`
- Common API client in `packages/api-client`
- Utilities and helpers in `packages/utils`

## Authentication Strategy with NextAuth

### Centralized Auth with Distributed Services

#### NextAuth Configuration

```typescript
// packages/auth/next-auth-config.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import { JWT } from "next-auth/jwt";

export const createAuthOptions = (
  userType: "brand" | "streamer",
  apiBaseUrl: string
): NextAuthOptions => ({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(userType === "streamer"
      ? [
          TwitchProvider({
            clientId: process.env.TWITCH_CLIENT_ID!,
            clientSecret: process.env.TWITCH_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Call Identity Service to create/verify user
        const response = await fetch(`${apiBaseUrl}/auth/oauth-signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: account?.provider,
            providerAccountId: account?.providerAccountId,
            email: user.email,
            name: user.name,
            image: user.image,
            userType,
          }),
        });

        const result = await response.json();
        return result.success;
      } catch (error) {
        console.error("Sign-in error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        // Initial sign in - get user details from Identity Service
        const response = await fetch(`${apiBaseUrl}/auth/user-details`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        });

        const userDetails = await response.json();
        token.userType = userType;
        token.userId = userDetails.id;
        token.permissions = userDetails.permissions;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.userType = token.userType as string;
      session.user.permissions = token.permissions as string[];
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
});
```

#### Identity Service Integration

```typescript
// services/identity/src/auth/auth.controller.ts
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("oauth-signin")
  async oauthSignIn(@Body() signInDto: OAuthSignInDto) {
    return this.authService.handleOAuthSignIn(signInDto);
  }

  @Get("user-details")
  @UseGuards(JwtAuthGuard)
  async getUserDetails(@Request() req) {
    return this.authService.getUserDetails(req.user.id);
  }
}
```

## API Gateway Implementation

### Express-based API Gateway

```typescript
// api-gateway/src/gateway.ts
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticateToken } from "./middleware/auth";
import { rateLimiter } from "./middleware/rate-limit";

const app = express();

// Service endpoints
const services = {
  identity: "http://identity-service:3001",
  brand: "http://brand-service:3002",
  streamer: "http://streamer-service:3003",
  campaign: "http://campaign-service:3004",
  participation: "http://participation-service:3005",
  analytics: "http://analytics-service:3006",
  payment: "http://payment-service:3007",
  asset: "http://asset-service:3008",
  notification: "http://notification-service:3009",
  overlay: "http://overlay-service:3010",
  admin: "http://admin-service:3011",
};

// Middleware
app.use(express.json());
app.use(rateLimiter);

// Public routes (no auth required)
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: services.identity,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/auth" },
  })
);

// Protected routes
app.use(
  "/api/brands",
  authenticateToken(["brand"]),
  createProxyMiddleware({
    target: services.brand,
    changeOrigin: true,
    pathRewrite: { "^/api/brands": "/brands" },
  })
);

app.use(
  "/api/streamers",
  authenticateToken(["streamer"]),
  createProxyMiddleware({
    target: services.streamer,
    changeOrigin: true,
    pathRewrite: { "^/api/streamers": "/streamers" },
  })
);

// Admin routes (admin only)
app.use(
  "/api/admin",
  authenticateToken(["admin", "super_admin"]),
  createProxyMiddleware({
    target: services.admin,
    changeOrigin: true,
    pathRewrite: { "^/api/admin": "/admin" },
  })
);

// Shared routes (both brand and streamer)
app.use(
  "/api/campaigns",
  authenticateToken(["brand", "streamer"]),
  createProxyMiddleware({
    target: services.campaign,
    changeOrigin: true,
    pathRewrite: { "^/api/campaigns": "/campaigns" },
  })
);

export default app;
```

### Authentication Middleware

```typescript
// api-gateway/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      if (!allowedRoles.includes(user.userType)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.user = user;
      next();
    });
  };
};
```

## Data Management & Migration Strategy

### Database per Service Strategy

| Service       | Database Type        | Justification                                |
| ------------- | -------------------- | -------------------------------------------- |
| Identity      | MongoDB              | Flexible schema for user profiles            |
| Brand         | MongoDB              | Document structure for company data          |
| Streamer      | MongoDB              | Complex nested platform data                 |
| Campaign      | MongoDB              | Rich campaign metadata                       |
| Participation | MongoDB              | Relationship tracking                        |
| Analytics     | TimescaleDB          | Time-series performance data                 |
| Payment       | PostgreSQL           | ACID compliance for financial data           |
| Notification  | Redis + MongoDB      | Fast queues + persistence                    |
| Asset         | MongoDB + S3         | Metadata + blob storage                      |
| Overlay       | MongoDB + Redis      | Templates + real-time data                   |
| Admin         | PostgreSQL + MongoDB | Admin data + audit logs with ACID compliance |

### Migration Strategy

#### Phase 1: Data Extraction Scripts

```typescript
// migration/extract-users.ts
import { MongoClient } from "mongodb";

export async function extractUsers() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const db = client.db();
  const users = await db.collection("users").find({}).toArray();

  const brands = [];
  const streamers = [];
  const admins = [];

  for (const user of users) {
    if (user.role === "brand") {
      brands.push({
        _id: user._id,
        email: user.email,
        companyInfo: {
          name: user.profile?.companyName || "",
          industry: user.profile?.industry || "",
        },
        // Map other brand-specific fields
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } else if (user.role === "streamer") {
      streamers.push({
        _id: user._id,
        email: user.email,
        displayName: user.profile?.displayName || user.name,
        platforms: user.platforms || [],
        // Map other streamer-specific fields
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } else if (user.role === "admin") {
      admins.push({
        _id: user._id,
        email: user.email,
        username: user.username || user.email,
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        role: user.adminRole || "admin",
        permissions: user.permissions || {},
        isActive: true,
        twoFactorEnabled: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }
  }

  // Write to separate service databases
  await writeBrands(brands);
  await writeStreamers(streamers);
  await writeAdmins(admins);

  await client.close();
}
```

#### Phase 2: Dual Writing Implementation

During migration, implement dual writing to ensure data consistency:

```typescript
// shared/dual-write.service.ts
export class DualWriteService {
  async createUser(userData: any) {
    // Write to old monolithic DB
    const oldResult = await this.oldUserService.create(userData);

    // Write to new microservice
    if (userData.role === "brand") {
      await this.brandService.create(this.transformToBrand(userData));
    } else if (userData.role === "streamer") {
      await this.streamerService.create(this.transformToStreamer(userData));
    } else if (userData.role === "admin") {
      await this.adminService.create(this.transformToAdmin(userData));
    }

    return oldResult;
  }
}
```

## Service Communication Patterns

### Synchronous Communication (REST)

For direct request-response patterns:

- Brand → Campaign Service (create campaign)
- Streamer → Participation Service (apply to campaign)
- Any service → Identity Service (user verification)

### Asynchronous Communication (Event Bus)

For eventual consistency and decoupling:

- Campaign created → Notification Service (notify streamers)
- Payment processed → Analytics Service (update revenue metrics)
- Participation approved → Overlay Service (prepare overlay)

### Event Bus Implementation with RabbitMQ

```typescript
// shared/event-bus/event-bus.service.ts
import { Injectable } from "@nestjs/common";
import * as amqp from "amqplib";

@Injectable()
export class EventBusService {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async publish(exchange: string, routingKey: string, data: any) {
    await this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(data))
    );
  }

  async subscribe(queue: string, handler: (data: any) => void) {
    await this.channel.consume(queue, (message) => {
      if (message) {
        const data = JSON.parse(message.content.toString());
        handler(data);
        this.channel.ack(message);
      }
    });
  }
}
```

## Infrastructure & DevOps Strategy

### Docker Compose for Development

```yaml
# docker-compose.yml
version: "3.8"

services:
  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - identity-service
      - brand-service

  # Identity Service
  identity-service:
    build: ./services/identity
    environment:
      - MONGODB_URI=mongodb://mongo-identity:27017/identity
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo-identity

  # Brand Service
  brand-service:
    build: ./services/brand
    environment:
      - MONGODB_URI=mongodb://mongo-brand:27017/brands
    depends_on:
      - mongo-brand

  # Databases
  mongo-identity:
    image: mongo:7
    volumes:
      - identity-data:/data/db

  mongo-brand:
    image: mongo:7
    volumes:
      - brand-data:/data/db

  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin

volumes:
  identity-data:
  brand-data:
```

### Kubernetes Production Deployment

```yaml
# k8s/brand-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brand-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: brand-service
  template:
    metadata:
      labels:
        app: brand-service
    spec:
      containers:
        - name: brand-service
          image: gametriggers/brand-service:latest
          ports:
            - containerPort: 3002
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: brand-service-secrets
                  key: mongodb-uri
```

## Migration Roadmap

### Phase 1: Foundation Setup (Weeks 1-4)

**Goals**: Establish infrastructure and core services

**Tasks**:

1. Set up monorepo structure for microservices
2. Create Docker containers for each service
3. Implement Identity Service with NextAuth integration
4. Set up API Gateway with basic routing
5. Create development environment with Docker Compose

**Deliverables**:

- Working Identity Service
- API Gateway routing to Identity Service
- Development environment setup
- CI/CD pipelines for core services

### Phase 2: Entity Separation (Weeks 5-8)

**Goals**: Separate brands and streamers into distinct services

**Tasks**:

1. Implement Brand Service with full CRUD operations
2. Implement Streamer Service with platform integrations
3. Create data migration scripts
4. Update NextAuth configuration for separated entities
5. Implement dual-writing mechanism

**Deliverables**:

- Brand Service with complete functionality
- Streamer Service with platform OAuth
- Data migration tools
- Updated authentication flow

### Phase 3: Core Business Logic Migration (Weeks 9-14)

**Goals**: Migrate campaign and participation logic

**Tasks**:

1. Implement Campaign Service
2. Implement Participation Service
3. Create Analytics Service for metrics collection
4. Update frontend to use new API endpoints
5. Implement event-driven communication between services

**Deliverables**:

- Campaign management functionality
- Participation workflow
- Analytics collection
- Updated frontend components

### Phase 4: Supporting Services (Weeks 15-20)

**Goals**: Implement remaining services for full functionality

**Tasks**:

1. Implement Payment Service with Stripe integration
2. Create Asset Service for file management
3. Implement Notification Service
4. Create Overlay Service for streaming integration
5. Set up monitoring and logging infrastructure

**Deliverables**:

- Payment processing system
- Asset management system
- Notification system
- Overlay management
- Monitoring dashboard

### Phase 5: Frontend Separation (Weeks 21-26)

**Goals**: Split frontend into specialized portals

**Tasks**:

1. Create Brand Portal with specialized UI
2. Create Streamer Portal with platform-specific features
3. Implement shared component library
4. Set up separate deployment pipelines for each portal
5. Create landing site for authentication

**Deliverables**:

- Brand Portal application
- Streamer Portal application
- Shared component library
- Separate deployment pipelines

### Phase 6: Production Migration (Weeks 27-30)

**Goals**: Complete transition to microservices architecture

**Tasks**:

1. Set up production Kubernetes environment
2. Implement blue-green deployment strategy
3. Migrate production data to new services
4. Switch traffic to new architecture
5. Decommission old monolithic backend

**Deliverables**:

- Production microservices deployment
- Complete data migration
- Traffic cutover
- Monitoring and alerting

## Monitoring & Observability

### Monitoring Stack

- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger for distributed tracing
- **Alerting**: AlertManager with PagerDuty integration

### Key Metrics to Monitor

1. **Service Health**: Response times, error rates, throughput
2. **Business Metrics**: Campaign performance, user engagement
3. **Infrastructure**: CPU, memory, disk usage
4. **Database**: Query performance, connection pools
5. **Authentication**: Login success rates, token refresh rates

### Example Monitoring Configuration

```typescript
// shared/monitoring/prometheus.service.ts
import { Injectable } from "@nestjs/common";
import { register, Counter, Histogram } from "prom-client";

@Injectable()
export class PrometheusService {
  private httpRequests = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "status_code", "endpoint"],
  });

  private httpDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "endpoint"],
  });

  recordHttpRequest(
    method: string,
    statusCode: number,
    endpoint: string,
    duration: number
  ) {
    this.httpRequests.inc({ method, status_code: statusCode, endpoint });
    this.httpDuration.observe({ method, endpoint }, duration);
  }
}
```

## Cost Analysis & Resource Planning

### Estimated Monthly Costs (AWS/Production)

| Component                | Resources                                        | Estimated Cost         |
| ------------------------ | ------------------------------------------------ | ---------------------- |
| **Microservices (EKS)**  | 7 nodes, 18 CPU, 36GB RAM                        | $450-700               |
| **Databases**            | 6 MongoDB instances, 2 PostgreSQL, 1 TimescaleDB | $350-600               |
| **API Gateway**          | Application Load Balancer + CloudFront           | $50-100                |
| **Message Broker**       | Amazon MQ (RabbitMQ)                             | $100-150               |
| **Storage**              | S3 for assets, EBS for databases                 | $100-200               |
| **Monitoring**           | CloudWatch, Third-party tools                    | $100-200               |
| **Networking**           | Data transfer, VPC                               | $50-100                |
| **Admin Tools**          | Additional security and compliance tools         | $50-100                |
| **Total Estimated Cost** |                                                  | **$1,250-2,150/month** |

### Scaling Considerations

- **Auto-scaling**: Configure HPA for high-traffic services
- **Database scaling**: Read replicas for MongoDB, connection pooling
- **CDN**: CloudFront for asset delivery
- **Caching**: Redis for frequently accessed data

### Cost Optimization Strategies

1. **Reserved Instances**: For stable workloads
2. **Spot Instances**: For development/testing environments
3. **Resource Right-sizing**: Monitor and adjust based on usage
4. **Data Lifecycle**: Archive old analytics data to cheaper storage

## Conclusion

This comprehensive strategy provides a roadmap to transform the Gametriggers platform from a monolithic architecture to a scalable microservices system while maintaining NextAuth for authentication and implementing proper frontend separation.

### Key Benefits of This Approach:

1. **Scalability**: Independent scaling of services based on demand
2. **Maintainability**: Smaller, focused codebases that are easier to maintain
3. **Team Productivity**: Teams can work independently on different services
4. **Technology Flexibility**: Use optimal technologies for each service
5. **Fault Isolation**: Issues in one service don't affect others
6. **Specialized User Experience**: Tailored interfaces for brands and streamers

### Success Factors:

1. **Gradual Migration**: Phased approach minimizes risk
2. **Dual Writing**: Ensures data consistency during transition
3. **Comprehensive Testing**: Thorough testing at each phase
4. **Monitoring**: Robust observability from day one
5. **Team Training**: Ensure teams understand microservices patterns

This strategy positions Gametriggers for sustainable growth while providing the flexibility to evolve individual components as business requirements change.
