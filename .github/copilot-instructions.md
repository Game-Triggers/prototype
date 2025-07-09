# Super-Duper-Winner - GitHub Copilot Instructions

This document provides custom instructions for GitHub Copilot when working with the Gametriggers platform codebase.

## Project Architecture 

Gametriggers is a marketplace platform connecting brands with streamers for automated in-stream sponsorships, built as a unified Next.js application with an embedded NestJS backend:

- **Important note** : alwayes use script to run application is `npm run dev:unified` and do not use `taskkill /f /im node.exe` command to kill service and also remember to ignore linting errors in the codebase as it is not a production ready codebase and also do not use `npm run lint` command to check for linting errors.

- **Application Structure**: Single Next.js 15 app with App Router, integrating NestJS in `app/api/nest/`
- **Frontend**: Next.js (App Router) for UI, dashboards, and client-side logic
- **Backend**: NestJS mounted under `app/api/nest/` using custom request handlers (Express or Fastify adapter)
- **Database**: MongoDB for storing users, campaigns, analytics, and payment data
- **Authentication**: NextAuth with OAuth providers (Twitch, YouTube, etc.)
- **Payment Integration**: Stripe and PayPal for automated payouts
- **Streaming Integration**: OBS/Streamlabs browser sources for ad delivery
- **Real-Time Features**: WebSockets or Server-Sent Events (SSE) for analytics and campaign updates

Directory structure:

- `app/`: Next.js App Router pages and server components
- `app/api/v1/`: NestJS backend (mounted as API routes)
- `components/`: Reusable UI components (ShadcnUI)
- `lib/`: Shared utilities (e.g., API clients, helpers)
- `schemas/`: MongoDB schemas (Mongoose)
- `services/`: Business logic for campaigns, analytics, payments

## Coding Standards

### General

- Write self-documenting code with descriptive variable/function names
- Add comments only for complex or non-obvious logic
- Keep functions small and single-purpose
- Use async/await for asynchronous operations
- Follow SOLID principles
- Write unit tests for critical business logic
- Use clear commit messages (e.g., `feat: implement campaign creation API`, `fix: resolve ad delivery issue`)
- Use npm as an package manager. 

### Frontend (Next.js)

- Use App Router for all routes and leverage Server Components for data fetching
- Use Tailwind CSS for styling, adhering to utility-first principles
- Implement ShadcnUI components for consistent UI design
- Organize components in `components/` using atomic design
- Use TypeScript with strict mode
- Implement error boundaries and loading states
- Use Next.js server actions for form submissions where applicable
- Fetch data from `/api/nest/` endpoints securely

### Backend (NestJS in `app/api/nest/`)

- Follow NestJS module structure (controllers, services, repositories)
- Use TypeScript with strict mode
- Define RESTful endpoints or GraphQL resolvers in NestJS
- Use Mongoose for MongoDB schema definitions in `schemas/`
- Validate inputs using class-validator
- Handle errors with NestJS exception filters’.
- Place business logic in `services/` (e.g., campaign management, analytics)
- Integrate with Next.js API routes via custom handlers (e.g., `route.ts`)

## Testing Guidelines

- Write unit tests for NestJS services, controllers, and utilities using Jest
- Mock external dependencies (MongoDB, Stripe, PayPal, OAuth) with Jest mocks
- Test Next.js server components and API routes
- Implement integration tests for critical endpoints (e.g., campaign creation, ad delivery)
- Write end-to-end tests for key flows (e.g., streamer onboarding, campaign setup)
- Aim for 80%+ test coverage on business logic
- Use test fixtures for consistent test data

## Performance Best Practices

- Implement MongoDB indexes for frequent queries (e.g., streamer profiles, campaigns)
- Use caching for static data (e.g., campaign assets) via Next.js or Redis (if added)
- Optimize API responses with pagination and field projection
- Minimize database queries by fetching only necessary fields
- Use WebSockets or SSE for real-time analytics to reduce polling
- Leverage Next.js code splitting and dynamic imports for faster page loads
- Optimize ad delivery to minimize latency in OBS/Streamlabs integration
- Use streaming responses for large datasets if applicable

## Security Guidelines

- Never store sensitive data (e.g., API keys, OAuth tokens) in code or logs
- Validate and sanitize inputs using class-validator or Joi
- Use parameterized MongoDB queries to prevent injection attacks
- Implement OAuth-based authentication with NextAuth
- Enforce role-based authorization (streamer vs. brand) in NestJS
- Use HTTPS for all communications
- Encrypt sensitive data (e.g., payment details) in MongoDB
- Follow least privilege principles for database and API access
- Validate campaign assets for format, size, and content in NestJS
- Secure API routes with NextAuth session checks

## Additional Guidelines

- Ensure OBS/Streamlabs browser source compatibility for ad delivery
- Follow RESTful or GraphQL best practices for API design in NestJS
- Use environment variables for configuration (e.g., MongoDB URI, Stripe keys)
- Implement logging (e.g., Winston or Pino) for debugging and monitoring
- Ensure cross-browser compatibility (Chrome, Firefox, Safari) for frontend
- Use ESLint and Prettier for consistent code formatting
- Document API endpoints using Swagger (integrated with NestJS)
- Leverage Next.js streaming for real-time UI updates if applicable
- Optimize WebSocket/SSE connections for scalability
- Utilize MongoDB MCP (Model Context Protocol Server) for data access:
- Implement MongoDB MCP for consistent model-based data access patterns
- Define clear model schemas with proper validation in the MCP context
- Leverage MCP's automatic caching capabilities for frequently accessed data
- Use MCP's transaction support for operations requiring atomicity
- Implement proper error handling for MCP operations
- Structure models to optimize for the platform's access patterns
- Utilize MCP's built-in versioning for schema evolution
- Apply appropriate indexing strategies compatible with MCP patterns
- Configure connection pooling for optimal MCP performance
- Document MCP model relationships and access patterns