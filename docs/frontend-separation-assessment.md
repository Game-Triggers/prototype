# Frontend Separation Assessment for Gametriggers Platform

This document provides a comprehensive assessment of the Gametriggers codebase to facilitate the separation of frontend and backend components for easier migration, maintenance, and scaling. The analysis is based on the current state of the codebase as of July 10, 2025.

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Frontend Components Analysis](#frontend-components-analysis)
3. [Backend Services Analysis](#backend-services-analysis)
4. [API Integration Points](#api-integration-points)
5. [Shared Dependencies](#shared-dependencies)
6. [Authentication Flow](#authentication-flow)
7. [Component-by-Component Separation Plan](#component-by-component-separation-plan)
8. [Recommended Separation Strategy](#recommended-separation-strategy)
9. [Migration Action Plan](#migration-action-plan)

## Current Architecture Overview

The Gametriggers platform is currently built as a unified Next.js application with an embedded NestJS backend:

- **Frontend**: Next.js 15 with App Router
  - Located in `/app` directory
  - UI components in `/components`
  - Client-side utilities in `/lib`

- **Backend**: NestJS 
  - Embedded in the unified project structure
  - Located in `/backend/src/modules`
  - API endpoints accessible through `/app/api` routes
  - Uses MongoDB for data persistence

- **Integration**: 
  - Frontend communicates with backend through API routes
  - Server-side integration via `server.js` that starts both services
  - API proxies in `/app/api` forwarding requests to NestJS backend

## Frontend Components Analysis

### Page Structure

1. **Public Pages**
   - Home page (`/app/page.tsx`)
   - Auth pages (`/app/auth/*`)

2. **Dashboard Pages**
   - Main dashboard (`/app/dashboard/page.tsx`)
   - Settings (`/app/dashboard/settings/page.tsx`)
   - Campaigns (`/app/dashboard/campaigns/*`)
   - Analytics (`/app/dashboard/analytics/*`)
   - Wallet (`/app/dashboard/wallet/*`)
   - Admin pages (`/app/dashboard/admin/*`)

### Component Organization

1. **UI Components**
   - ShadcnUI-based components (`/components/ui/*`)
   - Layout components (`/components/layouts/*`)

2. **Feature Components**
   - Dashboard components (`/components/dashboard/*`)
   - Campaign components (`/components/campaigns/*`)
   - Wallet components (`/components/wallet/*`)
   - Admin components (`/components/admin/*`)
   - Analytics components (`/components/analytics/*`)

3. **Shared Components**
   - Session provider (`/components/session-provider.tsx`)
   - Theme provider (`/components/theme-provider.tsx`)

### Client-Side Logic

1. **Authentication Logic**
   - NextAuth configuration in `/lib/auth.ts`
   - Session handling in `/components/session-provider.tsx`

2. **API Communication**
   - API client in `/lib/api-client.ts`
   - API routes definition in `/lib/api-route.json`

3. **Utility Functions**
   - General utilities in `/lib/utils.ts`
   - Currency configuration in `/lib/currency-config.ts`

## Backend Services Analysis

### Core Modules

1. **Auth Module** (`/backend/src/modules/auth`)
   - Authentication controllers and services
   - JWT, OAuth strategies
   - User registration and login

2. **Users Module** (`/backend/src/modules/users`)
   - User management
   - Profile settings
   - Overlay settings

3. **Campaigns Module** (`/backend/src/modules/campaigns`)
   - Campaign creation and management
   - Campaign participation

4. **Analytics Module** (`/backend/src/modules/analytics`)
   - Performance metrics
   - Dashboard analytics
   - Advanced reporting

### Advanced Financial Modules

5. **Wallet Module** (`/backend/src/modules/wallet`)
   - Multi-currency wallet management
   - Transactions and payment processing
   - KYC verification
   - Dispute handling

6. **Earnings Module** (`/backend/src/modules/earnings`)
   - Earnings calculation and tracking
   - Payout processing

7. **Admin Module** (`/backend/src/modules/admin`)
   - Platform administration
   - Financial management
   - User management

### Specialized Services

8. **Conflict Rules Module** (`/backend/src/modules/conflict-rules`)
   - Campaign conflict detection
   - Rule enforcement

9. **Overlay Module** (`/backend/src/modules/overlay`)
   - Stream overlay management
   - Ad delivery

10. **Stream Verification Module** (`/backend/src/modules/stream-verification`)
    - Platform integration (Twitch, YouTube)
    - Stream status verification

11. **Upload Module** (`/backend/src/modules/upload`)
    - File upload handling
    - Asset management

## API Integration Points

### API Proxy Architecture

The current codebase uses a proxy pattern where Next.js API routes forward requests to the NestJS backend:

1. **Proxy Routes**
   - Located in `/app/api/*`
   - Each route corresponds to a NestJS endpoint
   - Example: `/app/api/user/profile/route.ts` proxies to `/api/v1/users/me`

2. **Backend Route Handler**
   - Generic handler in `/backend/route.ts`
   - Supports all HTTP methods (GET, POST, PUT, DELETE, etc.)
   - Forwards requests to the NestJS server

3. **Server Integration**
   - Combined server in `server.js`
   - Starts both Next.js and NestJS processes
   - Configures ports and environment variables

### API Route Mapping

| Frontend API Route | Backend Endpoint | Description |
|-------------------|------------------|-------------|
| `/api/auth/*` | `/api/v1/auth/*` | Authentication endpoints |
| `/api/user/*` | `/api/v1/users/*` | User profile and settings |
| `/api/campaigns/*` | `/api/v1/campaigns/*` | Campaign management |
| `/api/analytics/*` | `/api/v1/analytics/*` | Analytics and reporting |
| `/api/wallet/*` | `/api/v1/wallet/*` | Wallet operations |
| `/api/earnings/*` | `/api/v1/earnings/*` | Earnings and payouts |
| `/api/admin/*` | `/api/v1/admin/*` | Admin operations |
| `/api/upload/*` | `/api/v1/upload/*` | File uploads |
| `/api/overlay/*` | `/api/v1/overlay/*` | Overlay management |
| `/api/kyc/*` | `/api/v1/kyc/*` | KYC verification |

## Shared Dependencies

### Schema Definitions

1. **Schema Types**
   - Located in `/schemas/*.schema.ts`
   - Used by both frontend and backend
   - Examples: user.schema.ts, campaign.schema.ts, wallet.schema.ts

2. **Type Definitions**
   - Next-auth custom types in `/types/next-auth.d.ts`
   - Schema types in `/lib/schema-types.ts`

### Configuration

1. **Environment Variables**
   - Shared between frontend and backend
   - API URLs, authentication secrets, etc.

2. **Constants and Enums**
   - User roles, campaign statuses, etc.
   - Currently shared via schema files

## Authentication Flow

### Current Implementation

1. **NextAuth Integration**
   - NextAuth.js for frontend authentication
   - Custom JWT handling in `/lib/auth.ts`
   - Session provider in `/components/session-provider.tsx`

2. **Backend Authentication**
   - JwtAuthGuard in NestJS controllers
   - Role-based access control
   - Token validation and refresh

3. **OAuth Integration**
   - Twitch and YouTube OAuth support
   - Token exchange between NextAuth and NestJS

### Authentication Data Flow

1. User authenticates via NextAuth
2. JWT token stored in session
3. Token passed to backend in Authorization header
4. Backend validates token and authorizes requests
5. Session refreshed as needed

## Component-by-Component Separation Plan

### 1. Authentication System

**Current Implementation:**
- NextAuth integrated with NestJS authentication
- Shared JWT handling

**Separation Plan:**
- Frontend: Keep NextAuth with dedicated auth provider
- Backend: Maintain standalone JWT authentication
- Integration: Backend issues tokens, frontend stores and sends them

### 2. Dashboard Components

**Current Implementation:**
- Role-specific dashboard content in `/components/dashboard`
- API calls embedded in dashboard components

**Separation Plan:**
- Extract all API calls to dedicated service layer
- Implement state management (React Query or Redux)
- Create API services for each data requirement

### 3. Campaign Management

**Current Implementation:**
- Campaign components in `/components/campaigns`
- Direct API calls in component useEffect hooks

**Separation Plan:**
- Create CampaignService to handle all API calls
- Implement proper state management
- Separate view components from data fetching logic

### 4. Wallet and Financial System

**Current Implementation:**
- Wallet UI in `/components/wallet`
- Direct API calls to wallet endpoints

**Separation Plan:**
- Create dedicated financial services layer
- Implement transaction and balance state management
- Extract KYC flow to separate module

### 5. Analytics System

**Current Implementation:**
- Analytics components in `/components/analytics`
- Direct API calls to analytics endpoints

**Separation Plan:**
- Create AnalyticsService for data fetching
- Implement caching for analytics data
- Separate chart components from data logic

### 6. Admin Interface

**Current Implementation:**
- Admin components in `/components/admin`
- Direct API calls in component code

**Separation Plan:**
- Create AdminService for all admin operations
- Implement proper permission checks
- Separate admin UI from admin logic

## Recommended Separation Strategy

### 1. Frontend-Backend Communication Layer

Create a dedicated API client layer that:
- Handles all communication with the backend
- Manages authentication headers
- Provides typed API methods for all endpoints
- Implements error handling and retries

```typescript
// Example API client structure
export class ApiClient {
  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> { ... }
  async register(userData: RegisterData): Promise<AuthResponse> { ... }
  
  // User methods
  async getUserProfile(): Promise<UserProfile> { ... }
  async updateUserProfile(data: ProfileUpdateData): Promise<UserProfile> { ... }
  
  // Campaign methods
  async getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> { ... }
  async createCampaign(data: CampaignCreateData): Promise<Campaign> { ... }
  
  // ... additional methods for each module
}
```

### 2. State Management Separation

Implement proper state management that:
- Separates UI state from API data
- Caches API responses appropriately
- Handles loading, error, and success states

```typescript
// Example using React Query
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => apiClient.getCampaigns(filters),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CampaignCreateData) => apiClient.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
```

### 3. Schema and Type Sharing Strategy

To share types between frontend and backend:
- Create a shared types package
- Move schemas to a shared location
- Use TypeScript path aliases to access shared types

```typescript
// Example structure
/shared/
  /types/
    user.types.ts
    campaign.types.ts
    wallet.types.ts
  /enums/
    user-roles.enum.ts
    campaign-status.enum.ts
```

### 4. Authentication Flow Separation

Separate the authentication flows:
- Backend provides JWT authentication endpoints
- Frontend handles token storage and renewal
- Implement proper token refresh mechanism

## Migration Action Plan

### Phase 1: API Client Layer

1. Create dedicated API services for each domain:
   - UserService
   - CampaignService
   - WalletService
   - AnalyticsService
   - AdminService

2. Refactor components to use these services:
   - Remove direct fetch/axios calls from components
   - Implement proper error handling
   - Add loading state management

3. Implement request/response interceptors:
   - Authentication header injection
   - Error handling
   - Response transformation

### Phase 2: State Management

1. Implement React Query (or Redux) for all data fetching:
   - Configure query client
   - Set up caching strategies
   - Implement optimistic updates

2. Refactor components to use query hooks:
   - Replace useEffect/useState with useQuery/useMutation
   - Implement suspense boundaries
   - Add error handling

### Phase 3: Shared Type Management

1. Extract shared types to a common location:
   - Move schemas to shared directory
   - Create type definitions for all API requests/responses
   - Implement zod schemas for validation

2. Update import paths throughout the codebase:
   - Update frontend imports
   - Update backend imports
   - Configure path aliases

### Phase 4: Project Structure Separation

1. Separate the frontend codebase:
   - Move all Next.js code to dedicated frontend repository
   - Configure build and deployment scripts
   - Set up environment variables

2. Separate the backend codebase:
   - Move all NestJS code to dedicated backend repository
   - Configure build and deployment scripts
   - Set up environment variables

3. Implement Docker Compose for local development:
   - Create frontend container
   - Create backend container
   - Set up development environment

### Phase 5: Deployment Pipeline

1. Set up CI/CD for frontend:
   - Configure build process
   - Implement testing
   - Set up deployment to hosting platform

2. Set up CI/CD for backend:
   - Configure build process
   - Implement testing
   - Set up deployment to hosting platform

3. Implement monitoring and logging:
   - Error tracking
   - Performance monitoring
   - User analytics

## Conclusion

The separation of the Gametriggers platform into distinct frontend and backend applications will enhance maintainability, scalability, and deployment flexibility. By following the component-by-component approach outlined in this document, the migration can be performed incrementally with minimal disruption to ongoing development and operations.

The key to a successful separation is the creation of a robust API communication layer that abstracts the complexities of backend communication from the frontend components. This, combined with proper state management and type sharing, will ensure that the separated applications maintain the same functionality while enabling independent scaling and development of each layer.
