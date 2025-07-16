#!/bin/bash

# Gametriggers Microservices Setup Script
# This script sets up the initial microservices architecture

set -e

echo "🚀 Setting up Gametriggers Microservices Architecture..."

# Create the main microservices directory structure
echo "📁 Creating directory structure..."

# Root microservices directory
mkdir -p microservices

# API Gateway
mkdir -p microservices/api-gateway/src/{middleware,routes,utils}

# Services
services=("identity" "brand" "streamer" "campaign" "participation" "analytics" "payment" "asset" "notification" "overlay")

for service in "${services[@]}"; do
    echo "Creating $service service structure..."
    mkdir -p "microservices/services/$service/src/{modules,shared,config}"
    mkdir -p "microservices/services/$service/src/modules/$service/{controllers,services,dto,entities,schemas}"
    mkdir -p "microservices/services/$service/test"
    mkdir -p "microservices/services/$service/docker"
done

# Shared packages
mkdir -p microservices/packages/{auth,api-client,types,utils,monitoring}

# Infrastructure
mkdir -p microservices/infrastructure/{docker,k8s,monitoring}

# Frontend monorepo structure
mkdir -p frontend/{apps,packages,tools}
mkdir -p frontend/apps/{brand-portal,streamer-portal,landing-site}
mkdir -p frontend/packages/{ui,auth,api-client,utils}

echo "📦 Creating package.json files..."

# Root package.json for microservices
cat > microservices/package.json << 'EOF'
{
  "name": "gametriggers-microservices",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "services/*",
    "packages/*",
    "api-gateway"
  ],
  "scripts": {
    "dev": "docker-compose -f infrastructure/docker/docker-compose.dev.yml up",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "setup:local": "./scripts/setup-local.sh"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
EOF

# API Gateway package.json
cat > microservices/api-gateway/package.json << 'EOF'
{
  "name": "api-gateway",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/main.js",
    "start:dev": "nodemon src/main.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "http-proxy-middleware": "^2.0.0",
    "jsonwebtoken": "^9.0.0",
    "express-rate-limit": "^7.0.0",
    "winston": "^3.8.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/cors": "^2.8.0",
    "typescript": "^5.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0"
  }
}
EOF

# Create sample service package.json (Identity Service)
cat > microservices/services/identity/package.json << 'EOF'
{
  "name": "identity-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/mongoose": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "mongoose": "^8.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/bcryptjs": "^2.4.0",
    "jest": "^29.5.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
EOF

echo "🐳 Creating Docker configuration..."

# Docker Compose for development
cat > microservices/infrastructure/docker/docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: ../../api-gateway
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - JWT_SECRET=dev-secret-key
    volumes:
      - ../../api-gateway:/app
      - /app/node_modules
    depends_on:
      - identity-service
      - brand-service

  # Identity Service
  identity-service:
    build:
      context: ../../services/identity
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo-identity:27017/identity
      - JWT_SECRET=dev-secret-key
    volumes:
      - ../../services/identity:/app
      - /app/node_modules
    depends_on:
      - mongo-identity

  # Brand Service
  brand-service:
    build:
      context: ../../services/brand
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo-brand:27017/brands
    volumes:
      - ../../services/brand:/app
      - /app/node_modules
    depends_on:
      - mongo-brand

  # Streamer Service
  streamer-service:
    build:
      context: ../../services/streamer
      dockerfile: Dockerfile.dev
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo-streamer:27017/streamers
    volumes:
      - ../../services/streamer:/app
      - /app/node_modules
    depends_on:
      - mongo-streamer

  # Databases
  mongo-identity:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - identity-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=identity

  mongo-brand:
    image: mongo:7
    ports:
      - "27018:27017"
    volumes:
      - brand-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=brands

  mongo-streamer:
    image: mongo:7
    ports:
      - "27019:27017"
    volumes:
      - streamer-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=streamers

  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ../monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  identity-data:
  brand-data:
  streamer-data:
  rabbitmq-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  default:
    name: gametriggers-network
EOF

echo "⚙️ Creating environment configuration..."

# Environment template
cat > microservices/.env.example << 'EOF'
# Development Environment Configuration

# Database URLs
MONGODB_URI_IDENTITY=mongodb://localhost:27017/identity
MONGODB_URI_BRAND=mongodb://localhost:27018/brands
MONGODB_URI_STREAMER=mongodb://localhost:27019/streamers

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Message Broker
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# Redis
REDIS_URL=redis://localhost:6379

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=gametriggers-assets
AWS_REGION=us-east-1

# Monitoring
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001

# External APIs
TWITCH_API_URL=https://api.twitch.tv/helix
YOUTUBE_API_URL=https://www.googleapis.com/youtube/v3
EOF

echo "🔧 Creating development scripts..."

# Setup script for local development
cat > microservices/scripts/setup-local.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up local development environment..."

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update with your actual values."
fi

# Install dependencies for all services
echo "📦 Installing dependencies..."
npm install

# Build shared packages first
echo "🏗️ Building shared packages..."
npm run build --workspace=packages/types
npm run build --workspace=packages/utils

# Start MongoDB containers for development
echo "🗄️ Starting development databases..."
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d mongo-identity mongo-brand mongo-streamer redis rabbitmq

# Wait for databases to be ready
echo "⏳ Waiting for databases to initialize..."
sleep 10

echo "✅ Local development environment is ready!"
echo "🚀 Run 'npm run dev' to start all services"
EOF

chmod +x microservices/scripts/setup-local.sh

echo "📋 Creating TypeScript configurations..."

# Root tsconfig.json
cat > microservices/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@gametriggers/types": ["./packages/types/src"],
      "@gametriggers/utils": ["./packages/utils/src"],
      "@gametriggers/auth": ["./packages/auth/src"],
      "@gametriggers/api-client": ["./packages/api-client/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
EOF

echo "🏗️ Creating sample service implementations..."

# Identity Service main module
mkdir -p microservices/services/identity/src
cat > microservices/services/identity/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  
  await app.listen(port);
  console.log(`🔐 Identity Service is running on port ${port}`);
}

bootstrap();
EOF

# Identity Service App Module
cat > microservices/services/identity/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './modules/identity/auth.module';
import { UsersModule } from './modules/identity/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
    }),
    
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
EOF

