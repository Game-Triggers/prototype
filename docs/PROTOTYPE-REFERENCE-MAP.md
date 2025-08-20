# Prototype Reference Map

This document maps the existing prototype components to the different portals in the Gametriggers platform setup. Use this as a reference when building each portal to maximize code reuse.

## Current Prototype Structure Analysis

### ✅ Available Components (Ready to Use)

#### Authentication & Session Management

- **Location**: `/lib/auth.ts`, `/components/session-provider.tsx`
- **Usage**: All portals
- **Features**:
  - NextAuth.js configuration
  - Multiple OAuth providers (Twitch, Google)
  - Role-based authentication
  - Session management

#### UI Components Library

- **Location**: `/components/ui/`
- **Usage**: All portals
- **Features**: Complete shadcn/ui component library
- **Components Available**:
  - Buttons, Cards, Dialogs, Forms
  - Tables, Charts, Navigation
  - Layout components

#### Dashboard Components

- **Location**: `/components/dashboard/`
- **Usage**: All portals (customize per role)
- **Features**:
  - Responsive dashboard layout
  - Metric cards and stats display
  - Navigation and sidebar

#### Campaign Management

- **Location**: `/components/campaigns/`
- **Usage**: E1 Brand Portal, E2 Exchange Portal
- **Features**:
  - Campaign creation forms
  - Campaign listing and management
  - Campaign status tracking

#### Analytics Components

- **Location**: `/components/analytics/`
- **Usage**: All portals (different metrics per role)
- **Features**:
  - Performance charts
  - Data visualization
  - Report generation

#### Admin Components

- **Location**: `/components/admin/`
- **Usage**: E2 Exchange Portal
- **Features**:
  - System monitoring
  - User management
  - Administrative controls

#### Wallet/Financial Components

- **Location**: `/components/wallet/`
- **Usage**: E3 Publisher Portal, E1 Brand Portal
- **Features**:
  - Earnings tracking
  - Payout management
  - Financial dashboards

#### Database Schemas

- **Location**: `/schemas/`
- **Usage**: All portals
- **Available Schemas**:
  - User schema with roles
  - Campaign schema
  - Billing schema
  - Organization schema

#### Backend Services

- **Location**: `/backend/`
- **Usage**: All portals
- **Features**:
  - NestJS microservices architecture
  - API route handlers
  - Database connections

## Portal-Specific Component Mapping

### E1 Brand Portal (brands.gametriggers.com)

#### 🟢 Use Directly from Prototype

```bash
# Core authentication and session management
cp /Users/himanshuyadav/dev/prototype/lib/auth.ts lib/
cp /Users/himanshuyadav/dev/prototype/components/session-provider.tsx components/

# Complete UI component library
cp -r /Users/himanshuyadav/dev/prototype/components/ui/ components/

# Dashboard framework
cp -r /Users/himanshuyadav/dev/prototype/components/dashboard/ components/

# Campaign management (core functionality)
cp -r /Users/himanshuyadav/dev/prototype/components/campaigns/ components/

# Analytics for campaign performance
cp -r /Users/himanshuyadav/dev/prototype/components/analytics/ components/

# Basic layout and navigation
cp -r /Users/himanshuyadav/dev/prototype/components/layouts/ components/

# Database schemas
cp -r /Users/himanshuyadav/dev/prototype/schemas/ ./

# Backend services
cp -r /Users/himanshuyadav/dev/prototype/backend/ ./
```

#### 🟡 Customize from Prototype

```bash
# Wallet components (adapt for budget management)
cp -r /Users/himanshuyadav/dev/prototype/components/wallet/ components/
# Rename and customize for brand budget management

# Settings components (adapt for brand settings)
cp -r /Users/himanshuyadav/dev/prototype/components/settings/ components/
# Customize for brand-specific settings
```

#### 🔴 Remove from Prototype

- Remove publisher-specific wallet features
- Remove individual creator components
- Remove admin system monitoring (keep basic admin)

### E2 Exchange Portal (exchange.gametriggers.com)

#### 🟢 Use Directly from Prototype

```bash
# Authentication with admin focus
cp /Users/himanshuyadav/dev/prototype/lib/auth.ts lib/
cp /Users/himanshuyadav/dev/prototype/components/session-provider.tsx components/

# UI components
cp -r /Users/himanshuyadav/dev/prototype/components/ui/ components/

# Admin components (core functionality)
cp -r /Users/himanshuyadav/dev/prototype/components/admin/ components/

# Analytics for system monitoring
cp -r /Users/himanshuyadav/dev/prototype/components/analytics/ components/

# Campaign management (for routing and monitoring)
cp -r /Users/himanshuyadav/dev/prototype/components/campaigns/ components/

# Database schemas
cp -r /Users/himanshuyadav/dev/prototype/schemas/ ./

# Backend services
cp -r /Users/himanshuyadav/dev/prototype/backend/ ./
```

#### 🟡 Customize from Prototype

```bash
# Dashboard (adapt for exchange operations)
cp -r /Users/himanshuyadav/dev/prototype/components/dashboard/ components/
# Customize for system health, routing metrics

# Settings (adapt for platform configuration)
cp -r /Users/himanshuyadav/dev/prototype/components/settings/ components/
# Customize for platform-wide settings
```

#### 🔴 Remove from Prototype

- Remove brand campaign creation features
- Remove publisher earnings features
- Focus only on internal operations

### E3 Publisher Portal (publishers.gametriggers.com)

#### 🟢 Use Directly from Prototype

