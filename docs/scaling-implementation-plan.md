# Gametriggers Scaling Implementation Plan

This document provides a comprehensive, actionable plan for scaling the Gametriggers platform from its current monolithic architecture to a microservices-based system while maintaining NextAuth for authentication.

## Table of Contents

1. [Current Architecture Assessment](#current-architecture-assessment)
2. [Scaling Goals and Requirements](#scaling-goals-and-requirements)
3. [Authentication Strategy with NextAuth](#authentication-strategy-with-nextauth)
4. [Entity Separation Implementation](#entity-separation-implementation)
5. [Microservices Architecture Implementation](#microservices-architecture-implementation)
6. [Database Strategy](#database-strategy)
7. [API Gateway Implementation](#api-gateway-implementation)
8. [Service Communication Patterns](#service-communication-patterns)
9. [Step-by-Step Migration Plan](#step-by-step-migration-plan)
10. [DevOps Infrastructure Setup](#devops-infrastructure-setup)
11. [Testing Strategy](#testing-strategy)
12. [Performance Monitoring](#performance-monitoring)
13. [Cost Estimation and Resource Planning](#cost-estimation-and-resource-planning)
14. [Timeline and Milestones](#timeline-and-milestones)
15. [Risk Assessment and Mitigation](#risk-assessment-and-mitigation)

## Current Architecture Assessment

### Next.js with Embedded NestJS

The current architecture consists of:
- Next.js 15 application with App Router
- NestJS backend embedded in `/app/api/nest/`
- MongoDB for all data storage
- Single User schema with role-based differentiation (`brand` | `streamer` | `admin`)
- NextAuth for authentication with Twitch and Google providers
- **Comprehensive Wallet & Payment System** with KYC verification and multi-payment support
- **Advanced Analytics Engine** with viewer-based metrics and financial reporting
- **Conflict Rules System** for campaign fairness and streamer conflict prevention
- **Admin Financial Controls** including dispute resolution and transaction monitoring
- **Billing & Dispute Management** with automated workflow tracking

### Current Data Models

```typescript
// Enhanced User Schema with financial capabilities
interface User {
  _id: ObjectId;
  email: string;
  name?: string;
  image?: string;
  role: 'brand' | 'streamer' | 'admin';
  accounts: {
    provider: string;
    providerAccountId: string;
    access_token?: string;
    refresh_token?: string;
    // OAuth specific fields
  }[];
  // Additional profile data based on role
  brandProfile?: {
    companyName: string;
    industry: string;
    // Other brand-specific fields
  };
  streamerProfile?: {
    platform: 'twitch' | 'youtube' | 'other';
    channelUrl: string;
    averageViewers: number;
    // Other streamer-specific fields
  };
}

// Wallet Schema for financial management
interface Wallet {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  walletType: 'brand' | 'streamer';
  balance: number;
  reservedBalance: number; // For campaign budget reservations
  totalDeposits: number;
  totalWithdrawals: number;
  totalEarnings: number; // For streamers
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// KYC Schema for compliance
interface KYC {
  _id: ObjectId;
  userId: ObjectId;
  status: 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected';
  fullName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    isVerified: boolean;
  };
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
}

// Enhanced Campaign Schema with financial tracking
interface Campaign {
  _id: ObjectId;
  title: string;
  brandId: ObjectId; // Reference to User
  budget: number;
  remainingBudget: number;
  paymentRate: number;
  paymentType: 'cpm' | 'cpc' | 'flat';
  // ... existing campaign fields
  // Advanced analytics fields
  totalImpressions: number;
  viewerImpressions: number; // New viewer-based metric
  totalClicks: number;
  chatClicks: number;
  qrScans: number;
  linkClicks: number;
}

// Enhanced Campaign Participation Schema with advanced metrics
interface CampaignParticipation {
  _id: ObjectId;
  campaignId: ObjectId;
  streamerId: ObjectId;
  status: 'applied' | 'approved' | 'active' | 'completed' | 'rejected';
  // Traditional metrics
  impressions: number;
  clicks: number;
  // Advanced tracking metrics
  uniqueViewers: number;
  chatClicks: number;
  qrScans: number;
  linkClicks: number;
  // Stream activity metrics
  lastStreamDate: Date;
  totalStreamMinutes: number;
  avgViewerCount: number;
  peakViewerCount: number;
  // Financial data
  estimatedEarnings: number;
}

// Conflict Rules Schema for campaign fairness
interface ConflictRule {
  _id: ObjectId;
  name: string;
  description: string;
  type: 'category_exclusivity' | 'brand_exclusivity' | 'cooldown_period' | 'simultaneous_limit';
  severity: 'blocking' | 'warning' | 'advisory';
  config: {
    categories?: string[];
    brands?: string[];
    cooldownPeriodDays?: number;
    maxSimultaneousCampaigns?: number;
  };
  isActive: boolean;
  priority: number;
  createdBy: string;
  timesTriggered: number;
  conflictsBlocked: number;
}

// Billing and Dispute Schema
interface Dispute {
  _id: ObjectId;
  disputeId: string;
  raisedBy: string;
  disputeType: 'payment_not_received' | 'wrong_amount' | 'campaign_not_delivered' | 'technical_issue';
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  transactionId?: ObjectId;
  campaignId?: ObjectId;
  subject: string;
  description: string;
  disputeAmount?: number;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  comments: Array<{
    commentBy: string;
    comment: string;
    isInternal: boolean;
    createdAt: Date;
  }>;
}
```

### Current Authentication Flow

1. User signs in via NextAuth using Twitch/Google/Email providers
2. NextAuth creates and maintains sessions
3. Sessions provide role information for authorization

## Scaling Goals and Requirements

### Primary Goals

1. Separate brands and streamers into distinct entities for better specialization
2. Convert monolithic backend to microservices architecture for improved scalability
3. Maintain NextAuth for authentication while adapting it to the new architecture
4. Support horizontal scaling for high-load components
5. Ensure zero downtime during migration

### Non-Functional Requirements

1. Response time < 200ms for critical operations
2. Support for 100K+ concurrent streamers during peak events
3. 99.9% uptime SLA
4. Support for 1000+ simultaneous ad campaign deliveries
5. Real-time analytics with < 2 second delay

## Authentication Strategy with NextAuth

### NextAuth in a Distributed Architecture

NextAuth will remain the primary authentication mechanism, but we'll adapt it to work with our microservices:

1. **Centralized Auth Service**: Create a dedicated authentication microservice that integrates with NextAuth
2. **JWT-Based Sessions**: Use JWT tokens instead of database sessions for better distribution
3. **Token Validation**: Implement token validation at the API Gateway level
4. **Scoped Permissions**: Extend JWT payload to include granular permissions

### Implementation Steps

#### 1. Update NextAuth Configuration

```typescript
// In /app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 2. Enhanced Auth Options Configuration

```typescript
// In /lib/auth.ts
import { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'user:read:email channel:read:subscriptions' }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        // Call Identity Service to get user details
        const userDetails = await fetchUserDetails(account.provider, account.providerAccountId);
        
        return {
          ...token,
          userId: userDetails.id,
          userType: userDetails.type, // 'brand' or 'streamer'
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          permissions: userDetails.permissions
        };
      }
      
      // Return previous token if not expired
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }
      
      // Refresh token
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.type = token.userType;
      session.user.permissions = token.permissions;
      session.accessToken = token.accessToken;
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Custom redirect logic based on user type
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function fetchUserDetails(provider: string, providerAccountId: string) {
  // Call to Identity Service API
  const response = await fetch(`${process.env.IDENTITY_SERVICE_URL}/users/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, providerAccountId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }
  
  return response.json();
}

async function refreshAccessToken(token: JWT) {
  try {
    // Call to Identity Service to refresh the token
    const response = await fetch(`${process.env.IDENTITY_SERVICE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken })
    });
    
    const refreshedTokens = await response.json();
    
    if (!response.ok) throw refreshedTokens;
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
```

#### 3. Extend Next-Auth Types for Brand/Streamer Types

```typescript
// In /types/next-auth.d.ts
import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      type: 'brand' | 'streamer' | 'admin';
      permissions: string[];
    };
    accessToken: string;
    error?: string;
  }
  
  interface User {
    id: string;
    type: 'brand' | 'streamer' | 'admin';
    permissions: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    userType: 'brand' | 'streamer' | 'admin';
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    permissions: string[];
    error?: string;
  }
}
```

## Entity Separation Implementation

### Brand Entity Schema

```typescript
// In /schemas/brand.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Brand extends Document {
  @Prop({ required: true, unique: true })
  email: string;
  
  @Prop({ required: true })
  name: string;
  
  @Prop()
  image?: string;
  
  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  accounts: Record<string, any>[];
  
  @Prop({ required: true })
  companyName: string;
  
  @Prop()
  industry?: string;
  
  @Prop()
  website?: string;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  billingInfo?: Record<string, any>;
  
  @Prop({ type: [String] })
  preferredCategories?: string[];
  
  @Prop({ type: [String] })
  targetAudience?: string[];
  
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Campaign' }] })
  campaigns: MongooseSchema.Types.ObjectId[];
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
```

### Streamer Entity Schema

```typescript
// In /schemas/streamer.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Streamer extends Document {
  @Prop({ required: true, unique: true })
  email: string;
  
  @Prop({ required: true })
  name: string;
  
  @Prop()
  image?: string;
  
  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  accounts: Record<string, any>[];
  
  @Prop({ required: true })
  displayName: string;
  
  @Prop([{
    platform: { type: String, enum: ['twitch', 'youtube', 'tiktok', 'other'] },
    username: String,
    channelUrl: String,
    metrics: {
      followers: Number,
      averageViewers: Number,
      peakViewers: Number,
      contentCategories: [String]
    },
    verified: Boolean,
    authTokens: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date
    }
  }])
  platforms: Record<string, any>[];
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  demographics?: {
    primaryCountry: string;
    languages: string[];
    audienceAgeRanges: string[];
    audienceInterests: string[];
  };
  
  @Prop({ type: MongooseSchema.Types.Mixed, select: false })
  payoutInfo?: Record<string, any>;
  
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CampaignParticipation' }] })
  participations: MongooseSchema.Types.ObjectId[];
}

export const StreamerSchema = SchemaFactory.createForClass(Streamer);
```

### Updated Campaign Schema

```typescript
// In /schemas/campaign.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Campaign extends Document {
  @Prop({ required: true })
  name: string;
  
  @Prop()
  description: string;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brand: MongooseSchema.Types.ObjectId;
  
  @Prop({ enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' })
  status: string;
  
  @Prop({ required: true, min: 0 })
  budget: number;
  
  @Prop({ required: true, min: 0 })
  remainingBudget: number;
  
  @Prop({ required: true })
  startDate: Date;
  
  @Prop({ required: true })
  endDate: Date;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  targetAudience: {
    countries: string[];
    ageRanges: string[];
    interests: string[];
  };
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  assets: {
    images: string[];
    videos: string[];
    overlayType: string;
    displayDuration: number;
  };
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  requirements: {
    minViewers: number;
    minFollowers: number;
    contentCategories: string[];
  };
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  compensation: {
    type: string;
    ratePerView: number;
    flatRate: number;
    details: string;
  };
  
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CampaignParticipation' }] })
  participations: MongooseSchema.Types.ObjectId[];
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
```

## Microservices Architecture Implementation

### Service Structure

We'll implement the following microservices:

1. **Identity Service**: Authentication, user management, and session handling
2. **Brand Service**: Brand profile management and business operations
3. **Streamer Service**: Streamer profile and platform integration
4. **Campaign Service**: Campaign lifecycle management and budget tracking
5. **Participation Service**: Streamer participation in campaigns with advanced metrics
6. **Analytics Service**: Performance metrics, reporting, and viewer-based analytics
7. **Wallet Service**: Financial transactions, balance management, and KYC processing
8. **Conflict Rules Service**: Campaign fairness rules and violation detection
9. **Admin Finance Service**: Administrative financial oversight and dispute resolution
10. **Notification Service**: Communications and real-time updates
11. **Asset Service**: Media management and optimization
12. **Billing Service**: Invoice generation and dispute management

### Docker-Compose Setup for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway
  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
    environment:
      - IDENTITY_SERVICE_URL=http://identity-service:4001
      - BRAND_SERVICE_URL=http://brand-service:4002
      - STREAMER_SERVICE_URL=http://streamer-service:4003
      - CAMPAIGN_SERVICE_URL=http://campaign-service:4004
      - PARTICIPATION_SERVICE_URL=http://participation-service:4005
      - ANALYTICS_SERVICE_URL=http://analytics-service:4006
      - WALLET_SERVICE_URL=http://wallet-service:4007
      - CONFLICT_RULES_SERVICE_URL=http://conflict-rules-service:4008
      - ADMIN_FINANCE_SERVICE_URL=http://admin-finance-service:4009
      - NOTIFICATION_SERVICE_URL=http://notification-service:4010
      - ASSET_SERVICE_URL=http://asset-service:4011
      - BILLING_SERVICE_URL=http://billing-service:4012
    depends_on:
      - identity-service
      - brand-service
      - streamer-service
      - campaign-service
      - participation-service
      - analytics-service
      - wallet-service
      - conflict-rules-service
      - admin-finance-service
      - notification-service
      - asset-service
      - billing-service

  # Identity Service
  identity-service:
    build: ./services/identity
    ports:
      - "4001:4001"
    environment:
      - MONGODB_URI=mongodb://mongo-identity:27017/identity
      - JWT_SECRET=your_jwt_secret
      - NEXTAUTH_SECRET=your_nextauth_secret
      - TWITCH_CLIENT_ID=your_twitch_client_id
      - TWITCH_CLIENT_SECRET=your_twitch_client_secret
      - GOOGLE_CLIENT_ID=your_google_client_id
      - GOOGLE_CLIENT_SECRET=your_google_client_secret
      - EMAIL_SERVER=your_email_server
      - EMAIL_FROM=your_email_from
    depends_on:
      - mongo-identity
      - rabbitmq

  # Brand Service
  brand-service:
    build: ./services/brand
    ports:
      - "4002:4002"
    environment:
      - MONGODB_URI=mongodb://mongo-brand:27017/brand
      - IDENTITY_SERVICE_URL=http://identity-service:4001
    depends_on:
      - mongo-brand
      - rabbitmq

  # Streamer Service
  streamer-service:
    build: ./services/streamer
    ports:
      - "4003:4003"
    environment:
      - MONGODB_URI=mongodb://mongo-streamer:27017/streamer
      - IDENTITY_SERVICE_URL=http://identity-service:4001
      - TWITCH_CLIENT_ID=your_twitch_client_id
      - TWITCH_CLIENT_SECRET=your_twitch_client_secret
      - YOUTUBE_API_KEY=your_youtube_api_key
    depends_on:
      - mongo-streamer
      - rabbitmq

  # Campaign Service
  campaign-service:
    build: ./services/campaign
    ports:
      - "4004:4004"
    environment:
      - MONGODB_URI=mongodb://mongo-campaign:27017/campaign
      - BRAND_SERVICE_URL=http://brand-service:4002
      - ASSET_SERVICE_URL=http://asset-service:4009
    depends_on:
      - mongo-campaign
      - rabbitmq

  # Participation Service
  participation-service:
    build: ./services/participation
    ports:
      - "4005:4005"
    environment:
      - MONGODB_URI=mongodb://mongo-participation:27017/participation
      - CAMPAIGN_SERVICE_URL=http://campaign-service:4004
      - STREAMER_SERVICE_URL=http://streamer-service:4003
    depends_on:
      - mongo-participation
      - rabbitmq

  # Analytics Service
  analytics-service:
    build: ./services/analytics
    ports:
      - "4006:4006"
    environment:
      - TIMESCALE_URI=postgres://postgres:postgres@timescale:5432/analytics
      - CAMPAIGN_SERVICE_URL=http://campaign-service:4004
      - PARTICIPATION_SERVICE_URL=http://participation-service:4005
    depends_on:
      - timescale
      - rabbitmq

  # Payment Service
  payment-service:
    build: ./services/payment
    ports:
      - "4007:4007"
    environment:
      - POSTGRES_URI=postgres://postgres:postgres@postgres-payment:5432/payment
      - STRIPE_SECRET_KEY=your_stripe_secret_key
      - PAYPAL_CLIENT_ID=your_paypal_client_id
      - PAYPAL_CLIENT_SECRET=your_paypal_client_secret
      - CAMPAIGN_SERVICE_URL=http://campaign-service:4004
      - STREAMER_SERVICE_URL=http://streamer-service:4003
      - BRAND_SERVICE_URL=http://brand-service:4002
    depends_on:
      - postgres-payment
      - rabbitmq

  # Notification Service
  notification-service:
    build: ./services/notification
    ports:
      - "4008:4008"
    environment:
      - REDIS_URI=redis://redis:6379
      - MONGODB_URI=mongodb://mongo-notification:27017/notification
      - EMAIL_SERVICE=your_email_service
      - EMAIL_API_KEY=your_email_api_key
    depends_on:
      - redis
      - mongo-notification
      - rabbitmq

  # Asset Service
  asset-service:
    build: ./services/asset
    ports:
      - "4009:4009"
    environment:
      - MONGODB_URI=mongodb://mongo-asset:27017/asset
      - CLOUD_STORAGE_BUCKET=your_cloud_storage_bucket
      - CLOUD_STORAGE_KEY=your_cloud_storage_key
    depends_on:
      - mongo-asset
      - minio
      - rabbitmq

  # Databases
  mongo-identity:
    image: mongo:latest
    volumes:
      - mongo-identity-data:/data/db

  mongo-brand:
    image: mongo:latest
    volumes:
      - mongo-brand-data:/data/db

  mongo-streamer:
    image: mongo:latest
    volumes:
      - mongo-streamer-data:/data/db

  mongo-campaign:
    image: mongo:latest
    volumes:
      - mongo-campaign-data:/data/db

  mongo-participation:
    image: mongo:latest
    volumes:
      - mongo-participation-data:/data/db

  mongo-notification:
    image: mongo:latest
    volumes:
      - mongo-notification-data:/data/db

  mongo-asset:
    image: mongo:latest
    volumes:
      - mongo-asset-data:/data/db

  timescale:
    image: timescale/timescaledb:latest-pg12
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - timescale-data:/var/lib/postgresql/data

  postgres-payment:
    image: postgres:13
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-payment-data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

  minio:
    image: minio/minio
    volumes:
      - minio-data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server --console-address ":9001" /data

  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

  # Monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3100:3000"
    volumes:
      - ./monitoring/grafana:/etc/grafana/provisioning
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  mongo-identity-data:
  mongo-brand-data:
  mongo-streamer-data:
  mongo-campaign-data:
  mongo-participation-data:
  mongo-notification-data:
  mongo-asset-data:
  timescale-data:
  postgres-payment-data:
  redis-data:
  rabbitmq-data:
  minio-data:
  prometheus-data:
  grafana-data:
```

## Advanced Financial & Compliance Systems

### Wallet & Payment Infrastructure

The platform now includes a comprehensive financial management system:

#### Core Wallet Features
- **Multi-currency Support**: Handles INR and other currencies with proper conversion
- **Brand Wallets**: Budget management, campaign fund reservation, and spending tracking
- **Streamer Wallets**: Earnings accumulation, withdrawal management, and payment history
- **Admin Oversight**: Transaction monitoring, dispute resolution, and financial reporting

#### KYC Verification System
```typescript
// KYC Integration Example
interface KYCWorkflow {
  documentSubmission: {
    personalInfo: PersonalDetails;
    addressVerification: AddressProof;
    bankDetails: BankAccountInfo;
    identityDocuments: Array<{
      type: 'pan' | 'aadhaar' | 'passport' | 'driving_license';
      documentNumber: string;
      fileUpload?: File;
    }>;
  };
  verificationProcess: {
    automaticValidation: boolean;
    manualReview: boolean;
    adminApproval: boolean;
    withdrawalEligibility: boolean;
  };
}
```

#### Payment Processing Integration
- **Stripe Integration**: Card payments, UPI, and bank transfers
- **PayPal Support**: International transactions
- **Automated Payouts**: Scheduled streamer payments with configurable thresholds
- **Mock Payment System**: Development environment with simulated transactions

### Advanced Analytics Engine

The analytics system has been significantly enhanced:

#### Viewer-Based Metrics
```typescript
interface AdvancedAnalytics {
  // Traditional metrics
  impressions: number;
  clicks: number;
  
  // Viewer-based metrics (NEW)
  viewerImpressions: number;
  uniqueViewers: number;
  
  // Alternative engagement metrics (NEW)
  chatClicks: number;
  qrScans: number;
  linkClicks: number;
  
  // Stream performance data (NEW)
  totalStreamMinutes: number;
  avgViewerCount: number;
  peakViewerCount: number;
  
  // Calculated engagement rates
  viewerEngagementRate: number;
  traditionalEngagementRate: number;
  earningsPerStream: number;
  earningsPerMinute: number;
}
```

#### Multi-Dimensional Reporting
- **Brand Analytics**: ROI tracking, campaign performance, spend efficiency
- **Streamer Analytics**: Earnings trends, viewer engagement, stream performance
- **Admin Analytics**: Platform overview, financial health, user growth metrics
- **Real-time Dashboards**: Live campaign tracking and performance monitoring

### Campaign Fairness & Conflict Rules

#### Conflict Prevention System
```typescript
interface ConflictRuleEngine {
  ruleTypes: {
    categoryExclusivity: {
      preventSimultaneousCampaigns: string[];
      exclusiveCategories: string[];
    };
    brandExclusivity: {
      competitorBlocking: string[];
      exclusiveBrands: string[];
    };
    cooldownPeriods: {
      categoryBasedCooldown: number; // days
      brandBasedCooldown: number;
    };
    simultaneousLimits: {
      maxCampaignsPerStreamer: number;
      maxCampaignsPerCategory: number;
    };
  };
  
  violationHandling: {
    blocking: ConflictAction;
    warning: ConflictAction;
    advisory: ConflictAction;
  };
  
  adminOverrides: {
    emergencyOverride: boolean;
    reasonRequired: boolean;
    auditTrail: boolean;
  };
}
```

#### Fairness Algorithms
- **Automatic Conflict Detection**: Real-time checking during campaign application
- **Priority-Based Resolution**: Rule hierarchy for complex conflict scenarios
- **Admin Override Capabilities**: Emergency controls with audit trails
- **Violation Analytics**: Tracking and reporting of conflict patterns

### Administrative Financial Controls

#### Comprehensive Admin Dashboard
- **Transaction Monitoring**: Real-time transaction oversight with filtering and search
- **Dispute Resolution**: Structured workflow for handling payment disputes
- **Financial Reporting**: Revenue analytics, payout summaries, and profit tracking
- **User Financial Management**: Wallet oversight, withdrawal approvals, and balance adjustments

#### Audit & Compliance Features
```typescript
interface AdminFinanceControls {
  transactionAuditTrail: {
    allTransactionLogging: boolean;
    immutableRecords: boolean;
    searchAndFilter: TransactionFilter[];
    exportCapability: boolean;
  };
  
  disputeManagement: {
    automatedWorkflow: DisputeWorkflow;
    evidenceCollection: FileUpload[];
    resolutionTracking: ResolutionHistory;
    escalationProcedures: EscalationRule[];
  };
  
  complianceReporting: {
    regulatoryReports: ReportType[];
    auditExports: AuditFormat[];
    dataRetention: RetentionPolicy;
    privacyCompliance: GDPRCompliance;
  };
}
```

### Billing & Dispute Management

#### Automated Billing System
- **Invoice Generation**: Automated brand invoicing with customizable templates
- **Payment Tracking**: Real-time payment status and aging reports
- **Dispute Workflow**: Structured dispute resolution with evidence management
- **Integration Points**: Seamless integration with accounting systems

#### Dispute Resolution Framework
- **Multi-level Escalation**: Automatic escalation based on dispute value and complexity
- **Evidence Management**: Secure file upload and document management
- **Communication Tracking**: Complete audit trail of all dispute communications
- **Resolution Analytics**: Performance metrics for dispute resolution efficiency
````markdown
## Step-by-Step Migration Plan

### Phase 1: Preparation (Weeks 1-4)

1. **Infrastructure Setup**
   - Set up Docker-compose for development environment
   - Establish CI/CD pipeline for microservices
   - Configure monitoring and logging infrastructure

2. **Authentication Adaptation**
   - Modify NextAuth configuration to work with distributed services
   - Implement JWT validation at API Gateway
   - Create Identity Service with OAuth provider integration

3. **Create Core Service Templates**
   - Setup NestJS templates for each microservice
   - Implement shared libraries for validation, error handling
   - Create database schemas for each service

### Phase 2: Entity Separation (Weeks 5-8)

1. **Implement Identity Service**
   - User authentication and session management
   - OAuth provider integration
   - JWT token issuing and validation

2. **Implement Brand Service**
   - Brand profile management
   - Company verification process
   - Integration with Identity Service

3. **Implement Streamer Service**
   - Streamer profile management
   - Platform verification and integration
   - Metrics tracking for channels

4. **Migration Tool Development**
   - Develop and test data migration scripts
   - Create rollback mechanisms
   - Validate data consistency across services

### Phase 3: Core Functionality Migration (Weeks 9-14)

1. **Campaign Service Implementation**
   - Campaign creation and management
   - Budget tracking and allocation
   - Campaign assets management via Asset Service

2. **Participation Service Implementation**
   - Streamer application to campaigns
   - Approval workflows
   - Performance tracking

3. **API Gateway Setup**
   - Configure routes to appropriate services
   - Implement authentication middleware
   - Set up request/response transformation

4. **Frontend Adaptation**
   - Update API client to use Gateway
   - Implement service-specific data fetching
   - Adapt UI components to new data structure

### Phase 4: Supporting Services (Weeks 15-18)

1. **Analytics Service Implementation**
   - Real-time metrics collection
   - Performance aggregation
   - Reporting engine

2. **Payment Service Implementation**
   - Integration with Stripe/PayPal
   - Automated payout processing
   - Financial record keeping

3. **Notification Service Implementation**
   - Email notifications
   - In-app alerts
   - Real-time updates via WebSockets

4. **Asset Service Implementation**
   - Media upload and processing
   - CDN integration for delivery
   - Asset optimization for streaming

### Phase 5: Transition and Optimization (Weeks 19-24)

1. **Dual-Writing Phase**
   - Run both architectures in parallel
   - Validate data consistency
   - Test service interactions

2. **Service-by-Service Cutover**
   - Gradually route traffic to new services
   - Monitor performance and errors
   - Perform incremental testing

3. **Performance Optimization**
   - Implement caching strategies
   - Optimize database queries
   - Tune service resource allocation

4. **Final Validation**
   - End-to-end testing
   - Load testing with simulated traffic
   - Security audit
````

## DevOps Infrastructure Setup

### Kubernetes Configuration Example

```yaml
# /k8s/identity-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: identity-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: identity-service
  template:
    metadata:
      labels:
        app: identity-service
    spec:
      containers:
      - name: identity-service
        image: ${REGISTRY}/identity-service:${VERSION}
        ports:
        - containerPort: 4001
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secrets
              key: identity-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: secret
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: nextauth-secrets
              key: secret
        - name: TWITCH_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: oauth-secrets
              key: twitch-client-id
        - name: TWITCH_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: oauth-secrets
              key: twitch-client-secret
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: oauth-secrets
              key: google-client-id
        - name: GOOGLE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: oauth-secrets
              key: google-client-secret
        - name: RABBITMQ_URL
          value: "amqp://rabbitmq-service:5672"
        readinessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 15
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: identity-service
spec:
  selector:
    app: identity-service
  ports:
  - port: 4001
    targetPort: 4001
  type: ClusterIP
```

### CI/CD Pipeline with GitHub Actions

```yaml
# /.github/workflows/identity-service.yml
name: Identity Service CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'services/identity/**'
      - '.github/workflows/identity-service.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'services/identity/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      working-directory: ./services/identity
      run: npm ci
    
    - name: Run tests
      working-directory: ./services/identity
      run: npm test
    
    - name: Build Docker image
      if: github.event_name != 'pull_request'
      uses: docker/build-push-action@v2
      with:
        context: ./services/identity
        push: false
        tags: gametriggers/identity-service:latest
        
    - name: Login to Container Registry
      if: github.event_name != 'pull_request'
      uses: docker/login-action@v1
      with:
        registry: ${{ secrets.REGISTRY }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
        
    - name: Push Docker image
      if: github.event_name != 'pull_request'
      uses: docker/build-push-action@v2
      with:
        context: ./services/identity
        push: true
        tags: ${{ secrets.REGISTRY }}/identity-service:latest
        
    - name: Deploy to Kubernetes
      if: github.event_name != 'pull_request'
      uses: actions-hub/kubectl@master
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
      with:
        args: apply -f ./k8s/identity-service.yaml
```

## Testing Strategy

### Unit Testing Example for Brand Service

```typescript
// /services/brand/test/brand.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BrandService } from '../src/brand.service';
import { RabbitMQService } from '../src/rabbitmq/rabbitmq.service';
import { Brand } from '../src/schemas/brand.schema';
import { CreateBrandDto, UpdateBrandDto } from '../src/dto';
import { Model } from 'mongoose';

const mockBrand = {
  _id: '1',
  email: 'brand@example.com',
  name: 'Test Brand',
  companyName: 'Test Company',
  industry: 'Technology',
  save: jest.fn().mockResolvedValue(this),
};

const mockRabbitMQService = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('BrandService', () => {
  let service: BrandService;
  let model: Model<Brand>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        {
          provide: getModelToken(Brand.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockBrand),
            constructor: jest.fn().mockResolvedValue(mockBrand),
            find: jest.fn().mockResolvedValue([mockBrand]),
            findOne: jest.fn().mockResolvedValue(mockBrand),
            findById: jest.fn().mockResolvedValue(mockBrand),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<BrandService>(BrandService);
    model = module.get<Model<Brand>>(getModelToken(Brand.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new brand', async () => {
      const createBrandDto: CreateBrandDto = {
        email: 'brand@example.com',
        name: 'Test Brand',
        companyName: 'Test Company',
        industry: 'Technology',
      };
      
      jest.spyOn(model, 'create').mockImplementationOnce(() => 
        Promise.resolve({
          _id: '1',
          ...createBrandDto,
        } as any)
      );
      
      const result = await service.create(createBrandDto);
      
      expect(result).toEqual({
        _id: '1',
        ...createBrandDto,
      });
      expect(mockRabbitMQService.publish).toHaveBeenCalledWith(
        'brand.created',
        expect.objectContaining({
          brandId: '1',
          email: 'brand@example.com',
          name: 'Test Brand',
          companyName: 'Test Company',
        })
      );
    });
  });
});
```

### Integration Testing Example

```typescript
// /services/brand/test/brand.controller.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { RabbitMQService } from '../src/rabbitmq/rabbitmq.service';

describe('BrandController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  
  const mockRabbitMQService = {
    publish: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    })
      .overrideProvider(RabbitMQService)
      .useValue(mockRabbitMQService)
      .overrideProvider(getModelToken('Brand'))
      .useValue({
        find: jest.fn().mockResolvedValue([
          {
            _id: '1',
            email: 'brand@example.com',
            name: 'Test Brand',
            companyName: 'Test Company',
          },
        ]),
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Generate test JWT token
    const jwtService = moduleFixture.get<JwtModule>(JwtModule);
    jwtToken = `Bearer ${jwtService.sign({
      sub: 'user-1',
      email: 'user@example.com',
      type: 'brand',
    })}`;
  });

  it('/api/brands (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/brands')
      .set('Authorization', jwtToken)
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].email).toBe('brand@example.com');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Performance Monitoring

### Prometheus Configuration

```yaml
# /monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'api-gateway'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['gateway:3000']
  
  - job_name: 'identity-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['identity-service:4001']
  
  - job_name: 'brand-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['brand-service:4002']
  
  - job_name: 'streamer-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['streamer-service:4003']
  
  - job_name: 'campaign-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['campaign-service:4004']
  
  - job_name: 'participation-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['participation-service:4005']
  
  - job_name: 'analytics-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['analytics-service:4006']
  
  - job_name: 'payment-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['payment-service:4007']
  
  - job_name: 'notification-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['notification-service:4008']
  
  - job_name: 'asset-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['asset-service:4009']
  
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq-exporter:9419']
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "id": null,    "title": "Gametriggers Microservices Overview",
    "tags": ["microservices", "gametriggers"],
    "timezone": "browser",
    "schemaVersion": 16,
    "version": 0,
    "refresh": "10s",
    "panels": [
      {
        "title": "Service Response Times",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum{job=~\".*service\"}[5m]) / rate(http_request_duration_seconds_count{job=~\".*service\"}[5m])",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": {
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 8
        }
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=~\".*service\"}[1m])) by (job)",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": {
          "x": 12,
          "y": 0,
          "w": 12,
          "h": 8
        }
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\", job=~\".*service\"}[1m])) by (job) / sum(rate(http_requests_total{job=~\".*service\"}[1m])) by (job)",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": {
          "x": 0,
          "y": 8,
          "w": 12,
          "h": 8
        }
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=~\".*service\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "gridPos": {
          "x": 12,
          "y": 8,
          "w": 12,
          "h": 8
        }
      }
    ]
  }
}
```

## Cost Estimation and Resource Planning

### Estimated Resources per Service

| Service | CPU | Memory | Storage | Monthly Cost Estimate |
|---------|-----|--------|---------|----------------------|
| Identity Service | 0.5-1 CPU | 512MB-1GB | 10GB | $25-50 |
| Brand Service | 0.25-0.5 CPU | 256-512MB | 5GB | $15-30 |
| Streamer Service | 0.5-1 CPU | 512MB-1GB | 10GB | $25-50 |
| Campaign Service | 0.5-1 CPU | 512MB-1GB | 20GB | $30-60 |
| Participation Service | 0.5-1 CPU | 512MB-1GB | 20GB | $30-60 |
| Analytics Service | 1-2 CPU | 2-4GB | 50GB+ | $100-200 |
| Payment Service | 0.5-1 CPU | 512MB-1GB | 10GB | $25-50 |
| Notification Service | 0.25-0.5 CPU | 256-512MB | 5GB | $15-30 |
| Asset Service | 1-2 CPU | 1-2GB | 100GB+ | $80-150 |
| API Gateway | 1-2 CPU | 1-2GB | 5GB | $50-100 |
| Databases | 2-4 CPU | 4-8GB | 200GB+ | $200-400 |
| Message Broker | 1-2 CPU | 2-4GB | 20GB | $50-100 |
| Monitoring | 1-2 CPU | 2-4GB | 50GB | $50-100 |
| **Total** | **10-20 CPU** | **15-30GB** | **500GB+** | **$695-1,480** |

### Scalability Considerations

1. **High-Traffic Services**: Analytics, Asset, and API Gateway services should be configured for auto-scaling
2. **Database Scaling**: 
   - MongoDB replica sets for each service
   - TimescaleDB clustering for Analytics
   - PostgreSQL with read replicas for Payment
3. **CDN Integration**: For Asset Service to reduce load and improve delivery speed
4. **Caching Layer**: Redis for frequently accessed data

## Timeline and Milestones

### Month 1: Foundation
- Complete infrastructure setup
- Implement Identity Service with NextAuth integration
- Establish CI/CD pipelines
- Set up monitoring infrastructure

### Month 2: Core Entity Separation
- Complete Brand Service
- Complete Streamer Service
- Develop and test data migration tools
- Begin API Gateway configuration

### Month 3: Campaign Management
- Implement Campaign Service
- Implement Participation Service
- Complete API Gateway setup
- Update frontend to connect to new services

### Month 4: Supporting Services
- Implement Analytics Service
- Implement Payment Service
- Implement Notification Service
- Implement Asset Service

### Month 5: Integration and Testing
- Complete integration testing
- Perform security audits
- Conduct load testing
- Begin dual-writing phase

### Month 6: Transition and Optimization
- Complete service-by-service cutover
- Optimize performance and resource usage
- Decommission monolithic components
- Complete documentation and training

## Risk Assessment and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|------------|---------------------|
| Data loss during migration | High | Low | Multiple backups, test migrations with cloned data, dual-writing period |
| Service downtime | High | Medium | Blue-green deployment, graceful degradation, fallback to monolith |
| Performance degradation | Medium | Medium | Extensive load testing, performance monitoring, optimization sprints |
| Authentication failures | High | Low | Thorough testing of NextAuth integration, maintain fallback mechanisms |
| Integration issues | Medium | High | Comprehensive integration tests, service contracts, API versioning |
| Cost overruns | Medium | Medium | Regular cost monitoring, incremental scaling, optimize resource usage |
| Security vulnerabilities | High | Low | Security audits, penetration testing, automated vulnerability scanning |

## Conclusion

This implementation plan provides a comprehensive roadmap for scaling the Gametriggers platform from a monolithic architecture to a microservices-based system while preserving NextAuth for authentication and separating brands and streamers into distinct entities.

By following this plan, you can achieve a gradual, controlled migration that minimizes disruption to existing users while enabling significantly improved scalability and specialization of platform components.

The proposed architecture leverages industry best practices for microservices, including:
- Service isolation and independence
- Appropriate database selection per service requirements
- Event-driven communication for loosely-coupled services
- Centralized authentication with distributed validation
- Comprehensive monitoring and observability

This strategy will position the platform for sustainable growth while providing the flexibility to evolve individual components as business requirements change.
