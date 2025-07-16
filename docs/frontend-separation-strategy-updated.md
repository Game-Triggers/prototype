# Frontend Separation Strategy: Brand & Streamer Portals

This document outlines the strategy for dividing the Gametriggers frontend into separate applications for brands and streamers, incorporating the comprehensive financial, analytics, and admin systems that have been implemented.

## Table of Contents

1. [Current Frontend Architecture](#current-frontend-architecture)
2. [Target Architecture](#target-architecture)
3. [Benefits of Separate Portals](#benefits-of-separate-portals)
4. [Technical Implementation](#technical-implementation)
5. [Shared Components Strategy](#shared-components-strategy)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Integration Strategy](#api-integration-strategy)
8. [Design System Implementation](#design-system-implementation)
9. [Wallet & Financial System Integration](#wallet--financial-system-integration)
10. [KYC & Compliance Integration](#kyc--compliance-integration)
11. [Analytics & Reporting Systems](#analytics--reporting-systems)
12. [Admin Portal Features](#admin-portal-features)
13. [Deployment Architecture](#deployment-architecture)
14. [Migration Strategy](#migration-strategy)
15. [Performance Optimizations](#performance-optimizations)
16. [Development Workflow](#development-workflow)

## Current Frontend Architecture

The Gametriggers platform currently uses:
- A single Next.js 15 application with App Router for all user types (brands, streamers, admins)
- Role-based UI rendering with comprehensive financial dashboards
- Advanced wallet management with payment integration (Stripe, UPI, Bank Transfer)
- Complete KYC verification system with document upload and admin approval
- Sophisticated analytics system with viewer-based metrics and financial reporting
- Admin portal with financial oversight, dispute resolution, and campaign management
- Conflict rules engine for campaign fairness and exclusivity management
- Integrated billing system with invoice generation and dispute handling

```
app/
  page.tsx (landing page)
  layout.tsx (main layout)
  dashboard/
    page.tsx (role-based dashboard with financial widgets)
    layout.tsx (dashboard layout)
    campaigns/... (campaign management with budget tracking)
    analytics/... (advanced analytics with financial metrics)
    admin/... (admin portal with financial oversight)
  wallet/
    page.tsx (wallet management and payments)
  kyc/
    page.tsx (KYC verification system)
  auth/
    signin/
    register/
components/
  ui/... (shared UI components)
  layouts/... (shared layouts)
  wallet/... (wallet and payment components)
  admin/... (admin-specific components)
  analytics/... (analytics and reporting components)
backend/
  src/modules/
    wallet/... (comprehensive wallet system)
    kyc/... (KYC verification system)
    admin/... (admin financial management)
    analytics/... (advanced analytics engine)
    conflict-rules/... (campaign fairness engine)
    payments/... (payment processing)
```

## Target Architecture

We will transition to:

1. **Mono-repository structure** containing:
   - Core shared packages (wallet, KYC, analytics, admin)
   - Brand Portal (Next.js application)
   - Streamer Portal (Next.js application) 
   - Admin Portal (Next.js application)
   - Landing Page (Next.js application)

2. **Four separate deployable applications**:
   - Brand Portal (`brand.gametriggers.com`)
   - Streamer Portal (`streamer.gametriggers.com`)
   - Admin Portal (`admin.gametriggers.com`)
   - Landing/Marketing Site (`www.gametriggers.com`)

3. **Shared infrastructure**:
   - Common design system with role-specific themes
   - Shared authentication library with NextAuth
   - Unified wallet and payment components
   - Common KYC verification system
   - Shared analytics and reporting framework
   - Administrative oversight components
   - Conflict resolution and fairness engines

## Benefits of Separate Portals

### Technical Benefits

1. **Independent Scaling**: Scale each portal based on its specific load patterns
2. **Targeted Performance Optimization**: Optimize each portal for its specific user needs
3. **Smaller Bundle Sizes**: Each portal only includes what it needs
4. **Enhanced Development Velocity**: Teams can work on different portals without conflicts
5. **Independent Deployment**: Update one portal without affecting the other

### User Experience Benefits

1. **Tailored User Experience**: UI/UX designed specifically for each user type
2. **Specialized Features**: Add features relevant only to a specific user type without bloating the other
3. **Custom Onboarding**: Provide specialized onboarding flows
4. **Optimized Workflows**: Streamline common workflows for each user type
5. **Targeted Messaging**: Deliver focused messaging and announcements

### Business Benefits

1. **Specialized Marketing**: Market to brands and streamers differently
2. **Targeted Growth**: Focus development resources on high-growth user segments
3. **Independent Roadmaps**: Evolve each portal at its own pace
4. **Improved Analytics**: Get clearer insights into user behavior per segment
5. **Enhanced Security Isolation**: Limit blast radius of security issues

## Technical Implementation

### Mono-repository Structure

We'll use Turborepo to manage our monorepo structure:

```
gametriggers-frontend/
  package.json
  turbo.json
  
  apps/
    brand-portal/         # Next.js brand application
      package.json
      next.config.js
      app/
        layout.tsx
        page.tsx
        dashboard/
        campaigns/
        settings/
        
    streamer-portal/      # Next.js streamer application
      package.json
      next.config.js
      app/
        layout.tsx
        page.tsx
        dashboard/
        campaigns/
        analytics/
        earnings/
        
    landing-site/         # Marketing site & general auth
      package.json
      next.config.js
      app/
        layout.tsx
        page.tsx
        about/
        pricing/
        features/
        auth/
          signin/
          register/
          
  packages/
    ui/                   # Shared UI components
      package.json
      index.tsx
      components/
        button.tsx
        input.tsx
        ...
        
    auth/                 # Authentication libraries
      package.json
      index.tsx
      
    api-client/           # API client for services
      package.json
      index.ts
      services/
        
    config/               # Shared configuration
      eslint/
      tailwind/
      typescript/
```

### Setting Up Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}
```

### Brand Portal Next.js Configuration

```typescript
// apps/brand-portal/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@gametriggers/ui", "@gametriggers/auth", "@gametriggers/api-client"],
  images: {
    domains: ['assets.gametriggers.com', 'storage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_GATEWAY_URL}/api/:path*`,
      },
    ];
  },
  // Redirect to signin if not authenticated
  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/auth/signin?callbackUrl=/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'next-auth.session-token',
            missing: true,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Streamer Portal Next.js Configuration

```typescript
// apps/streamer-portal/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@gametriggers/ui", "@gametriggers/auth", "@gametriggers/api-client"],
  images: {
    domains: ['assets.gametriggers.com', 'storage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_GATEWAY_URL}/api/:path*`,
      },
    ];
  },
  // Redirect to signin if not authenticated
  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/auth/signin?callbackUrl=/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'next-auth.session-token',
            missing: true,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Shared Components Strategy

### UI Package Configuration

```typescript
// packages/ui/package.json
{
  "name": "@gametriggers/ui",
  "version": "0.1.0",
  "main": "./index.tsx",
  "types": "./index.tsx",
  "license": "MIT",
  "scripts": {
    "lint": "eslint .",
    "generate:component": "turbo gen react-component"
  },
  "devDependencies": {
    "@gametriggers/eslint-config": "*",
    "@gametriggers/typescript-config": "*",
    "@turbo/gen": "^1.10.12",
    "@types/node": "^20.5.2",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.53.0",
    "react": "^18.2.0",
    "typescript": "^5.2.2"
  }
}
```

### Creating Shared Components

```typescript
// packages/ui/components/button.tsx
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "default",
  size = "md",
  isLoading = false,
  className,
  children,
  ...props
}: ButtonProps) {
  // Button implementation with Tailwind classes
  return (
    <button
      className={`button button-${variant} button-${size} ${isLoading ? 'button-loading' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <span className="loading-spinner" />}
      {children}
    </button>
  );
}
```

### Theme Configuration for Different Portals

```typescript
// packages/ui/themes/brand-theme.ts
export const brandTheme = {
  colors: {
    primary: '#1E40AF', // Brand blue
    secondary: '#6B21A8', // Brand purple
    accent: '#047857', // Brand green
    background: '#F8FAFC',
    text: '#0F172A',
  },
  fonts: {
    heading: '"Montserrat", sans-serif',
    body: '"Inter", sans-serif',
  },
};

// packages/ui/themes/streamer-theme.ts
export const streamerTheme = {
  colors: {
    primary: '#7C3AED', // Streamer purple
    secondary: '#2563EB', // Streamer blue
    accent: '#D946EF', // Streamer pink
    background: '#0F172A',
    text: '#F8FAFC',
  },
  fonts: {
    heading: '"Poppins", sans-serif',
    body: '"Inter", sans-serif',
  },
};
```

## Authentication & Authorization

### Shared NextAuth Configuration

```typescript
// packages/auth/next-auth-options.ts
import { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { JWT } from "next-auth/jwt";

export const createAuthOptions = (
  portalType: 'brand' | 'streamer',
  apiBaseUrl: string,
): NextAuthOptions => {
  return {
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
        server: process.env.EMAIL_SERVER!,
        from: process.env.EMAIL_FROM!
      })
    ],
    callbacks: {
      async jwt({ token, account, user }) {
        // Initial sign in
        if (account && user) {
          const userDetails = await fetchUserDetails(
            apiBaseUrl,
            account.provider,
            account.providerAccountId,
            portalType
          );
          
          // If user type doesn't match portal type, deny access
          if (userDetails.type !== portalType) {
            throw new Error(`Access denied: User is not a ${portalType}`);
          }
          
          return {
            ...token,
            userId: userDetails.id,
            userType: userDetails.type,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
            permissions: userDetails.permissions
          };
        }
        
        // Return previous token if not expired
        if (Date.now() < (token.accessTokenExpires || 0)) {
          return token;
        }
        
        // Refresh token
        return refreshAccessToken(apiBaseUrl, token);
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
};

async function fetchUserDetails(
  apiBaseUrl: string,
  provider: string,
  providerAccountId: string,
  portalType: 'brand' | 'streamer'
) {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/oauth-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, providerAccountId, portalType })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

async function refreshAccessToken(apiBaseUrl: string, token: JWT) {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
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

### Brand Portal Auth Implementation

```typescript
// apps/brand-portal/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { createAuthOptions } from "@gametriggers/auth/next-auth-options";

const authOptions = createAuthOptions(
  'brand', 
  process.env.API_GATEWAY_URL || 'http://localhost:3000/api'
);

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Streamer Portal Auth Implementation

```typescript
// apps/streamer-portal/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { createAuthOptions } from "@gametriggers/auth/next-auth-options";

const authOptions = createAuthOptions(
  'streamer', 
  process.env.API_GATEWAY_URL || 'http://localhost:3000/api'
);

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## API Integration Strategy

### Shared API Client Package

```typescript
// packages/api-client/index.ts
export * from './services';
export * from './types';
export * from './client';
```

```typescript
// packages/api-client/client.ts
import { getSession } from "next-auth/react";

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  private async getHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    
    return {
      'Content-Type': 'application/json',
      ...(session?.accessToken 
        ? { Authorization: `Bearer ${session.accessToken}` } 
        : {}),
    };
  }
  
  async get<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async post<T>(path: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async put<T>(path: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async delete<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const createApiClient = (baseUrl: string) => {
  return new ApiClient(baseUrl);
};
```

### Brand-Specific API Services

```typescript
// packages/api-client/services/brand-service.ts
import { ApiClient } from '../client';
import { Brand, CreateBrandDto, UpdateBrandDto } from '../types';

export class BrandService {
  private apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  async getBrand(id: string): Promise<Brand> {
    return this.apiClient.get<Brand>(`/brands/${id}`);
  }
  
  async updateBrand(id: string, data: UpdateBrandDto): Promise<Brand> {
    return this.apiClient.put<Brand>(`/brands/${id}`, data);
  }
  
  async createCampaign(data: any): Promise<any> {
    return this.apiClient.post<any>(`/campaigns`, data);
  }
  
  async getBrandCampaigns(): Promise<any[]> {
    return this.apiClient.get<any[]>(`/campaigns/brand`);
  }
  
  // Other brand-specific API methods
}
```

### Streamer-Specific API Services

```typescript
// packages/api-client/services/streamer-service.ts
import { ApiClient } from '../client';
import { Streamer, UpdateStreamerDto } from '../types';

export class StreamerService {
  private apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  async getStreamer(id: string): Promise<Streamer> {
    return this.apiClient.get<Streamer>(`/streamers/${id}`);
  }
  
  async updateStreamer(id: string, data: UpdateStreamerDto): Promise<Streamer> {
    return this.apiClient.put<Streamer>(`/streamers/${id}`, data);
  }
  
  async getEligibleCampaigns(): Promise<any[]> {
    return this.apiClient.get<any[]>(`/campaigns/streamer`);
  }
  
  async applyCampaign(campaignId: string): Promise<any> {
    return this.apiClient.post<any>(`/campaigns/${campaignId}/apply`, {});
  }
  
  async getEarnings(): Promise<any> {
    return this.apiClient.get<any>(`/streamers/earnings`);
  }
  
  // Other streamer-specific API methods
}
```

## Design System Implementation

### Shared Theme Configuration

```typescript
// packages/ui/theme-config.ts
import { extendTheme } from '@gametriggers/ui/theme-core';

export const createTheme = (themeType: 'brand' | 'streamer') => {
  const baseTheme = {
    fonts: {
      body: '"Inter", sans-serif',
      heading: '"Poppins", sans-serif',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
    },
    space: {
      px: '1px',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      32: '8rem',
      40: '10rem',
      48: '12rem',
      56: '14rem',
      64: '16rem',
    },
  };

  if (themeType === 'brand') {
    return extendTheme({
      ...baseTheme,
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Other brand-specific colors
      },
    });
  } else {
    return extendTheme({
      ...baseTheme,
      colors: {
        primary: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        // Other streamer-specific colors
      },
    });
  }
};
```

### Brand Portal Theme Provider

```typescript
// apps/brand-portal/app/providers.tsx
'use client';

import { ThemeProvider } from "@gametriggers/ui/theme";
import { createTheme } from "@gametriggers/ui/theme-config";
import { SessionProvider } from "next-auth/react";

const brandTheme = createTheme('brand');

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={brandTheme}>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

### Streamer Portal Theme Provider

```typescript
// apps/streamer-portal/app/providers.tsx
'use client';

import { ThemeProvider } from "@gametriggers/ui/theme";
import { createTheme } from "@gametriggers/ui/theme-config";
import { SessionProvider } from "next-auth/react";

const streamerTheme = createTheme('streamer');

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={streamerTheme}>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

## Deployment Architecture

### Container-Based Deployment

```yaml
# docker-compose.yml (Development)
version: '3.8'

services:
  brand-portal:
    build:
      context: .
      dockerfile: ./apps/brand-portal/Dockerfile
    ports:
      - "3001:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3000
      - NEXTAUTH_URL=http://localhost:3001
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

  streamer-portal:
    build:
      context: .
      dockerfile: ./apps/streamer-portal/Dockerfile
    ports:
      - "3002:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3000
      - NEXTAUTH_URL=http://localhost:3002
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

  landing-site:
    build:
      context: .
      dockerfile: ./apps/landing-site/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3000
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

  # Mock API gateway for development
  api-gateway:
    image: stoplight/prism:4
    command: mock -h 0.0.0.0 /tmp/api.yaml
    volumes:
      - ./api-spec.yaml:/tmp/api.yaml
    ports:
      - "4000:4000"
```

### Kubernetes Deployment

```yaml
# k8s/brand-portal-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brand-portal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: brand-portal
  template:
    metadata:
      labels:
        app: brand-portal
    spec:
      containers:
      - name: brand-portal
        image: ${REGISTRY}/brand-portal:${VERSION}
        ports:
        - containerPort: 3000
        env:
        - name: API_GATEWAY_URL
          value: "https://api.gametriggers.com"
        - name: NEXTAUTH_URL
          value: "https://brand.gametriggers.com"
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: nextauth-secrets
              key: secret
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: brand-portal
spec:
  selector:
    app: brand-portal
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: brand-portal-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt"
spec:
  tls:
  - hosts:
    - brand.gametriggers.com
    secretName: brand-portal-tls
  rules:
  - host: brand.gametriggers.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: brand-portal
            port:
              number: 80
```

```yaml
# k8s/streamer-portal-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: streamer-portal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: streamer-portal
  template:
    metadata:
      labels:
        app: streamer-portal
    spec:
      containers:
      - name: streamer-portal
        image: ${REGISTRY}/streamer-portal:${VERSION}
        ports:
        - containerPort: 3000
        env:
        - name: API_GATEWAY_URL
          value: "https://api.gametriggers.com"
        - name: NEXTAUTH_URL
          value: "https://streamer.gametriggers.com"
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: nextauth-secrets
              key: secret
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: streamer-portal
spec:
  selector:
    app: streamer-portal
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: streamer-portal-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt"
spec:
  tls:
  - hosts:
    - streamer.gametriggers.com
    secretName: streamer-portal-tls
  rules:
  - host: streamer.gametriggers.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: streamer-portal
            port:
              number: 80
```

## Migration Strategy

### Phase 1: Setup Mono-repo (2-3 weeks)

1. Create Turborepo structure with admin portal support
2. Set up shared packages (UI, auth, wallet, KYC, analytics, admin)
3. Configure build processes and dependencies for all four portals
4. Implement comprehensive CI/CD pipeline with financial system testing

### Phase 2: Extract Shared Components (4-5 weeks)

1. Identify and extract common UI components
2. Create shared design system with role-specific themes
3. Implement theme configuration for brand, streamer, and admin portals
4. Set up shared authentication library with NextAuth
5. Extract wallet and payment components
6. Create shared KYC verification system
7. Build analytics and reporting framework

### Phase 3: Create Brand Portal (5-6 weeks)

1. Create brand-specific layouts and pages
2. Implement brand dashboard with financial widgets
3. Develop campaign creation workflow with budget management
4. Integrate comprehensive wallet system (deposits, reserves, auto-topup)
5. Add payment integration (Stripe, UPI, Bank Transfer)
6. Implement brand-specific analytics and ROI tracking
7. Create brand-specific KYC process
8. Add billing and invoice management

### Phase 4: Create Streamer Portal (5-6 weeks)

1. Create streamer-specific layouts and pages
2. Implement streamer dashboard with earnings tracking
3. Develop campaign participation workflow
4. Integrate wallet system (earnings, withdrawals, KYC requirements)
5. Create comprehensive KYC verification flow
6. Implement earnings analytics and performance metrics
7. Add withdrawal management and payment settings
8. Create conflict resolution interface

### Phase 5: Create Admin Portal (4-5 weeks)

1. Develop comprehensive admin dashboard
2. Implement financial oversight and monitoring
3. Create wallet management and manual adjustments
4. Build dispute resolution system
5. Add KYC review and approval workflow
6. Implement conflict rules management
7. Create platform analytics and reporting
8. Add user management and administrative controls

### Phase 6: Create Landing Site (2-3 weeks)

1. Develop marketing pages with role-specific messaging
2. Implement authentication flows for all user types
3. Create registration pages for brands, streamers, and admins
4. Develop redirects to appropriate portals
5. Add public-facing analytics and platform statistics

### Phase 7: Testing & Optimization (3-4 weeks)

1. Perform cross-browser testing for all portals
2. Conduct comprehensive financial system testing
3. Test payment integrations and KYC workflows
4. Implement analytics tracking and error reporting
5. Perform security audits for financial components
6. Test conflict resolution and admin workflows
7. Load testing for wallet and payment systems

### Phase 8: Deployment & Transition (2-3 weeks)

1. Set up production infrastructure for all four portals
2. Configure DNS for subdomains (brand, streamer, admin)
3. Implement gradual rollout to users with feature flags
4. Monitor financial system performance and accuracy
5. Validate KYC and compliance workflows
6. Address any issues and optimize performance

## Performance Optimizations

### Route-Based Code Splitting

Each portal should implement route-based code splitting:

```typescript
// apps/brand-portal/app/dashboard/campaigns/page.tsx
export default dynamic(() => import('@/components/pages/campaigns-page'), {
  loading: () => <LoadingSpinner />,
});
```

### Optimized Image Loading

```typescript
// apps/brand-portal/components/campaign-card.tsx
import Image from 'next/image';

export function CampaignCard({ campaign }) {
  return (
    <div className="campaign-card">
      <div className="campaign-image">
        <Image
          src={campaign.image}
          alt={campaign.name}
          width={300}
          height={200}
          priority={false}
          loading="lazy"
        />
      </div>
      {/* Campaign details */}
    </div>
  );
}
```

### Incremental Static Regeneration for Public Pages

```typescript
// apps/landing-site/app/features/page.tsx
export const revalidate = 3600; // Revalidate every hour

async function getData() {
  // Fetch data that changes infrequently
  return {...};
}

export default async function FeaturesPage() {
  const data = await getData();
  
  return (
    <div>
      {/* Render features */}
    </div>
  );
}
```

## Development Workflow

### Local Development Setup

```bash
# Clone the repo
git clone https://github.com/your-org/gametriggers-frontend.git
cd gametriggers-frontend

# Install dependencies
npm install

# Run development servers
npm run dev
```

### Development Commands

```json
// package.json
{
  "name": "gametriggers-frontend",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "dev:brand": "turbo run dev --filter=brand-portal",
    "dev:streamer": "turbo run dev --filter=streamer-portal",
    "dev:landing": "turbo run dev --filter=landing-site",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "prepare": "husky install"
  },
  "devDependencies": {
    "eslint": "^8.53.0",
    "prettier": "^3.0.3",
    "turbo": "^1.10.12",
    "husky": "^8.0.3"
  }
}
```

## Conclusion

Dividing the Gametriggers platform into separate brand and streamer portals aligns perfectly with the microservices backend architecture and provides numerous advantages:

1. **Specialized User Experience**: Each portal can be optimized for its specific user type, improving usability and satisfaction.

2. **Independent Scaling**: Each application can be scaled based on its specific traffic patterns and requirements.

3. **Faster Development Cycles**: Teams can work independently on different portals without conflicts.

4. **Improved Performance**: Smaller, focused applications with only the necessary code for each user type.

5. **Enhanced Security**: Separation of concerns reduces potential attack surfaces for each user type.

The proposed mono-repo structure maintains development efficiency through shared components and libraries while enabling independent deployment of each portal. This approach provides the benefits of microservices for the frontend while avoiding code duplication and ensuring consistent design across the platform.

By implementing this frontend separation strategy alongside the backend microservices architecture, the Gametriggers platform will be well-positioned for scale, maintainability, and future growth.

## Wallet & Financial System Integration

### Shared Wallet Components

The comprehensive wallet system requires shared components across all portals:

```typescript
// packages/wallet/components/wallet-dashboard.tsx
import { useState, useEffect } from 'react';
import { WalletBalance } from './wallet-balance';
import { TransactionHistory } from './transaction-history';
import { PaymentMethods } from './payment-methods';
import { WithdrawalSettings } from './withdrawal-settings';

export interface WalletDashboardProps {
  userRole: 'brand' | 'streamer' | 'admin';
  userId: string;
}

export function WalletDashboard({ userRole, userId }: WalletDashboardProps) {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Role-specific wallet features
  const getWalletFeatures = () => {
    switch (userRole) {
      case 'brand':
        return ['add-funds', 'campaign-reserves', 'budget-tracking', 'auto-topup'];
      case 'streamer':
        return ['earnings', 'withdrawals', 'kyc-verification', 'payment-history'];
      case 'admin':
        return ['all-wallets', 'transaction-monitoring', 'dispute-resolution', 'financial-reports'];
      default:
        return [];
    }
  };

  return (
    <div className="wallet-dashboard">
      <WalletBalance 
        balance={walletData?.balance} 
        reserved={walletData?.reservedBalance}
        role={userRole}
      />
      <TransactionHistory 
        transactions={transactions}
        features={getWalletFeatures()}
      />
      {userRole === 'brand' && <PaymentMethods userId={userId} />}
      {userRole === 'streamer' && <WithdrawalSettings userId={userId} />}
    </div>
  );
}
```

### Payment Integration Components

```typescript
// packages/wallet/components/payment-processor.tsx
import { useState } from 'react';
import { PaymentMethod } from '@/types/wallet';

export interface PaymentProcessorProps {
  amount: number;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  supportedMethods: PaymentMethod[];
}

export function PaymentProcessor({ amount, onSuccess, onError, supportedMethods }: PaymentProcessorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);

  const processPayment = async () => {
    setProcessing(true);
    try {
      const result = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: selectedMethod,
          currency: 'inr'
        })
      });

      if (result.ok) {
        const data = await result.json();
        onSuccess(data);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-processor">
      {/* Payment method selection UI */}
      {/* Stripe/UPI/Bank transfer forms */}
      {/* Processing states */}
    </div>
  );
}
```

## KYC & Compliance Integration

### Shared KYC Components

```typescript
// packages/kyc/components/kyc-verification.tsx
import { useState, useEffect } from 'react';
import { DocumentUpload } from './document-upload';
import { BankDetailsForm } from './bank-details-form';
import { VerificationStatus } from './verification-status';

export interface KYCVerificationProps {
  userId: string;
  userRole: 'brand' | 'streamer';
  onStatusChange?: (status: string) => void;
}

export function KYCVerification({ userId, userRole, onStatusChange }: KYCVerificationProps) {
  const [kycStatus, setKycStatus] = useState(null);
  const [documents, setDocuments] = useState([]);

  const getRequiredDocuments = () => {
    const common = ['pan', 'aadhaar', 'bank_statement'];
    if (userRole === 'brand') {
      return [...common, 'business_registration', 'gst_certificate'];
    }
    return [...common, 'cancelled_cheque'];
  };

  const submitKYC = async (formData: any) => {
    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userRole,
          requiredDocuments: getRequiredDocuments()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setKycStatus(result);
        onStatusChange?.(result.status);
      }
    } catch (error) {
      console.error('KYC submission failed:', error);
    }
  };

  return (
    <div className="kyc-verification">
      <VerificationStatus status={kycStatus?.status} />
      <DocumentUpload 
        requiredDocs={getRequiredDocuments()}
        onUpload={setDocuments}
      />
      <BankDetailsForm onSubmit={submitKYC} />
    </div>
  );
}
```

## Analytics & Reporting Systems

### Shared Analytics Framework

```typescript
// packages/analytics/components/analytics-dashboard.tsx
import { useState, useEffect } from 'react';
import { FinancialMetrics } from './financial-metrics';
import { PerformanceCharts } from './performance-charts';
import { CampaignAnalytics } from './campaign-analytics';

export interface AnalyticsDashboardProps {
  userRole: 'brand' | 'streamer' | 'admin';
  userId: string;
  timeRange: string;
}

export function AnalyticsDashboard({ userRole, userId, timeRange }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState(null);

  const getMetricsForRole = () => {
    switch (userRole) {
      case 'brand':
        return {
          primary: ['campaign_spend', 'impression_reach', 'click_through_rate', 'cost_per_acquisition'],
          financial: ['total_spend', 'budget_utilization', 'roi', 'average_campaign_cost'],
          performance: ['active_campaigns', 'top_performing_streamers', 'category_performance']
        };
      case 'streamer':
        return {
          primary: ['total_earnings', 'impression_delivered', 'engagement_rate', 'stream_performance'],
          financial: ['earnings_this_month', 'pending_withdrawals', 'earnings_growth', 'payment_history'],
          performance: ['active_campaigns', 'viewer_metrics', 'earnings_per_stream']
        };
      case 'admin':
        return {
          primary: ['platform_revenue', 'total_transactions', 'active_users', 'dispute_resolution'],
          financial: ['revenue_growth', 'transaction_volume', 'commission_earned', 'pending_payouts'],
          performance: ['campaign_success_rate', 'user_growth', 'platform_health']
        };
      default:
        return { primary: [], financial: [], performance: [] };
    }
  };

  return (
    <div className="analytics-dashboard">
      <FinancialMetrics 
        metrics={getMetricsForRole().financial}
        data={analyticsData?.financial}
        userRole={userRole}
      />
      <PerformanceCharts 
        charts={getMetricsForRole().performance}
        data={analyticsData?.performance}
        timeRange={timeRange}
      />
      <CampaignAnalytics 
        campaigns={analyticsData?.campaigns}
        userRole={userRole}
      />
    </div>
  );
}
```

## Admin Portal Features

### Financial Oversight Components

```typescript
// packages/admin/components/financial-oversight.tsx
import { useState, useEffect } from 'react';
import { WalletManagement } from './wallet-management';
import { DisputeResolution } from './dispute-resolution';
import { TransactionMonitoring } from './transaction-monitoring';
import { RevenueReporting } from './revenue-reporting';

export function FinancialOversight() {
  const [overview, setOverview] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);

  const getFinancialOverview = async () => {
    try {
      const response = await fetch('/api/admin/finance/overview');
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch financial overview:', error);
    }
  };

  return (
    <div className="admin-financial-oversight">
      <div className="overview-cards">
        <div className="metric-card">
          <h3>Total Platform Revenue</h3>
          <p className="amount">${overview?.totalRevenue?.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Pending Withdrawals</h3>
          <p className="amount">${overview?.pendingWithdrawals?.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Active Disputes</h3>
          <p className="count">{disputes.length}</p>
        </div>
      </div>

      <WalletManagement />
      <DisputeResolution disputes={disputes} />
      <TransactionMonitoring flagged={flaggedTransactions} />
      <RevenueReporting />
    </div>
  );
}
```

### Conflict Rules Management

```typescript
// packages/admin/components/conflict-rules-management.tsx
import { useState, useEffect } from 'react';

export interface ConflictRule {
  _id: string;
  name: string;
  type: 'category_exclusivity' | 'brand_exclusivity' | 'cooldown_period' | 'simultaneous_limit';
  severity: 'blocking' | 'warning' | 'advisory';
  config: any;
  isActive: boolean;
  priority: number;
}

export function ConflictRulesManagement() {
  const [rules, setRules] = useState<ConflictRule[]>([]);
  const [violations, setViolations] = useState([]);

  const createRule = async (ruleData: Partial<ConflictRule>) => {
    try {
      const response = await fetch('/api/admin/conflict-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      if (response.ok) {
        const newRule = await response.json();
        setRules(prev => [...prev, newRule]);
      }
    } catch (error) {
      console.error('Failed to create conflict rule:', error);
    }
  };

  return (
    <div className="conflict-rules-management">
      {/* Rule creation form */}
      {/* Active rules list */}
      {/* Recent violations */}
      {/* Rule performance analytics */}
    </div>
  );
}
```
