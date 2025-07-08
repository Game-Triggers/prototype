# Authentication System Guide

## Overview

The authentication system has been refactored to use NextAuth.js as the primary authentication provider, with NestJS handling the user management and business logic. This approach simplifies our authentication flow and reduces 401 unauthorized errors.

## Architecture

1. **NextAuth.js (Frontend)**: Handles OAuth and credentials-based authentication, session management, and token storage
2. **NestJS (Backend)**: Validates tokens, manages users, and handles business logic
3. **API Proxy Middleware**: Routes API requests with proper authentication headers

## Authentication Flow

### User Login/Registration

1. User signs in using one of three methods:
   - Credentials (email/password)
   - Twitch OAuth
   - YouTube OAuth

2. NextAuth processes the authentication:
   - For credentials: It calls `/api/login` which forwards to NestJS for validation
   - For OAuth: It handles OAuth flow and exchanges tokens with NestJS backend

3. After successful authentication:
   - NextAuth generates a JWT token containing user data and tokens
   - The token is stored in a secure HTTP-only cookie
   - User is redirected to the dashboard or requested page

### API Authentication

1. The client makes an API request
2. Our middleware intercepts the request and:
   - Extracts the token from the NextAuth session
   - Adds it as a Bearer token in the Authorization header
   - Forwards the request to the appropriate endpoint

3. NestJS receives the request and:
   - Validates the token using JwtStrategy
   - Extracts user information
   - Processes the request with proper authorization

## Key Components

### 1. NextAuth Configuration (`lib/auth.ts`)

This file contains the NextAuth.js configuration with:
- OAuth providers (Twitch, Google)
- Credentials provider for email/password login
- JWT token management
- Session callbacks

### 2. Middleware (`middleware.ts`)

Automatically adds authentication headers to API requests based on the NextAuth session.

### 3. API Proxy (`lib/api-proxy.ts`)

Routes API requests between Next.js and NestJS with proper authentication.

### 4. JWT Strategy (`backend/src/modules/auth/strategies/jwt.strategy.ts`)

Validates tokens from both NextAuth and NestJS using a shared secret.

## Environment Variables

For the authentication system to work properly, these environment variables must be set:

```
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_secret_here

# OAuth Providers
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NestJS Authentication
JWT_SECRET=same_as_nextauth_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ISSUER=nestjs-auth
```

## Troubleshooting

### Testing Authentication

Use the `/api/auth/validate` endpoint to verify authentication:
- `GET /api/auth/validate` - Checks the current session
- `POST /api/auth/validate` with `{token: "your_token"}` - Validates a specific token

### Common Issues

1. **401 Unauthorized Errors**:
   - Check that `NEXTAUTH_SECRET` and `JWT_SECRET` match
   - Verify the token hasn't expired
   - Ensure cookies are being properly sent with requests

2. **Invalid Token Errors**:
   - Make sure the issuer configuration is correct
   - Check that token formats are consistent between NextAuth and NestJS

3. **OAuth Integration Issues**:
   - Verify callback URLs are correctly configured in the OAuth provider dashboards
   - Check the OAuth token exchange endpoints are working correctly

## Migration Notes

1. Token refresh is now handled automatically by NextAuth
2. API client code should use the session token from NextAuth
3. Direct NestJS authentication endpoints are still available but should be used only for specific purposes