```bash
# Authentication with OAuth focus
cp /Users/himanshuyadav/dev/prototype/lib/auth.ts lib/
cp /Users/himanshuyadav/dev/prototype/components/session-provider.tsx components/

# UI components
cp -r /Users/himanshuyadav/dev/prototype/components/ui/ components/

# Wallet/earnings components (core functionality)
cp -r /Users/himanshuyadav/dev/prototype/components/wallet/ components/

# Dashboard framework
cp -r /Users/himanshuyadav/dev/prototype/components/dashboard/ components/

# Analytics for publisher performance
cp -r /Users/himanshuyadav/dev/prototype/components/analytics/ components/

# Settings for publisher preferences
cp -r /Users/himanshuyadav/dev/prototype/components/settings/ components/

# Database schemas
cp -r /Users/himanshuyadav/dev/prototype/schemas/ ./

# Backend services
cp -r /Users/himanshuyadav/dev/prototype/backend/ ./
```

#### 🟡 Customize from Prototype

```bash
# Campaign components (adapt for participation)
cp -r /Users/himanshuyadav/dev/prototype/components/campaigns/ components/
# Customize for campaign browsing and participation
```

#### 🟢 Add New Components

- Overlay designer and management
- Platform integration (Twitch, YouTube)
- Stream monitoring components

### Landing Site (gametriggers.com)

#### 🟢 Use Directly from Prototype

```bash
# Basic authentication for registration
cp /Users/himanshuyadav/dev/prototype/lib/auth.ts lib/
cp /Users/himanshuyadav/dev/prototype/components/session-provider.tsx components/

# UI components for forms and marketing
cp -r /Users/himanshuyadav/dev/prototype/components/ui/ components/

# Layout components
cp -r /Users/himanshuyadav/dev/prototype/components/layouts/ components/
```

#### 🟡 Customize from Prototype

```bash
# Home components (adapt for marketing)
cp -r /Users/himanshuyadav/dev/prototype/components/home/ components/
# Customize for marketing landing pages
```

#### 🟢 Add New Components

- Marketing-specific components
- Registration flows
- Public-facing content

## Configuration Files to Reuse

### All Portals

```bash
# Next.js configuration
cp /Users/himanshuyadav/dev/prototype/next.config.ts ./

# TypeScript configuration
cp /Users/himanshuyadav/dev/prototype/tsconfig.json ./

# Tailwind configuration
cp /Users/himanshuyadav/dev/prototype/tailwind.config.js ./

# Component library configuration
cp /Users/himanshuyadav/dev/prototype/components.json ./

# Package.json (as base, then customize)
cp /Users/himanshuyadav/dev/prototype/package.json ./package.json.base
```

### Environment Setup

```bash
# Use as template
cp /Users/himanshuyadav/dev/prototype/.env.example ./.env.local
# Then customize for each portal's specific needs
```

## Database Integration

### MongoDB Schemas (All Portals)

```bash
# Use existing schemas as foundation
cp -r /Users/himanshuyadav/dev/prototype/schemas/ ./

# Available schemas:
# - user.schema.ts (with role-based access)
# - campaign.schema.ts
# - billing.schema.ts
# - organization.schema.ts
# - auth-session.schema.ts
```

### API Integration

```bash
# Use existing API client
cp /Users/himanshuyadav/dev/prototype/lib/api-client.ts lib/

# Backend service integration
cp -r /Users/himanshuyadav/dev/prototype/backend/ ./
```

## Step-by-Step Implementation Guide

### Phase 1: Setup Foundation (All Portals)

1. Copy authentication system
2. Copy UI component library
3. Copy database schemas
4. Setup basic configuration files

### Phase 2: Portal-Specific Implementation

#### E1 Brand Portal

1. Copy campaign management components
2. Copy analytics components
3. Customize wallet components for budget management
4. Setup brand-specific dashboard

#### E2 Exchange Portal

1. Copy admin components
2. Copy system monitoring components
3. Customize dashboard for operations
4. Setup internal tools

#### E3 Publisher Portal

1. Copy wallet/earnings components
2. Customize campaign components for participation
3. Add overlay management system
4. Setup platform integrations

#### Landing Site

1. Copy basic authentication
2. Copy home/marketing components
3. Add registration flows
4. Setup public-facing features

## Prototype Enhancement Recommendations

### Missing Components to Add

1. **Overlay Management System** (for E3 Publisher Portal)
2. **System Health Monitoring** (for E2 Exchange Portal)
3. **Marketing Landing Components** (for Landing Site)
4. **Advanced Role Management** (for all portals)

### Components to Refactor

1. **Campaign Components**: Split into brand-creation vs publisher-participation
2. **Analytics Components**: Make more role-specific
3. **Dashboard Components**: Add more customization options

## Usage Instructions

### Quick Start with Prototype

```bash
# For any new portal, start with this base
mkdir -p apps/new-portal
cd apps/new-portal

# Copy foundation
cp -r /Users/himanshuyadav/dev/prototype/lib/ ./lib/
cp -r /Users/himanshuyadav/dev/prototype/components/ui/ ./components/
cp -r /Users/himanshuyadav/dev/prototype/components/layouts/ ./components/
cp -r /Users/himanshuyadav/dev/prototype/schemas/ ./schemas/
cp /Users/himanshuyadav/dev/prototype/package.json ./package.json

# Install dependencies
npm install

# Then add portal-specific components as needed
```

### Customization Guidelines

1. **Always preserve the core authentication system**
2. **Keep UI components consistent across portals**
3. **Customize business logic components per portal**
4. **Maintain database schema compatibility**

---

**Document Version**: 1.0  
**Last Updated**: July 23, 2025  
**Maintained By**: Engineering Team
