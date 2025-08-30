# Gametriggers Monorepo Migration Guide
## From Unified App to 8-Package Monorepo Structure

### Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Phase](#setup-phase)
4. [Package Migration Guide](#package-migration-guide)
5. [Integration & Testing](#integration--testing)
6. [Deployment & Rollback](#deployment--rollback)

---

## Overview

This guide walks through migrating the Gametriggers platform from a unified Next.js + NestJS structure to a clean 8-package monorepo using pnpm workspaces and Turbo.

### Migration Goals
- ✅ Extract 8 essential shared packages
- ✅ Enable portal separation (E1/E2/E3)
- ✅ Eliminate code duplication
- ✅ Maintain backward compatibility
- ✅ Zero downtime migration

### Final Package Structure
```
packages/
├── shared-types/           # TypeScript definitions
├── shared-schemas/         # Mongoose schemas
├── shared-auth/           # Authentication & RBAC
├── shared-ui/             # Component library
├── shared-utils/          # Utilities & constants
├── shared-api/            # API client
├── shared-hooks/          # React hooks
└── shared-config/         # Configuration files
```

---

## Prerequisites

### Required Tools
```bash
# Install pnpm globally
npm install -g pnpm

# Install turbo globally
npm install -g turbo

# Verify installations
pnpm --version  # Should be 8.0+
turbo --version # Should be 1.10+
```

### Environment Setup
```bash
# Create backup branch
git checkout -b backup-pre-monorepo
git push origin backup-pre-monorepo

# Switch to working branch
git checkout dev-himanshu-monorepo
```

---

## Setup Phase

### Step 1: Initialize Workspace Configuration

Update the root `package.json`:

```json
{
  "name": "gametriggers-workspace",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:unified": "node server.js",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### Step 2: Update pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"
  # Remove these after migration:
  - "schemas"      # Will become packages/shared-schemas
  - "backend"      # Will become apps/backend
```

### Step 3: Enhanced Turbo Configuration

Update `turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "globalDependencies": ["**/.env.*local", "**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"],
      "env": ["NODE_ENV", "NEXT_PUBLIC_*"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Step 4: Create Package Directories

```bash
# Create all package directories
mkdir -p packages/{shared-types,shared-schemas,shared-auth,shared-ui,shared-utils,shared-api,shared-hooks,shared-config}/src

# Create apps directory for future portal separation
mkdir -p apps
```

---

## Package Migration Guide

## 📦 Package 1: @gametriggers/shared-types

### Overview
Extract all TypeScript types, interfaces, and enums into a centralized package.

### Current Locations to Extract From
```
lib/schema-types.ts                    # Main types file
types/next-auth.d.ts                  # NextAuth type extensions
schemas/*/schema.ts                   # Interface definitions
backend/src/types/mongoose-helpers.d.ts # Database helpers
```

### Implementation Steps

#### 1. Create Package Structure
```bash
cd packages/shared-types
```

#### 2. Create package.json
```json
{
  "name": "@gametriggers/shared-types",
  "version": "0.1.0",
  "description": "Shared TypeScript types and interfaces for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "require": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./mongoose": {
      "import": "./src/mongoose-helpers.ts",
      "require": "./src/mongoose-helpers.ts",
      "types": "./src/mongoose-helpers.ts"
    }
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "mongoose": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 3. Create TypeScript Config
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

#### 4. Extract Code Files

**Create `src/index.ts`:**
```typescript
// Re-export all types
export * from './auth-types';
export * from './campaign-types';
export * from './user-types';
export * from './wallet-types';
export * from './notification-types';
export * from './kyc-types';
export * from './billing-types';

// Re-export mongoose helpers
export * from './mongoose-helpers';
```

**Create `src/auth-types.ts`:**
```typescript
// Extract from lib/schema-types.ts
export enum UserRole {
  STREAMER = 'streamer',
  BRAND = 'brand',
  ADMIN = 'admin',
}

export enum AuthProvider {
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
  EMAIL = 'email',
}

// Add NextAuth type extensions
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  accessToken?: string;
  refreshToken?: string;
}
```

**Create `src/campaign-types.ts`:**
```typescript
// Extract from lib/schema-types.ts
export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ParticipationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  LEFT_EARLY = 'left_early',
  REMOVED = 'removed',
  PARTICIPATION_PAUSED = 'participation_paused',
}

export interface ICampaignData {
  _id?: string;
  title: string;
  description?: string;
  brandId: string;
  budget: number;
  remainingBudget: number;
  mediaUrl: string;
  mediaType: MediaType;
  status: CampaignStatus;
  categories?: string[];
  languages?: string[];
  startDate?: Date;
  endDate?: Date;
  paymentRate: number;
  paymentType: 'cpm' | 'fixed';
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Create `src/user-types.ts`:**
```typescript
export interface IUserData {
  _id?: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  authProvider: AuthProvider;
  authProviderId?: string;
  channelUrl?: string;
  category?: string[];
  language?: string[];
  description?: string;
  isActive?: boolean;
  // Gamification fields
  streakCurrent?: number;
  streakLongest?: number;
  streakLastDate?: Date | null;
  energyPacks?: {
    current: number;
    maximum: number;
    lastReset: Date;
    dailyUsed: number;
  };
  xp?: {
    total: number;
    level: number;
    earnedToday: number;
    lastEarned: Date | null;
  };
  rp?: {
    total: number;
    earnedToday: number;
    lastEarned: Date | null;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Create `src/wallet-types.ts`:**
```typescript
export enum WalletType {
  BRAND = 'brand',
  STREAMER = 'streamer',
  PLATFORM = 'platform'
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  CAMPAIGN_RESERVE = 'campaign_reserve',
  CAMPAIGN_CHARGE = 'campaign_charge',
  CAMPAIGN_REFUND = 'campaign_refund',
  EARNINGS_CREDIT = 'earnings_credit',
  EARNINGS_HOLD = 'earnings_hold',
  EARNINGS_RELEASE = 'earnings_release',
  PLATFORM_FEE = 'platform_fee',
  DISPUTE_HOLD = 'dispute_hold',
  DISPUTE_RELEASE = 'dispute_release'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet'
}

export interface IWallet {
  _id?: string;
  userId: string;
  walletType: WalletType;
  balance: number;
  reservedBalance: number;
  withdrawableBalance: number;
  heldBalance?: number;
  totalEarnings?: number;
  totalSpent?: number;
  currency: string;
  isActive: boolean;
  autoTopupEnabled?: boolean;
  autoTopupThreshold?: number;
  autoTopupAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransaction {
  _id?: string;
  walletId: string;
  userId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  externalTransactionId?: string;
  campaignId?: string;
  description: string;
  metadata?: any;
  balanceAfter: number;
  reservedBalanceAfter: number;
  withdrawableBalanceAfter: number;
  processedAt?: Date;
  expiresAt?: Date;
  createdBy: string;
  approvedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Create `src/mongoose-helpers.ts`:**
```typescript
// Extract from backend/src/types/mongoose-helpers.d.ts
import { Document, Types } from 'mongoose';
import { IUserData, ICampaignData } from './index';

export interface IUserDocument extends Omit<IUserData, '_id'>, Document {
  _id: Types.ObjectId;
  role: UserRole;
  email: string;
  name: string;
}

export interface ICampaignDocument extends Omit<ICampaignData, '_id' | 'brandId'>, Document {
  _id: Types.ObjectId;
  brandId: Types.ObjectId;
}

export function isMongooseDocument(obj: any): obj is Document {
  return obj && typeof obj === 'object' && obj._id && obj.__v !== undefined;
}

export function ensureDocument<T extends object>(doc: any): T {
  if (!isMongooseDocument(doc)) {
    throw new Error('Expected a Mongoose document');
  }
  return doc as T;
}
```

#### 5. Update Root TypeScript Paths

Update `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    // ...existing config
    "paths": {
      "@gametriggers/shared-types": ["packages/shared-types/src/index"],
      "@gametriggers/shared-types/*": ["packages/shared-types/src/*"],
      // ...other paths
    }
  }
}
```

---

## 📦 Package 2: @gametriggers/shared-utils

### Overview
Consolidate utility functions, constants, and helper methods.

### Current Locations to Extract From
```
lib/utils.ts                          # Styling utilities
lib/xp-constants.ts                   # XP system constants
lib/rp-constants.ts                   # RP system constants
lib/level-constants.ts                # Level progression
lib/currency-config.ts                # Currency utilities
backend/src/constants/               # Backend constants
```

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-utils",
  "version": "0.1.0",
  "description": "Shared utilities and constants for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "require": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./styling": {
      "import": "./src/styling.ts",
      "require": "./src/styling.ts",
      "types": "./src/styling.ts"
    },
    "./constants": {
      "import": "./src/constants/index.ts",
      "require": "./src/constants/index.ts",
      "types": "./src/constants/index.ts"
    }
  },
  "dependencies": {
    "clsx": "^1.2.1",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 2. Extract Code Files

**Create `src/index.ts`:**
```typescript
// Re-export all utilities
export * from './styling';
export * from './formatters';
export * from './validators';
export * from './constants';
```

**Create `src/styling.ts`:**
```typescript
// Extract from lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Create `src/constants/index.ts`:**
```typescript
export * from './xp-constants';
export * from './rp-constants';
export * from './level-constants';
export * from './currency-config';
```

**Create `src/constants/xp-constants.ts`:**
```typescript
// Extract from lib/xp-constants.ts
export const XP_REWARDS = {
  SIGNUP: 10,
  // Future activities can be added here
} as const;

export const XP_LEVELS = {
  BASE_XP_PER_LEVEL: 100,
  LEVEL_MULTIPLIER: 1.5,
  MAX_LEVEL: 100,
} as const;

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(XP_LEVELS.BASE_XP_PER_LEVEL * Math.pow(XP_LEVELS.LEVEL_MULTIPLIER, i - 2));
  }
  return totalXP;
}

export function getLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  
  let level = 1;
  let requiredXP = 0;
  
  while (requiredXP <= xp && level < XP_LEVELS.MAX_LEVEL) {
    level++;
    requiredXP = getXPForLevel(level);
  }
  
  return level - 1;
}
```

**Create `src/formatters.ts`:**
```typescript
// Currency formatting utilities
export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// Date formatting utilities
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleDateString('en-IN');
}

// Number formatting utilities
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}
```

---

## 📦 Package 3: @gametriggers/shared-config

### Overview
Centralize configuration files for consistent tooling across packages.

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-config",
  "version": "0.1.0",
  "description": "Shared configuration files for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "files": [
    "src/**",
    "eslint/**",
    "typescript/**"
  ],
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### 2. Create Configuration Files

**Create `eslint/base.js`:**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules', '.next'],
};
```

**Create `typescript/base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    "composite": true
  }
}
```

---

## 📦 Package 4: @gametriggers/shared-schemas

### Overview
Extract all Mongoose schemas and database models.

### Current Locations to Extract From
```
schemas/                              # All schema files
  ├── user.schema.ts                 # User model
  ├── campaign.schema.ts             # Campaign model
  ├── wallet.schema.ts               # Wallet & transaction models
  ├── kyc.schema.ts                  # KYC verification model
  ├── billing.schema.ts              # Billing & dispute models
  ├── notification.schema.ts         # Notification model
  └── auth-session.schema.ts         # Auth session model
```

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-schemas",
  "version": "0.1.0",
  "description": "Mongoose schemas for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@gametriggers/shared-types": "workspace:*",
    "mongoose": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 2. Extract Schema Files

**Create `src/index.ts`:**
```typescript
// Re-export all schemas
export * from './user.schema';
export * from './campaign.schema';
export * from './wallet.schema';
export * from './kyc.schema';
export * from './billing.schema';
export * from './notification.schema';
export * from './auth-session.schema';
```

**Create `src/user.schema.ts`:**
```typescript
import { Schema, model, Model, models } from 'mongoose';
import { UserRole, AuthProvider, IUserData } from '@gametriggers/shared-types';

// Extend the interface for Mongoose document
export interface IUser extends IUserData {
  password?: string;
  isActive?: boolean;
  // ... other fields from original schema
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      required: true,
    },
    // ... rest of schema from original file
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ authProvider: 1 });

export const UserSchema = userSchema;

export function getUserModel(): Model<IUser> | null {
  if (typeof window === 'undefined') {
    return models.User || model<IUser>('User', userSchema);
  }
  return null as any;
}

export const User = getUserModel();
```

**Note**: Repeat similar extraction for all other schema files, maintaining the same pattern.

---

## 📦 Package 5: @gametriggers/shared-auth

### Overview
Extract authentication, authorization, and role management.

### Current Locations to Extract From
```
lib/auth.ts                           # NextAuth configuration
lib/eureka-roles.ts                   # RBAC system (600+ lines)
lib/role-validation.ts                # Role validation utilities
middleware.ts                         # Authentication middleware
```

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-auth",
  "version": "0.1.0",
  "description": "Authentication and authorization for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@gametriggers/shared-types": "workspace:*",
    "next-auth": "^4.21.1",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### 2. Extract Auth Files

**Create `src/index.ts`:**
```typescript
// Main auth exports
export * from './next-auth-config';
export * from './eureka-roles';
export * from './role-validation';
export * from './middleware';
export * from './providers';
```

**Create `src/eureka-roles.ts`:**
```typescript
// Extract complete content from lib/eureka-roles.ts
// This is a large file (600+ lines) - copy entire content

export enum Portal {
  BRAND = 'brand',
  ADMIN = 'admin',
  PUBLISHER = 'publisher'
}

export enum RoleCategory {
  SUPER_ADMIN = 'super_admin',
  MANAGEMENT = 'management',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  SUPPORT = 'support',
  END_USER = 'end_user'
}

export enum EurekaRole {
  // E1: Brand Portal Roles
  MARKETING_HEAD = 'marketing_head',
  MARKETING_MANAGER = 'marketing_manager',
  CAMPAIGN_MANAGER = 'campaign_manager',
  FINANCE_MANAGER = 'finance_manager',
  BRAND_ANALYST = 'brand_analyst',
  
  // E2: Admin Portal Roles
  SUPER_ADMIN = 'super_admin',
  PLATFORM_ADMIN = 'platform_admin',
  OPERATIONS_MANAGER = 'operations_manager',
  SUPPORT_AGENT = 'support_agent',
  CONTENT_MODERATOR = 'content_moderator',
  
  // E3: Publisher Portal Roles
  PREMIUM_STREAMER = 'premium_streamer',
  VERIFIED_STREAMER = 'verified_streamer',
  REGULAR_STREAMER = 'regular_streamer',
  NETWORK_MANAGER = 'network_manager',
  AFFILIATE_MANAGER = 'affiliate_manager',
}

// ... rest of the eureka-roles.ts content
```

**Create `src/next-auth-config.ts`:**
```typescript
// Extract NextAuth configuration from lib/auth.ts
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Extract authorize logic from lib/auth.ts
        // ... implementation
      },
    }),
  ],
  callbacks: {
    // Extract callbacks from lib/auth.ts
    // ... implementation
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

---

## 📦 Package 6: @gametriggers/shared-ui

### Overview
Extract UI component library with consistent styling.

### Current Locations to Extract From
```
components/ui/                        # All UI components (30+ files)
  ├── button.tsx                     # Button component
  ├── card.tsx                       # Card components
  ├── input.tsx                      # Input components
  ├── dialog.tsx                     # Modal/Dialog components
  └── ... (27+ more components)
components/theme-provider.tsx         # Theme provider
```

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-ui",
  "version": "0.1.0",
  "description": "UI component library for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@gametriggers/shared-utils": "workspace:*",
    "@radix-ui/react-alert-dialog": "^1.0.4",
    "@radix-ui/react-avatar": "^1.0.3",
    "@radix-ui/react-dialog": "^1.0.4",
    "@radix-ui/react-dropdown-menu": "^2.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^1.2.2",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.6",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.263.1",
    "next-themes": "^0.2.1",
    "react": "^18.0.0",
    "sonner": "^1.0.3"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### 2. Extract Component Files

**Create `src/index.ts`:**
```typescript
// Export all UI components
export * from './components/button';
export * from './components/card';
export * from './components/input';
export * from './components/dialog';
export * from './components/form';
export * from './components/badge';
export * from './components/avatar';
export * from './components/alert';
export * from './components/dropdown-menu';
export * from './components/label';
export * from './components/select';
export * from './components/separator';
export * from './components/switch';
export * from './components/table';
export * from './components/tabs';
export * from './components/textarea';
export * from './components/tooltip';
export * from './components/skeleton';
export * from './components/progress';

// Export providers
export * from './providers/theme-provider';

// Domain-specific components
export * from './components/campaign-card';
export * from './components/xp-display';
export * from './components/rp-display';
export * from './components/level-display';
export * from './components/energy-pack';
export * from './components/streak';
export * from './components/earnings-overview';
```

**Create `src/components/button.tsx`:**
```typescript
// Extract from components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@gametriggers/shared-utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Note**: Extract all other UI components following the same pattern.

**Create `src/providers/theme-provider.tsx`:**
```typescript
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

---

## 📦 Package 7: @gametriggers/shared-hooks

### Overview
Extract React hooks and context providers.

### Current Locations to Extract From
```
lib/hooks/                            # Custom hooks
  ├── use-eureka-roles.tsx            # Role management hook
  └── use-notifications.ts            # Notification hook
lib/contexts/                         # React contexts
  ├── xp-context.tsx                  # XP system context
  ├── rp-context.tsx                  # RP system context
  ├── level-context.tsx               # Level system context
  └── energy-pack-context.tsx         # Energy pack context
```

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-hooks",
  "version": "0.1.0",
  "description": "React hooks and context providers for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@gametriggers/shared-auth": "workspace:*",
    "@gametriggers/shared-types": "workspace:*",
    "@gametriggers/shared-utils": "workspace:*",
    "next-auth": "^4.21.1",
    "react": "^18.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "next-auth": ">=4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### 2. Extract Hook Files

**Create `src/index.ts`:**
```typescript
// Export all hooks and contexts
export * from './hooks/use-eureka-roles';
export * from './hooks/use-notifications';

export * from './contexts/xp-context';
export * from './contexts/rp-context';
export * from './contexts/level-context';
export * from './contexts/energy-pack-context';
```

**Create `src/hooks/use-eureka-roles.tsx`:**
```typescript
// Extract from lib/hooks/use-eureka-roles.tsx
"use client";

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  EurekaRole,
  Permission,
  RoleManager,
  Portal,
  RoleCategory,
} from '@gametriggers/shared-auth';

export function useEurekaRole() {
  const { data: session, status } = useSession();

  const roleInfo = useMemo(() => {
    if (!session?.user?.role) {
      return {
        role: null,
        eurekaRole: null,
        portal: null,
        permissions: [],
        isLoading: status === 'loading',
        isAuthenticated: false,
        canDelete: false,
        canSuspend: false,
      };
    }

    const eurekaRole = mapLegacyRole(session.user.role);
    const portal = RoleManager.getPortal(eurekaRole);
    const permissions = RoleManager.getPermissions(eurekaRole);

    return {
      role: session.user.role,
      eurekaRole,
      portal,
      permissions,
      isLoading: false,
      isAuthenticated: true,
      canDelete: RoleManager.canDelete(eurekaRole),
      canSuspend: RoleManager.canSuspend(eurekaRole),
    };
  }, [session, status]);

  return roleInfo;
}

// Helper function to map legacy roles to Eureka roles
function mapLegacyRole(legacyRole: string): EurekaRole {
  switch (legacyRole) {
    case 'admin':
      return EurekaRole.SUPER_ADMIN;
    case 'brand':
      return EurekaRole.MARKETING_MANAGER;
    case 'streamer':
      return EurekaRole.REGULAR_STREAMER;
    default:
      return EurekaRole.REGULAR_STREAMER;
  }
}
```

**Create `src/contexts/xp-context.tsx`:**
```typescript
// Extract from lib/contexts/xp-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface XPData {
  total: number;
  level: number;
  earnedToday: number;
  lastEarned: Date | null;
  activities: Array<{
    type: string;
    amount: number;
    earnedAt: Date;
  }>;
}

interface XPContextType {
  xpData: XPData | null;
  loading: boolean;
  addXP: (activityType: string, amount: number) => Promise<void>;
  refreshXP: () => Promise<void>;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export function XPProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [xpData, setXPData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchXPData = useCallback(async () => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setXPData(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/xp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setXPData(data.xp);
      }
    } catch (error) {
      console.error('Failed to fetch XP data:', error);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    fetchXPData();
  }, [fetchXPData]);

  const addXP = useCallback(async (activityType: string, amount: number) => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/users/me/xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityType, amount }),
      });

      if (response.ok) {
        await fetchXPData(); // Refresh data after adding XP
      }
    } catch (error) {
      console.error('Failed to add XP:', error);
    }
  }, [session, fetchXPData]);

  const value = {
    xpData,
    loading,
    addXP,
    refreshXP: fetchXPData,
  };

  return <XPContext.Provider value={value}>{children}</XPContext.Provider>;
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP must be used within a XPProvider');
  }
  return context;
}
```

---

## 📦 Package 8: @gametriggers/shared-api

### Overview
Extract API client with authentication integration.

### Current Locations to Extract From
```
lib/api-client.ts                     # Main API client (600+ lines)
lib/api-route.json                    # API route definitions
```

### Implementation Steps

#### 1. Create package.json
```json
{
  "name": "@gametriggers/shared-api",
  "version": "0.1.0",
  "description": "API client for Gametriggers platform",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@gametriggers/shared-types": "workspace:*",
    "next-auth": "^4.21.1"
  },
  "peerDependencies": {
    "next-auth": ">=4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 2. Extract API Files

**Create `src/index.ts`:**
```typescript
export * from './api-client';
export * from './endpoints';
export * from './types';
```

**Create `src/api-client.ts`:**
```typescript
// Extract from lib/api-client.ts
import { IUserData, ICampaignData } from '@gametriggers/shared-types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window === "undefined"
    ? "http://localhost:3001/api/v1"
    : "/api");

export interface APIResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Extract and properly format the authorization header if present
  const auth =
    options.headers && "Authorization" in options.headers
      ? (options.headers["Authorization"] as string)
      : null;

  if (auth) {
    headers["Authorization"] = auth.startsWith("Bearer ")
      ? auth
      : `Bearer ${auth}`;
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-error"));
      throw new Error("Authentication failed. Please sign in again.");
    }

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export const apiClient = {
  // Auth endpoints
  auth: {
    register: async (userData: {
      name: string;
      companyName: string;
      email: string;
      password: string;
      role: string;
    }) => {
      return fetchApi<{ user: IUserData; accessToken: string; refreshToken: string }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );
    },

    login: async (credentials: { email: string; password: string }) => {
      return fetchApi<{ user: IUserData; accessToken: string; refreshToken: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        }
      );
    },
  },

  // User endpoints
  users: {
    me: () => fetchApi<IUserData>("/users/me"),
    
    updateProfile: (data: Partial<IUserData>) =>
      fetchApi<IUserData>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // Campaign endpoints
  campaigns: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<{ campaigns: ICampaignData[]; total: number }>(
        `/campaigns${query ? `?${query}` : ""}`
      );
    },

    create: (campaignData: Partial<ICampaignData>) =>
      fetchApi<ICampaignData>("/campaigns", {
        method: "POST",
        body: JSON.stringify(campaignData),
      }),

    getById: (id: string) => fetchApi<ICampaignData>(`/campaigns/${id}`),

    update: (id: string, data: Partial<ICampaignData>) =>
      fetchApi<ICampaignData>(`/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  
  // Add other endpoint groups...
};
```

---

## Integration & Testing Phase

### Step 1: Update Root Dependencies

Update root `package.json` to reference new packages:

```json
{
  "dependencies": {
    "@gametriggers/shared-types": "workspace:*",
    "@gametriggers/shared-schemas": "workspace:*",
    "@gametriggers/shared-auth": "workspace:*",
    "@gametriggers/shared-ui": "workspace:*",
    "@gametriggers/shared-utils": "workspace:*",
    "@gametriggers/shared-api": "workspace:*",
    "@gametriggers/shared-hooks": "workspace:*",
    "@gametriggers/shared-config": "workspace:*"
  }
}
```

### Step 2: Update Import Statements

Create a migration script to update imports:

**Create `scripts/migrate-imports.js`:**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const importMappings = {
  // Types migrations
  "from '../lib/schema-types'": "from '@gametriggers/shared-types'",
  "from '../../lib/schema-types'": "from '@gametriggers/shared-types'",
  "from '../../../lib/schema-types'": "from '@gametriggers/shared-types'",
  
  // Utils migrations
  "from '@/lib/utils'": "from '@gametriggers/shared-utils'",
  "from '../lib/utils'": "from '@gametriggers/shared-utils'",
  
  // Auth migrations
  "from '@/lib/auth'": "from '@gametriggers/shared-auth'",
  "from '../lib/eureka-roles'": "from '@gametriggers/shared-auth'",
  
  // API migrations
  "from '@/lib/api-client'": "from '@gametriggers/shared-api'",
  
  // UI migrations
  "from '@/components/ui/": "from '@gametriggers/shared-ui'",
  
  // Schema migrations
  "from '@/schemas/": "from '@gametriggers/shared-schemas'",
};

function updateImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport, 'g'), newImport);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Run migration
function migrateImports() {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const directories = ['app', 'components', 'lib', 'backend/src'];
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)`, {
        encoding: 'utf8'
      }).trim().split('\n').forEach(updateImportsInFile);
    }
  });
}

migrateImports();
console.log('Import migration complete!');
```

### Step 3: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Build all packages
turbo run build

# Type check everything
turbo run type-check
```

### Step 4: Test Migration

**Create `scripts/test-migration.js`:**
```javascript
const { execSync } = require('child_process');

console.log('🧪 Testing monorepo migration...');

try {
  // Test TypeScript compilation
  console.log('✅ Testing TypeScript compilation...');
  execSync('turbo run type-check', { stdio: 'inherit' });
  
  // Test builds
  console.log('✅ Testing package builds...');
  execSync('turbo run build', { stdio: 'inherit' });
  
  // Test the dev server starts
  console.log('✅ Testing dev server...');
  const devProcess = execSync('timeout 30s npm run dev:unified', { 
    stdio: 'pipe',
    timeout: 30000 
  });
  
  console.log('✅ All tests passed! Migration successful.');
  
} catch (error) {
  console.error('❌ Migration test failed:', error.message);
  process.exit(1);
}
```

### Step 5: Gradual Rollout Strategy

Create feature flag system for gradual migration:

**Create `lib/feature-flags.ts`:**
```typescript
export const FEATURE_FLAGS = {
  USE_SHARED_PACKAGES: process.env.USE_SHARED_PACKAGES === 'true',
  USE_SHARED_AUTH: process.env.USE_SHARED_AUTH === 'true',
  USE_SHARED_UI: process.env.USE_SHARED_UI === 'true',
} as const;

export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] || false;
}
```

---

## Deployment & Rollback

### Deployment Checklist

```bash
# Pre-deployment
□ All packages built successfully
□ Type checking passes
□ Import migration completed
□ Feature flags configured
□ Backup created

# Deployment steps
□ Deploy with feature flags disabled
□ Monitor application health
□ Gradually enable feature flags
□ Monitor for errors
□ Full rollout

# Post-deployment
□ Remove legacy code
□ Update documentation
□ Clean up unused files
```

### Rollback Strategy

**Create `scripts/rollback-migration.js`:**
```javascript
const { execSync } = require('child_process');

console.log('🔄 Rolling back monorepo migration...');

try {
  // Restore from backup branch
  execSync('git stash', { stdio: 'inherit' });
  execSync('git checkout backup-pre-monorepo', { stdio: 'inherit' });
  execSync('git checkout -b rollback-to-unified', { stdio: 'inherit' });
  
  // Restore package.json
  execSync('npm install', { stdio: 'inherit' });
  
  // Test the rollback
  execSync('npm run dev:unified', { 
    stdio: 'inherit',
    timeout: 10000 
  });
  
  console.log('✅ Rollback successful!');
  
} catch (error) {
  console.error('❌ Rollback failed:', error.message);
  process.exit(1);
}
```

---

## Final Steps & Cleanup

### 1. Documentation Updates

Create package documentation:
```bash
# Create README for each package
for pkg in packages/*/; do
  if [ ! -f "$pkg/README.md" ]; then
    echo "# $(basename $pkg)" > "$pkg/README.md"
    echo "Package documentation coming soon..." >> "$pkg/README.md"
  fi
done
```

### 2. Remove Legacy Files

After successful migration:
```bash
# Remove old files (after confirming everything works)
rm -rf schemas/ # Moved to packages/shared-schemas
rm lib/schema-types.ts # Moved to packages/shared-types
rm lib/utils.ts # Moved to packages/shared-utils
rm lib/*-constants.ts # Moved to packages/shared-utils
# ... remove other migrated files
```

### 3. Update Scripts

Update package.json scripts:
```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "type-check": "turbo run type-check",
    "migrate:imports": "node scripts/migrate-imports.js",
    "test:migration": "node scripts/test-migration.js",
    "rollback:migration": "node scripts/rollback-migration.js"
  }
}
```

---

## Success Metrics & Validation

### Technical Validation
- [ ] All packages build successfully
- [ ] No TypeScript errors
- [ ] Import paths resolved correctly
- [ ] Dev server starts without errors
- [ ] All existing functionality works

### Performance Validation
- [ ] Build time comparison (should be similar or faster)
- [ ] Bundle size comparison (should be same or smaller)
- [ ] Hot reload still works
- [ ] Type checking performance

### Developer Experience Validation
- [ ] IntelliSense works for package imports
- [ ] Package documentation is clear
- [ ] New developer setup under 5 minutes
- [ ] CI/CD pipeline works

---

This comprehensive guide provides step-by-step instructions for migrating your Gametriggers platform to a clean 8-package monorepo structure. The approach prioritizes safety with rollback strategies, gradual migration with feature flags, and thorough testing at each step.

The migration will set up a solid foundation for your planned portal separation (E1/E2/E3) while eliminating code duplication and improving maintainability.
