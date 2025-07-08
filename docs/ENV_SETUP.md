# Environment Variables Setup Guide

This document explains how the environment variables are configured for the Gametriggers platform.

## Overview

The application uses a single `.env` file in the root directory to configure both the Next.js frontend and NestJS backend. This streamlined approach ensures:

- All environment variables are defined in one place
- No duplication between frontend and backend configurations
- Easier maintenance and deployment

## Setup Instructions

1. Copy the `.env.example` file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to set your environment-specific values:
   - Generate secure random strings for secrets:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - Add MongoDB connection details
   - Configure OAuth credentials (Twitch, YouTube, etc.)
   - Set up payment integration keys (Stripe, PayPal)

3. Important: Never commit your `.env` file to version control.

## Environment Variables Structure

The `.env` file is organized into sections:

1. **Shared Configuration**: Variables used by both frontend and backend
   - `NODE_ENV`, `PORT`, `NEST_PORT`, `FRONTEND_URL`, etc.

2. **Next.js / Frontend Configuration**: Variables specific to the Next.js app
   - `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`, etc.

3. **NestJS / Backend Configuration**: Variables specific to the NestJS API
   - `MONGODB_URI`, `JWT_SECRET`, etc.

4. **OAuth Providers**: Credentials for authentication providers
   - `TWITCH_CLIENT_ID`, `GOOGLE_CLIENT_ID`, etc.

5. **Payment Integration**: Keys for Stripe and PayPal
   - `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, etc.

6. **File Upload Settings**: Configuration for media uploads
   - `UPLOAD_DIR`, `MAX_FILE_SIZE`, etc.

7. **Logging**: Log level configuration
   - `LOG_LEVEL`

## How It Works

- The Next.js app automatically loads environment variables from the root `.env` file
- The NestJS backend is configured to look for environment variables in the following order:
  1. Root directory `.env`
  2. Root directory `.env.local`
  3. Backend directory `.env`
  4. Backend directory `.env.local`

## Development vs Production

For local development:
- Use `NODE_ENV=development`
- Use `localhost` URLs and test credentials

For production deployment:
- Use `NODE_ENV=production`
- Use actual domain names and production credentials
- Consider using a vault service for sensitive credentials in production
