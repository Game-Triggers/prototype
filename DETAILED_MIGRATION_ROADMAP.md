# Detailed Migration Roadmap & Implementation Plan

## Executive Summary

This document provides a comprehensive migration roadmap mapping your current Gametriggers monolithic codebase to the new microservices architecture. It identifies exactly which parts of your existing code need to be migrated to which services and provides step-by-step implementation plans.

## Table of Contents

1. [Current Codebase Analysis](#current-codebase-analysis)
2. [Service-by-Service Migration Mapping](#service-by-service-migration-mapping)
3. [Database Schema Migration](#database-schema-migration)
4. [Frontend Component Migration](#frontend-component-migration)
5. [Phase-by-Phase Implementation Plan](#phase-by-phase-implementation-plan)
6. [Migration Scripts & Tools](#migration-scripts--tools)
7. [Testing Strategy](#testing-strategy)
8. [Risk Mitigation](#risk-mitigation)

## Current Codebase Analysis

### Existing Backend Modules (backend/src/modules/)
```
├── admin/              → Admin Service
├── analytics/          → Analytics Service  
├── auth/               → Identity Service
├── campaigns/          → Campaign Service
├── conflict-rules/     → Admin Service (business rules)
├── earnings/           → Payment Service
├── impression-tracking/ → Analytics Service
├── overlay/            → Overlay Service
├── stream-verification/ → Streamer Service
├── upload/             → Asset Service
├── users/              → Identity + Brand + Streamer Services
└── wallet/             → Payment Service
```

### Existing Schemas (schemas/)
```
├── auth-session.schema.ts    → Identity Service
├── billing.schema.ts         → Payment Service
├── campaign.schema.ts        → Campaign Service
├── campaign-participation.ts → Participation Service
├── conflict-rules.schema.ts  → Admin Service
├── kyc.schema.ts            → Brand + Streamer Services
├── user.schema.ts           → Identity + Brand + Streamer Services
└── wallet.schema.ts         → Payment Service
```

### Frontend Structure (app/)
```
├── dashboard/          → Split into Brand + Streamer + Admin Portals
├── auth/              → Landing Site
├── api/               → API Gateway routes
└── components/        → Shared UI Package
```

## Service-by-Service Migration Mapping

### 1. Identity Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/auth/
TO: services/identity/src/modules/auth/

FROM: backend/src/modules/users/ (auth-related parts)
TO: services/identity/src/modules/users/

FROM: schemas/auth-session.schema.ts
TO: services/identity/src/schemas/

FROM: schemas/user.schema.ts (basic user fields only)
TO: services/identity/src/schemas/user.schema.ts
```

#### **Specific Files to Migrate:**
- `backend/src/modules/auth/auth.controller.ts` → `services/identity/src/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts` → `services/identity/src/auth/auth.service.ts`
- `backend/src/modules/auth/auth.module.ts` → `services/identity/src/auth/auth.module.ts`
- `backend/src/modules/users/users.controller.ts` (login/register methods) → `services/identity/src/users/users.controller.ts`

#### **New User Schema (Identity Service):**
```typescript
// services/identity/src/schemas/user.schema.ts
interface BaseUser {
  _id: ObjectId;
  email: string;
  name?: string;
  image?: string;
  password?: string; // hashed
  userType: 'brand' | 'streamer' | 'admin';
  authProvider: 'google' | 'twitch' | 'email';
  authProviderId?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Brand Service

#### **Source Code to Migrate:**
```
FROM: schemas/user.schema.ts (brand-specific fields)
TO: services/brand/src/schemas/brand.schema.ts

FROM: backend/src/modules/users/ (brand profile management)
TO: services/brand/src/modules/brand/

FROM: schemas/kyc.schema.ts (brand KYC)
TO: services/brand/src/schemas/kyc.schema.ts
```

#### **Brand Schema Migration:**
```typescript
// Current user.schema.ts brand fields to extract:
{
  role: 'brand',
  // Company information
  companyName?: string,
  industry?: string,
  website?: string,
  // Contact information  
  contactPerson?: {...},
  // Business verification
  businessVerified?: boolean,
  // Marketing preferences
  targetAudience?: string[],
  contentCategories?: string[],
}

// New Brand Schema:
interface Brand {
  _id: ObjectId;
  userId: ObjectId; // Reference to Identity Service
  email: string; // Denormalized for quick access
  companyInfo: {
    name: string;
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'enterprise';
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
    budgetRange: { min: number; max: number; };
    regions: string[];
  };
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    documents: string[];
    verifiedAt?: Date;
  };
  campaigns: ObjectId[]; // References to campaigns
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Streamer Service

#### **Source Code to Migrate:**
```
FROM: schemas/user.schema.ts (streamer-specific fields)
TO: services/streamer/src/schemas/streamer.schema.ts

FROM: backend/src/modules/stream-verification/
TO: services/streamer/src/modules/verification/

FROM: backend/src/modules/users/ (streamer profile management)
TO: services/streamer/src/modules/streamer/
```

#### **Streamer Schema Migration:**
```typescript
// Current user.schema.ts streamer fields to extract:
{
  role: 'streamer',
  channelUrl?: string,
  category?: string[],
  language?: string[],
  description?: string,
  overlaySettings?: {...},
  overlayToken?: string,
  campaignSelectionStrategy?: string,
  campaignRotationSettings?: {...},
}

// New Streamer Schema:
interface Streamer {
  _id: ObjectId;
  userId: ObjectId; // Reference to Identity Service
  email: string; // Denormalized
  displayName: string;
  platforms: [{
    type: 'twitch' | 'youtube' | 'tiktok';
    username: string;
    channelId: string;
    channelUrl: string;
    verified: boolean;
    metrics: {
      followers: number;
      averageViewers: number;
      totalViews: number;
    };
    oauth: {
      accessToken: string; // Encrypted
      refreshToken: string; // Encrypted
      expiresAt: Date;
    };
  }];
  content: {
    primaryCategory: string;
    secondaryCategories: string[];
    language: string;
    rating: 'everyone' | 'teen' | 'mature';
  };
  overlaySettings: {
    position: string;
    size: string;
    opacity: number;
    backgroundColor: string;
  };
  campaignPreferences: {
    selectionStrategy: string;
    rotationSettings: object;
  };
  participations: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Campaign Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/campaigns/
TO: services/campaign/src/modules/campaign/

FROM: schemas/campaign.schema.ts
TO: services/campaign/src/schemas/campaign.schema.ts

FROM: schemas/campaign-participation.schema.ts (campaign side)
TO: services/campaign/src/schemas/
```

#### **No Major Schema Changes Required:**
The existing campaign schema is already well-structured for microservices:
```typescript
// Minor updates needed:
interface Campaign {
  // ...existing fields...
  brandId: ObjectId; // Keep as reference
  participations: ObjectId[]; // References to Participation Service
  assets: ObjectId[]; // References to Asset Service
}
```

### 5. Participation Service

#### **Source Code to Migrate:**
```
FROM: schemas/campaign-participation.schema.ts
TO: services/participation/src/schemas/participation.schema.ts

FROM: backend/src/modules/campaigns/ (participation logic)
TO: services/participation/src/modules/participation/
```

### 6. Analytics Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/analytics/
TO: services/analytics/src/modules/analytics/

FROM: backend/src/modules/impression-tracking/
TO: services/analytics/src/modules/tracking/
```

### 7. Payment Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/earnings/
TO: services/payment/src/modules/earnings/

FROM: backend/src/modules/wallet/
TO: services/payment/src/modules/wallet/

FROM: schemas/billing.schema.ts
TO: services/payment/src/schemas/billing.schema.ts

FROM: schemas/wallet.schema.ts
TO: services/payment/src/schemas/wallet.schema.ts
```

### 8. Asset Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/upload/
TO: services/asset/src/modules/upload/
```

### 9. Overlay Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/overlay/
TO: services/overlay/src/modules/overlay/

FROM: schemas/user.schema.ts (overlay-related fields)
TO: services/overlay/src/schemas/overlay-settings.schema.ts
```

### 10. Admin Service

#### **Source Code to Migrate:**
```
FROM: backend/src/modules/admin/
TO: services/admin/src/modules/admin/

FROM: backend/src/modules/conflict-rules/
TO: services/admin/src/modules/rules/

FROM: schemas/conflict-rules.schema.ts
TO: services/admin/src/schemas/rules.schema.ts
```

### 11. Notification Service

#### **New Service - No Existing Code:**
Current notification logic is scattered across modules and needs to be centralized.

## Database Schema Migration

### Phase 1: Schema Extraction Script

```typescript
// migration/extract-schemas.ts
import { MongoClient } from 'mongodb';

interface MigrationResult {
  brands: any[];
  streamers: any[];
  admins: any[];
  campaigns: any[];
  participations: any[];
}

export async function extractAndTransformSchemas(): Promise<MigrationResult> {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  
  const db = client.db();
  
  // Extract users and separate by role
  const users = await db.collection('users').find({}).toArray();
  const brands = [];
  const streamers = [];
  const admins = [];
  
  for (const user of users) {
    const baseUser = {
      _id: user._id,
      userId: user._id, // Reference to identity service
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    if (user.role === 'brand') {
      brands.push({
        ...baseUser,
        companyInfo: {
          name: user.companyName || '',
          industry: user.industry || '',
          website: user.website || '',
        },
        contactPerson: {
          name: user.name || '',
          position: user.contactPosition || '',
          phone: user.contactPhone || '',
        },
        preferences: {
          targetAudience: user.targetAudience || [],
          contentCategories: user.category || [],
          budgetRange: { min: 0, max: 10000 },
          regions: user.regions || [],
        },
        verification: {
          status: user.businessVerified ? 'verified' : 'pending',
          documents: [],
          verifiedAt: user.businessVerified ? new Date() : null,
        },
        campaigns: [], // Will be populated from campaigns collection
      });
    } else if (user.role === 'streamer') {
      streamers.push({
        ...baseUser,
        displayName: user.name || '',
        platforms: [{
          type: 'twitch', // Default, update based on authProvider
          username: user.name || '',
          channelId: user.authProviderId || '',
          channelUrl: user.channelUrl || '',
          verified: true,
          metrics: {
            followers: 0,
            averageViewers: 0,
            totalViews: 0,
          },
          oauth: {
            accessToken: '', // Will need to be populated
            refreshToken: '',
            expiresAt: new Date(),
          },
        }],
        content: {
          primaryCategory: user.category?.[0] || 'gaming',
          secondaryCategories: user.category?.slice(1) || [],
          language: user.language?.[0] || 'en',
          rating: 'everyone',
        },
        overlaySettings: user.overlaySettings || {
          position: 'bottom-right',
          size: 'medium',
          opacity: 80,
          backgroundColor: 'transparent',
        },
        campaignPreferences: {
          selectionStrategy: user.campaignSelectionStrategy || 'fair-rotation',
          rotationSettings: user.campaignRotationSettings || {},
        },
        participations: [], // Will be populated from campaign-participations
      });
    } else if (user.role === 'admin') {
      admins.push({
        ...baseUser,
        username: user.username || user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: 'admin',
        permissions: {
          canManageUsers: true,
          canVerifyBrands: true,
          canVerifyStreamers: true,
          canManageCampaigns: true,
          canViewFinancials: true,
          canModerateContent: true,
          canAccessAuditLogs: true,
          canManageDisputes: true,
          canConfigureSystem: user.role === 'super_admin',
        },
        lastLoginAt: user.lastLoginAt || null,
        loginAttempts: 0,
        isActive: user.isActive !== false,
        twoFactorEnabled: false,
      });
    }
  }
  
  // Extract campaigns (minimal changes needed)
  const campaigns = await db.collection('campaigns').find({}).toArray();
  
  // Extract campaign participations
  const participations = await db.collection('campaignparticipations').find({}).toArray();
  
  await client.close();
  
  return { brands, streamers, admins, campaigns, participations };
}
```

### Phase 2: Data Migration Scripts

```typescript
// migration/migrate-to-services.ts
export async function migrateToServices(data: MigrationResult) {
  // Connect to individual service databases
  const identityDb = new MongoClient(process.env.IDENTITY_DB_URI!);
  const brandDb = new MongoClient(process.env.BRAND_DB_URI!);
  const streamerDb = new MongoClient(process.env.STREAMER_DB_URI!);
  const adminDb = new MongoClient(process.env.ADMIN_DB_URI!);
  
  await Promise.all([
    identityDb.connect(),
    brandDb.connect(),
    streamerDb.connect(),
    adminDb.connect(),
  ]);
  
  // Migrate users to Identity Service
  const identityUsers = data.brands.concat(data.streamers, data.admins).map(user => ({
    _id: user._id,
    email: user.email,
    name: user.displayName || user.firstName + ' ' + user.lastName,
    userType: data.brands.includes(user) ? 'brand' : 
             data.streamers.includes(user) ? 'streamer' : 'admin',
    authProvider: 'google', // Default, update as needed
    isActive: true,
    emailVerified: true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
  
  await identityDb.db().collection('users').insertMany(identityUsers);
  
  // Migrate to service-specific databases
  await brandDb.db().collection('brands').insertMany(data.brands);
  await streamerDb.db().collection('streamers').insertMany(data.streamers);
  await adminDb.db().collection('admins').insertMany(data.admins);
  
  // Close connections
  await Promise.all([
    identityDb.close(),
    brandDb.close(),
    streamerDb.close(),
    adminDb.close(),
  ]);
}
```

## Frontend Component Migration

### Current Frontend Structure
```
app/
├── dashboard/
│   ├── page.tsx                 → Brand Portal + Streamer Portal
│   ├── layout.tsx               → Shared Layout Component
│   ├── admin/                   → Admin Portal
│   ├── analytics/               → Brand Portal + Streamer Portal + Admin Portal
│   ├── campaigns/               → Brand Portal + Streamer Portal + Admin Portal
│   ├── earnings/                → Streamer Portal + Admin Portal
│   ├── payments/                → Brand Portal + Admin Portal
│   ├── settings/                → All Portals
│   └── upload-test/             → Brand Portal
├── auth/
│   ├── register/                → Landing Site
│   └── signin/                  → Landing Site
└── api/                         → API Gateway
```

### Migration Strategy by Portal

#### **Brand Portal (frontend/apps/brand-portal/)**
```typescript
// Migrate these components:
FROM: app/dashboard/campaigns/ (brand-specific views)
TO: frontend/apps/brand-portal/app/campaigns/

FROM: app/dashboard/analytics/ (brand analytics)
TO: frontend/apps/brand-portal/app/analytics/

FROM: app/dashboard/payments/ (brand payments)
TO: frontend/apps/brand-portal/app/payments/

FROM: app/dashboard/upload-test/
TO: frontend/apps/brand-portal/app/assets/

FROM: components/campaigns/ (brand components)
TO: frontend/apps/brand-portal/components/
```

#### **Streamer Portal (frontend/apps/streamer-portal/)**
```typescript
// Migrate these components:
FROM: app/dashboard/campaigns/ (streamer-specific views)
TO: frontend/apps/streamer-portal/app/campaigns/

FROM: app/dashboard/earnings/
TO: frontend/apps/streamer-portal/app/earnings/

FROM: app/dashboard/analytics/ (streamer analytics)
TO: frontend/apps/streamer-portal/app/analytics/

FROM: components/overlay/
TO: frontend/apps/streamer-portal/components/

FROM: components/analytics/ (streamer components)
TO: frontend/apps/streamer-portal/components/
```

#### **Admin Portal (frontend/apps/admin-portal/)**
```typescript
// Migrate these components:
FROM: app/dashboard/admin/
TO: frontend/apps/admin-portal/app/

FROM: components/admin/
TO: frontend/apps/admin-portal/components/

// Create new admin-specific components:
- User management interface
- Verification workflows
- Platform analytics dashboard
- Dispute resolution interface
```

#### **Shared UI Package (frontend/packages/ui/)**
```typescript
// Migrate reusable components:
FROM: components/ui/
TO: frontend/packages/ui/src/

FROM: components/layouts/ (shared layouts)
TO: frontend/packages/ui/src/layouts/

// Components to share:
- Button, Input, Modal, Table
- Navigation components
- Form components
- Chart components
```

## Phase-by-Phase Implementation Plan

### Phase 1: Foundation & Identity Service (Weeks 1-4)

#### Week 1: Infrastructure Setup
```bash
# Tasks:
1. Create microservices directory structure
2. Set up Docker Compose for development
3. Create shared packages (types, utils, api-client)
4. Set up CI/CD pipelines

# Commands:
./setup-microservices.sh
cd microservices
npm install
./scripts/setup-local.sh
```

#### Week 2: Identity Service Implementation
```typescript
// 1. Create Identity Service structure
mkdir -p services/identity/src/{auth,users,schemas}

// 2. Migrate auth module
cp -r ../../backend/src/modules/auth/* services/identity/src/auth/

// 3. Update imports and dependencies
// services/identity/src/auth/auth.controller.ts
// Remove dependencies on other modules
// Update imports to use shared types

// 4. Create new User schema for Identity Service
// services/identity/src/schemas/user.schema.ts
```

#### Week 3: API Gateway Setup
```typescript
// 1. Implement Express-based API Gateway
// api-gateway/src/main.ts

// 2. Configure routes for Identity Service
app.use('/api/auth', createProxyMiddleware({
  target: 'http://identity-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
}));

// 3. Implement authentication middleware
// api-gateway/src/middleware/auth.ts
```

#### Week 4: NextAuth Integration
```typescript
// 1. Update NextAuth configuration
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  // Configure to work with Identity Service
  callbacks: {
    async jwt({ token, user, account }) {
      // Call Identity Service for user details
      const response = await fetch(`${process.env.IDENTITY_SERVICE_URL}/auth/user-details`);
      // Update token with user info
    }
  }
};

// 2. Test authentication flow
// 3. Update frontend API calls to use Gateway
```

### Phase 2: Entity Separation (Weeks 5-8)

#### Week 5: Brand Service
```typescript
// 1. Create Brand Service
mkdir -p services/brand/src/{brand,schemas}

// 2. Extract brand-related code from users module
// Copy relevant controller methods, services
// Create new Brand schema

// 3. Update API Gateway
app.use('/api/brands', authenticateToken(['brand']), createProxyMiddleware({
  target: 'http://brand-service:3002',
  // ...
}));
```

#### Week 6: Streamer Service
```typescript
// 1. Create Streamer Service
mkdir -p services/streamer/src/{streamer,verification,schemas}

// 2. Migrate stream-verification module
cp -r ../../backend/src/modules/stream-verification/* services/streamer/src/verification/

// 3. Create Streamer schema
// 4. Update API Gateway for streamer routes
```

#### Week 7: Data Migration Scripts
```typescript
// 1. Implement data extraction
node migration/extract-schemas.ts

// 2. Test migration with sample data
// 3. Implement dual-writing for new registrations
```

#### Week 8: Admin Service
```typescript
// 1. Create Admin Service
mkdir -p services/admin/src/{admin,rules,schemas}

// 2. Migrate admin and conflict-rules modules
cp -r ../../backend/src/modules/admin/* services/admin/src/admin/
cp -r ../../backend/src/modules/conflict-rules/* services/admin/src/rules/

// 3. Create Admin schema and permissions system
```

### Phase 3: Core Business Logic (Weeks 9-14)

#### Week 9-10: Campaign Service
```typescript
// 1. Migrate campaigns module
cp -r ../../backend/src/modules/campaigns/* services/campaign/src/campaign/

// 2. Update Campaign schema (minimal changes)
// 3. Implement campaign-brand relationship via events
// 4. Update frontend components to use new API
```

#### Week 11-12: Participation Service
```typescript
// 1. Extract participation logic from campaigns
// 2. Create Participation Service
// 3. Implement streamer application workflow
// 4. Set up event-driven communication with Campaign Service
```

#### Week 13-14: Analytics Service
```typescript
// 1. Migrate analytics and impression-tracking modules
cp -r ../../backend/src/modules/analytics/* services/analytics/src/analytics/
cp -r ../../backend/src/modules/impression-tracking/* services/analytics/src/tracking/

// 2. Set up TimescaleDB for time-series data
// 3. Implement real-time metrics collection
```

### Phase 4: Supporting Services (Weeks 15-20)

#### Week 15-16: Payment Service
```typescript
// 1. Migrate earnings and wallet modules
cp -r ../../backend/src/modules/earnings/* services/payment/src/earnings/
cp -r ../../backend/src/modules/wallet/* services/payment/src/wallet/

// 2. Set up PostgreSQL for financial data
// 3. Implement Stripe integration
// 4. Create automated payout system
```

#### Week 17-18: Asset & Overlay Services
```typescript
// 1. Migrate upload module to Asset Service
cp -r ../../backend/src/modules/upload/* services/asset/src/upload/

// 2. Migrate overlay module to Overlay Service  
cp -r ../../backend/src/modules/overlay/* services/overlay/src/overlay/

// 3. Set up S3/MinIO for file storage
// 4. Implement WebSocket connections for real-time overlay updates
```

#### Week 19-20: Notification Service
```typescript
// 1. Create new Notification Service
// 2. Extract notification logic from existing modules
// 3. Implement email, in-app, and SMS notifications
// 4. Set up RabbitMQ for event-driven notifications
```

### Phase 5: Frontend Separation (Weeks 21-26)

#### Week 21-22: Shared UI Package
```typescript
// 1. Create shared UI package
mkdir -p frontend/packages/ui/src/{components,layouts,themes}

// 2. Extract reusable components
cp -r ../../components/ui/* frontend/packages/ui/src/components/

// 3. Set up design system with themes
// 4. Create Storybook for component documentation
```

#### Week 23-24: Brand & Streamer Portals
```typescript
// 1. Create Brand Portal
npx create-next-app@latest frontend/apps/brand-portal

// 2. Create Streamer Portal  
npx create-next-app@latest frontend/apps/streamer-portal

// 3. Migrate components and pages
// 4. Set up shared authentication
// 5. Configure API clients for each portal
```

#### Week 25-26: Admin Portal & Landing Site
```typescript
// 1. Create Admin Portal
npx create-next-app@latest frontend/apps/admin-portal

// 2. Create Landing Site
npx create-next-app@latest frontend/apps/landing-site

// 3. Implement admin-specific features
// 4. Set up marketing pages and authentication flows
```

### Phase 6: Production Migration (Weeks 27-30)

#### Week 27-28: Production Environment
```yaml
# 1. Set up Kubernetes cluster
# 2. Deploy services to staging environment
# 3. Configure monitoring and logging
# 4. Set up CI/CD pipelines for production
```

#### Week 29: Data Migration
```typescript
// 1. Run full data migration in staging
// 2. Test all service integrations
// 3. Perform load testing
// 4. Validate data consistency
```

#### Week 30: Production Cutover
```typescript
// 1. Deploy to production
// 2. Switch DNS to new architecture
// 3. Monitor system performance
// 4. Decommission old monolithic backend
```

## Migration Scripts & Tools

### Script 1: Code Migration Helper
```bash
#!/bin/bash
# migrate-module.sh

MODULE_NAME=$1
SOURCE_PATH="backend/src/modules/$MODULE_NAME"
TARGET_SERVICE=$2
TARGET_PATH="microservices/services/$TARGET_SERVICE/src/modules/$MODULE_NAME"

if [ -d "$SOURCE_PATH" ]; then
    echo "Migrating $MODULE_NAME to $TARGET_SERVICE..."
    
    # Create target directory
    mkdir -p "$TARGET_PATH"
    
    # Copy files
    cp -r "$SOURCE_PATH"/* "$TARGET_PATH"/
    
    # Update imports (basic replacement)
    find "$TARGET_PATH" -name "*.ts" -exec sed -i 's|../../../schemas|../schemas|g' {} \;
    find "$TARGET_PATH" -name "*.ts" -exec sed -i 's|../../../lib|@shared/utils|g' {} \;
    
    echo "Migration complete. Please review and update imports manually."
else
    echo "Source module $MODULE_NAME not found!"
fi
```

### Script 2: Schema Migration Tool
```typescript
// tools/schema-migrator.ts
import * as fs from 'fs';
import * as path from 'path';

interface SchemaMigration {
  sourceFile: string;
  targetService: string;
  transformations: {
    removeFields?: string[];
    addFields?: Record<string, any>;
    renameFields?: Record<string, string>;
  };
}

const schemaMigrations: SchemaMigration[] = [
  {
    sourceFile: 'schemas/user.schema.ts',
    targetService: 'identity',
    transformations: {
      removeFields: ['overlaySettings', 'campaignSelectionStrategy', 'companyName'],
      addFields: {
        userType: { type: 'String', enum: ['brand', 'streamer', 'admin'] },
        emailVerified: { type: 'Boolean', default: false },
      },
    },
  },
  // Add more migrations...
];

export async function migrateSchemas() {
  for (const migration of schemaMigrations) {
    const sourceContent = fs.readFileSync(migration.sourceFile, 'utf8');
    
    // Apply transformations
    let transformedContent = sourceContent;
    
    // Remove fields
    if (migration.transformations.removeFields) {
      for (const field of migration.transformations.removeFields) {
        const regex = new RegExp(`\\s*${field}:.*?(?=,|\\})`);
        transformedContent = transformedContent.replace(regex, '');
      }
    }
    
    // Add fields (simplified implementation)
    if (migration.transformations.addFields) {
      // Insert new fields before closing brace
      // Implementation depends on schema structure
    }
    
    // Write to target service
    const targetPath = `microservices/services/${migration.targetService}/src/schemas/`;
    fs.mkdirSync(targetPath, { recursive: true });
    fs.writeFileSync(
      path.join(targetPath, path.basename(migration.sourceFile)),
      transformedContent
    );
  }
}
```

### Script 3: API Route Migration
```typescript
// tools/api-migrator.ts
export async function migrateApiRoutes() {
  const routeMappings = {
    '/api/users': [
      { pattern: '/api/users/login', target: 'identity', newPath: '/auth/login' },
      { pattern: '/api/users/profile', target: 'brand|streamer', newPath: '/profile' },
    ],
    '/api/campaigns': [
      { pattern: '/api/campaigns', target: 'campaign', newPath: '/campaigns' },
      { pattern: '/api/campaigns/:id/apply', target: 'participation', newPath: '/participations' },
    ],
    // Add more mappings...
  };
  
  // Generate API Gateway configuration
  const gatewayConfig = generateGatewayConfig(routeMappings);
  fs.writeFileSync('microservices/api-gateway/src/routes.config.ts', gatewayConfig);
}
```

## Testing Strategy

### Unit Testing Migration
```typescript
// For each migrated service, update tests:

// OLD: backend/src/modules/auth/auth.service.spec.ts
// NEW: services/identity/src/auth/auth.service.spec.ts

describe('AuthService', () => {
  // Update test to work with Identity Service only
  // Remove dependencies on other modules
  // Mock external service calls
});
```

### Integration Testing
```typescript
// tests/integration/identity-service.spec.ts
describe('Identity Service Integration', () => {
  test('should authenticate user and return JWT', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### End-to-End Testing
```typescript
// tests/e2e/user-workflow.spec.ts
describe('User Registration and Campaign Creation', () => {
  test('brand can register and create campaign', async () => {
    // Test complete workflow across services
    // 1. Register brand via Identity Service
    // 2. Complete profile via Brand Service
    // 3. Create campaign via Campaign Service
  });
});
```

## Risk Mitigation

### Data Integrity Risks
```typescript
// Implement dual-writing during migration
export class DualWriteService {
  async createUser(userData: CreateUserDto) {
    // Write to old system
    const oldResult = await this.legacyUserService.create(userData);
    
    try {
      // Write to new services
      await this.identityService.create(userData);
      if (userData.role === 'brand') {
        await this.brandService.create(userData);
      }
    } catch (error) {
      // Compensate if new system fails
      await this.legacyUserService.rollback(oldResult.id);
      throw error;
    }
    
    return oldResult;
  }
}
```

### Service Availability Risks
```typescript
// Implement circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Fall back to legacy system
      throw new Error('Service unavailable, using fallback');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Rollback Strategy
```bash
#!/bin/bash
# rollback.sh

echo "Rolling back to monolithic architecture..."

# Switch API Gateway to route to legacy backend
kubectl patch configmap api-gateway-config --patch '{"data":{"LEGACY_MODE":"true"}}'

# Scale down microservices
kubectl scale deployment --replicas=0 --selector=app=microservice

# Scale up legacy backend
kubectl scale deployment legacy-backend --replicas=3

echo "Rollback complete"
```

This migration roadmap provides a comprehensive guide for transforming your current monolithic Gametriggers platform into a scalable microservices architecture. Each phase builds upon the previous one, minimizing risk while ensuring continuous operation of your platform.