echo "🎯 Creating shared packages..."

# Shared types package
mkdir -p microservices/packages/types/src
cat > microservices/packages/types/src/index.ts << 'EOF'
// Auth types
export interface User {
  id: string;
  email: string;
  userType: 'brand' | 'streamer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand extends User {
  userType: 'brand';
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
}

export interface Streamer extends User {
  userType: 'streamer';
  displayName: string;
  platforms: StreamerPlatform[];
}

export interface StreamerPlatform {
  type: 'twitch' | 'youtube' | 'tiktok' | 'facebook';
  username: string;
  channelId: string;
  verified: boolean;
  metrics: {
    followers: number;
    averageViewers: number;
    totalViews: number;
  };
}

// Campaign types
export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description: string;
  budget: number;
  targetAudience: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
EOF

# Shared API client package
mkdir -p microservices/packages/api-client/src
cat > microservices/packages/api-client/src/index.ts << 'EOF'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, private authToken?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

// Service-specific clients
export class IdentityApiClient extends ApiClient {
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async register(userData: any) {
    return this.post('/auth/register', userData);
  }

  async getProfile() {
    return this.get('/auth/profile');
  }
}

export class BrandApiClient extends ApiClient {
  async getBrand(id: string) {
    return this.get(`/brands/${id}`);
  }

  async updateBrand(id: string, data: any) {
    return this.put(`/brands/${id}`, data);
  }

  async getCampaigns() {
    return this.get('/brands/campaigns');
  }
}

export class StreamerApiClient extends ApiClient {
  async getStreamer(id: string) {
    return this.get(`/streamers/${id}`);
  }

  async updateStreamer(id: string, data: any) {
    return this.put(`/streamers/${id}`, data);
  }

  async getEligibleCampaigns() {
    return this.get('/streamers/campaigns');
  }
}
EOF

echo "📖 Creating documentation..."

cat > microservices/README.md << 'EOF'
# Gametriggers Microservices Architecture

This repository contains the microservices implementation of the Gametriggers platform.

## Architecture Overview

The platform is divided into the following microservices:

- **API Gateway**: Routes requests and handles authentication
- **Identity Service**: User authentication and management
- **Brand Service**: Brand profile and company management
- **Streamer Service**: Streamer profile and platform integration
- **Campaign Service**: Campaign lifecycle management
- **Participation Service**: Streamer-campaign relationships
- **Analytics Service**: Data analytics and reporting
- **Payment Service**: Financial transactions
- **Asset Service**: Media asset management
- **Notification Service**: Communication management
- **Overlay Service**: Streaming overlay management

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB (for development)

### Setup

1. Clone the repository
2. Run the setup script:
   ```bash
   chmod +x scripts/setup-local.sh
   ./scripts/setup-local.sh
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Start the development environment:
   ```bash
   npm run dev
   ```

## Development

### Project Structure

```
microservices/
├── api-gateway/          # API Gateway service
├── services/             # Individual microservices
│   ├── identity/         # Authentication service
│   ├── brand/            # Brand management
│   ├── streamer/         # Streamer management
│   └── ...
├── packages/             # Shared packages
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── api-client/       # API client library
└── infrastructure/       # Docker and K8s configs
```

### Commands

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all services
- `npm run test` - Run tests for all services
- `npm run lint` - Lint all services

## Deployment

### Development
Use Docker Compose for local development:
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up
```

### Production
Deploy to Kubernetes using the provided manifests in `infrastructure/k8s/`.

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Run the test suite
5. Submit a pull request

## License

Private - Gametriggers Platform
EOF

echo "✅ Microservices setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. cd microservices"
echo "2. ./scripts/setup-local.sh"
echo "3. Update .env with your configuration"
echo "4. npm run dev"
echo ""
echo "🔗 Services will be available at:"
echo "   - API Gateway: http://localhost:3000"
echo "   - Identity Service: http://localhost:3001"
echo "   - Brand Service: http://localhost:3002"
echo "   - Streamer Service: http://localhost:3003"
echo ""
echo "📊 Monitoring:"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3001 (admin/admin123)"
echo "   - RabbitMQ Management: http://localhost:15672 (admin/admin123)"
