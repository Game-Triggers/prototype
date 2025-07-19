# Gametriggers Platform - New Project Implementation Plan

## 🎯 Project Overview

**Project Name**: Gametriggers Platform (Fresh Architecture)  
**Timeline**: 26 weeks (6 months)  
**Team Size**: 3-5 developers  
**Architecture**: Microservices with specialized frontend portals  

## 📋 Tech Stack Specification

### **Frontend Stack**
```typescript
// All frontend applications
{
  "framework": "Next.js 15",
  "router": "App Router",
  "authentication": "NextAuth.js v5",
  "styling": "Tailwind CSS",
  "ui": "shadcn/ui",
  "state": "Zustand",
  "forms": "React Hook Form + Zod",
  "http": "Axios",
  "typescript": "5.x"
}
```

### **Backend Stack**
```typescript
// All microservices
{
  "framework": "NestJS 10",
  "runtime": "Node.js 20",
  "validation": "class-validator",
  "orm": "Mongoose (MongoDB) / Prisma (PostgreSQL)",
  "authentication": "JWT + Passport",
  "api": "REST + GraphQL (where needed)",
  "typescript": "5.x"
}
```

### **Database Strategy by Service**
```yaml
# Service-specific database choices
identity-service:
  database: MongoDB
  reason: "Flexible user profiles, OAuth data"
  
brand-service:
  database: MongoDB  
  reason: "Complex nested company data, preferences"
  
streamer-service:
  database: MongoDB
  reason: "Platform integrations, overlay settings"
  
campaign-service:
  database: MongoDB
  reason: "Flexible campaign rules, targeting"
  
participation-service:
  database: MongoDB
  reason: "Event-driven participation tracking"
  
analytics-service:
  database: TimescaleDB (PostgreSQL)
  reason: "Time-series metrics, aggregations"
  
payment-service:
  database: PostgreSQL
  reason: "ACID compliance, financial data"
  
asset-service:
  database: MongoDB + S3
  reason: "Metadata in MongoDB, files in S3"
  
overlay-service:
  database: Redis + MongoDB
  reason: "Real-time data in Redis, config in MongoDB"
  
notification-service:
  database: MongoDB + Redis
  reason: "Templates in MongoDB, queue in Redis"
  
admin-service:
  database: PostgreSQL
  reason: "Audit logs, admin operations"
```

### **Infrastructure Stack**
```yaml
development:
  containerization: Docker + Docker Compose
  api_gateway: Express.js with http-proxy-middleware
  message_queue: Redis (simple pub/sub)
  file_storage: MinIO (S3-compatible)
  monitoring: Console logs + basic metrics

production:
  orchestration: Kubernetes
  api_gateway: Kong or AWS API Gateway
  message_queue: RabbitMQ or AWS SQS
  file_storage: AWS S3
  monitoring: Prometheus + Grafana
  logging: ELK Stack
```

## 🏗️ Project Structure

```
gametriggers-platform/
├── services/                           # Backend microservices
│   ├── identity-service/
│   ├── brand-service/
│   ├── streamer-service/
│   ├── campaign-service/
│   ├── participation-service/
│   ├── analytics-service/
│   ├── payment-service/
│   ├── asset-service/
│   ├── overlay-service/
│   ├── notification-service/
│   └── admin-service/
├── frontends/                          # Frontend applications
│   ├── brand-portal/                   # Next.js app for brands
│   ├── streamer-portal/                # Next.js app for streamers  
│   ├── admin-portal/                   # Next.js app for admins
│   └── landing-site/                   # Marketing website
├── packages/                           # Shared packages
│   ├── ui/                            # Shared UI components
│   ├── types/                         # TypeScript definitions
│   ├── utils/                         # Shared utilities
│   └── api-client/                    # API client library
├── infrastructure/                     # DevOps and deployment
│   ├── docker/                        # Docker configurations
│   ├── k8s/                          # Kubernetes manifests
│   └── scripts/                       # Automation scripts
├── api-gateway/                        # API Gateway service
├── migration-tools/                    # Data migration scripts
├── docs/                              # Documentation
└── docker-compose.yml                 # Local development setup
```

## 📅 Phase-by-Phase Implementation Plan

### **Phase 1: Foundation & Core Infrastructure (Weeks 1-6)**

#### **Week 1-2: Project Setup & Shared Packages**

```bash
# 1. Initialize project structure
mkdir gametriggers-platform && cd gametriggers-platform
npm init -w packages/types
npm init -w packages/utils  
npm init -w packages/ui
npm init -w packages/api-client

# 2. Setup shared TypeScript configuration
# Root tsconfig.json with workspace references
```

**Deliverables:**
- Project structure with workspaces
- Shared TypeScript types package
- Common utilities package
- UI component library foundation
- Development tooling (ESLint, Prettier, Husky)

**Shared Types Package:**
```typescript
// packages/types/src/index.ts
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  userType: 'brand' | 'streamer' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand extends BaseUser {
  userType: 'brand';
  companyInfo: CompanyInfo;
  preferences: BrandPreferences;
  verification: VerificationStatus;
}

export interface Streamer extends BaseUser {
  userType: 'streamer';
  platforms: StreamingPlatform[];
  content: ContentInfo;
  overlaySettings: OverlaySettings;
}

// ... more shared types
```

#### **Week 3-4: Identity Service & API Gateway**

```bash
# 1. Create Identity Service
mkdir -p services/identity-service
cd services/identity-service
npm init
npm install @nestjs/core @nestjs/common @nestjs/jwt @nestjs/passport
npm install mongoose @nestjs/mongoose
npm install bcryptjs class-validator class-transformer

# 2. Create API Gateway
mkdir -p api-gateway
cd api-gateway
npm init
npm install express http-proxy-middleware cors helmet
```

**Identity Service Structure:**
```typescript
// services/identity-service/src/app.module.ts
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
})
export class AppModule {}

// services/identity-service/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    // Hash password
    // Create user in MongoDB
    // Generate JWT
    // Return token and user info
  }
  
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Validate credentials
    // Generate JWT
    // Return token and user info
  }
  
  async validateToken(token: string): Promise<User> {
    // Verify JWT
    // Return user data
  }
}
```

**API Gateway Configuration:**
```typescript
// api-gateway/src/app.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Service discovery configuration
const services = {
  identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
  brand: process.env.BRAND_SERVICE_URL || 'http://localhost:3002',
  streamer: process.env.STREAMER_SERVICE_URL || 'http://localhost:3003',
  campaign: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:3004',
  // ... other services
};

// Authentication middleware
app.use('/api/auth', createProxyMiddleware({
  target: services.identity,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
}));

// Protected routes with auth validation
app.use('/api/brands', authenticateToken, createProxyMiddleware({
  target: services.brand,
  changeOrigin: true,
  pathRewrite: { '^/api/brands': '/brands' },
}));
```

#### **Week 5-6: Development Environment & CI/CD**

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  # Databases
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
  
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gametriggers
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports: ["6379:6379"]
  
  # Services
  identity-service:
    build: ./services/identity-service
    ports: ["3001:3001"]
    environment:
      - MONGODB_URI=mongodb://root:password@mongodb:27017/identity?authSource=admin
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongodb
  
  api-gateway:
    build: ./api-gateway
    ports: ["3000:3000"]
    environment:
      - IDENTITY_SERVICE_URL=http://identity-service:3001
    depends_on:
      - identity-service

volumes:
  mongodb_data:
  postgres_data:
```

### **Phase 2: Entity Services (Weeks 7-12)**

#### **Week 7-8: Brand Service**

```typescript
// services/brand-service/src/brands/brands.service.ts
@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    private readonly httpService: HttpService, // For calling other services
  ) {}

  async createBrand(userId: string, createBrandDto: CreateBrandDto): Promise<Brand> {
    // Validate user exists in Identity Service
    const user = await this.validateUser(userId);
    
    // Create brand profile
    const brand = new this.brandModel({
      userId,
      email: user.email,
      ...createBrandDto,
    });
    
    return brand.save();
  }
  
  async updatePreferences(brandId: string, preferences: BrandPreferences): Promise<Brand> {
    return this.brandModel.findByIdAndUpdate(brandId, { preferences }, { new: true });
  }
  
  private async validateUser(userId: string): Promise<BaseUser> {
    // Call Identity Service to validate user
    const response = await this.httpService
      .get(`${process.env.IDENTITY_SERVICE_URL}/users/${userId}`)
      .toPromise();
    return response.data;
  }
}

// services/brand-service/src/schemas/brand.schema.ts
@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: Object, required: true })
  companyInfo: {
    name: string;
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'enterprise';
    website?: string;
  };

  @Prop({ type: Object })
  contactPerson: {
    name: string;
    position: string;
    phone?: string;
  };

  @Prop({ type: Object })
  preferences: {
    targetAudience: string[];
    contentCategories: string[];
    budgetRange: { min: number; max: number; };
    regions: string[];
  };

  @Prop({ type: Object })
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    documents: string[];
    verifiedAt?: Date;
  };
}
```

#### **Week 9-10: Streamer Service**

```typescript
// services/streamer-service/src/streamers/streamers.service.ts
@Injectable()
export class StreamersService {
  async connectPlatform(streamerId: string, platformData: PlatformConnectionDto): Promise<StreamingPlatform> {
    // Handle OAuth flow for Twitch/YouTube
    // Store encrypted tokens
    // Fetch initial metrics
    // Update streamer profile
  }
  
  async updateOverlaySettings(streamerId: string, settings: OverlaySettings): Promise<Streamer> {
    // Update overlay configuration
    // Notify Overlay Service of changes
    return this.streamerModel.findByIdAndUpdate(streamerId, { overlaySettings: settings });
  }
  
  async getEligibleCampaigns(streamerId: string): Promise<Campaign[]> {
    // Get streamer preferences and metrics
    // Call Campaign Service to find matching campaigns
    const streamer = await this.findById(streamerId);
    
    const response = await this.httpService
      .post(`${process.env.CAMPAIGN_SERVICE_URL}/campaigns/eligible`, {
        categories: streamer.content.categories,
        language: streamer.content.language,
        metrics: streamer.platforms[0].metrics,
      })
      .toPromise();
      
    return response.data;
  }
}
```

#### **Week 11-12: Admin Service**

```typescript
// services/admin-service/src/admin/admin.service.ts
@Injectable()
export class AdminService {
  async verifyBrand(adminId: string, brandId: string, decision: 'approve' | 'reject', notes?: string): Promise<void> {
    // Validate admin permissions
    // Update brand verification status
    // Send notification
    // Log audit trail
    
    await this.httpService
      .patch(`${process.env.BRAND_SERVICE_URL}/brands/${brandId}/verification`, {
        status: decision === 'approve' ? 'verified' : 'rejected',
        verifiedBy: adminId,
        notes,
      })
      .toPromise();
      
    // Send notification
    await this.notificationService.send({
      type: 'brand_verification',
      recipientId: brandId,
      data: { decision, notes },
    });
  }
  
  async getDashboardMetrics(): Promise<AdminDashboard> {
    // Aggregate metrics from all services
    const [users, campaigns, revenue] = await Promise.all([
      this.getUserStats(),
      this.getCampaignStats(), 
      this.getRevenueStats(),
    ]);
    
    return { users, campaigns, revenue };
  }
}
```

### **Phase 3: Business Logic Services (Weeks 13-18)**

#### **Week 13-14: Campaign Service**

```typescript
// services/campaign-service/src/campaigns/campaigns.service.ts
@Injectable()
export class CampaignsService {
  async createCampaign(brandId: string, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    // Validate brand exists and is verified
    // Create campaign
    // Upload assets to Asset Service
    // Notify matching streamers
    
    const campaign = new this.campaignModel({
      brandId,
      ...createCampaignDto,
      status: 'draft',
    });
    
    await campaign.save();
    
    // Find eligible streamers
    const eligibleStreamers = await this.findEligibleStreamers(campaign);
    
    // Send notifications
    await this.notificationService.notifyStreamers(eligibleStreamers, campaign);
    
    return campaign;
  }
  
  async findEligibleStreamers(campaign: Campaign): Promise<string[]> {
    const response = await this.httpService
      .post(`${process.env.STREAMER_SERVICE_URL}/streamers/filter`, {
        categories: campaign.targetCategories,
        languages: campaign.targetLanguages,
        minFollowers: campaign.requirements.minFollowers,
      })
      .toPromise();
      
    return response.data.map(s => s.id);
  }
}
```

#### **Week 15-16: Participation Service**

```typescript
// services/participation-service/src/participations/participations.service.ts
@Injectable()
export class ParticipationsService {
  async applyToCampaign(streamerId: string, campaignId: string): Promise<Participation> {
    // Validate streamer eligibility
    // Check campaign availability
    // Create participation record
    // Notify brand of new application
    
    const participation = new this.participationModel({
      streamerId,
      campaignId,
      status: 'pending',
      appliedAt: new Date(),
    });
    
    await participation.save();
    
    // Notify brand
    const campaign = await this.getCampaign(campaignId);
    await this.notificationService.notifyBrand(campaign.brandId, {
      type: 'new_application',
      campaignId,
      streamerId,
    });
    
    return participation;
  }
  
  async acceptApplication(campaignId: string, streamerId: string): Promise<void> {
    // Update participation status
    // Generate overlay configuration
    // Start tracking impressions
    
    await this.participationModel.updateOne(
      { campaignId, streamerId },
      { status: 'active', acceptedAt: new Date() }
    );
    
    // Setup overlay for streamer
    await this.overlayService.setupCampaignOverlay(streamerId, campaignId);
    
    // Start analytics tracking
    await this.analyticsService.startTracking(campaignId, streamerId);
  }
}
```

#### **Week 17-18: Analytics Service**

```typescript
// services/analytics-service/src/analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Impression) private impressionRepo: Repository<Impression>,
    @InjectRepository(Metric) private metricRepo: Repository<Metric>,
  ) {}
  
  async recordImpression(impressionData: ImpressionDto): Promise<void> {
    // Record impression in TimescaleDB
    const impression = this.impressionRepo.create({
      campaignId: impressionData.campaignId,
      streamerId: impressionData.streamerId,
      timestamp: new Date(),
      viewerCount: impressionData.viewerCount,
      platform: impressionData.platform,
    });
    
    await this.impressionRepo.save(impression);
    
    // Update real-time metrics
    await this.updateMetrics(impressionData.campaignId, impressionData.streamerId);
  }
  
  async getCampaignAnalytics(campaignId: string, dateRange: DateRange): Promise<CampaignAnalytics> {
    // Aggregate impressions, clicks, conversions
    const query = `
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as impressions,
        AVG(viewer_count) as avg_viewers,
        SUM(click_count) as clicks
      FROM impressions 
      WHERE campaign_id = $1 
        AND timestamp BETWEEN $2 AND $3
      GROUP BY hour
      ORDER BY hour;
    `;
    
    const results = await this.impressionRepo.query(query, [
      campaignId, 
      dateRange.start, 
      dateRange.end
    ]);
    
    return {
      totalImpressions: results.reduce((sum, r) => sum + r.impressions, 0),
      averageViewers: results.reduce((sum, r) => sum + r.avg_viewers, 0) / results.length,
      totalClicks: results.reduce((sum, r) => sum + r.clicks, 0),
      hourlyData: results,
    };
  }
}
```

### **Phase 4: Supporting Services (Weeks 19-22)**

#### **Week 19: Payment Service**

```typescript
// services/payment-service/src/payments/payments.service.ts
@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    private readonly stripeService: StripeService,
  ) {}
  
  async processEarnings(participationId: string, amount: number): Promise<Transaction> {
    // Calculate streamer earnings
    // Create transaction record
    // Update wallet balance
    // Handle platform fees
    
    const earning = this.transactionRepo.create({
      participationId,
      amount,
      type: 'earning',
      status: 'pending',
      feeAmount: amount * 0.05, // 5% platform fee
    });
    
    await this.transactionRepo.save(earning);
    
    // Update wallet
    await this.updateWalletBalance(participationId, amount);
    
    return earning;
  }
  
  async processPayout(streamerId: string, amount: number): Promise<void> {
    // Validate wallet balance
    // Create Stripe transfer
    // Record transaction
    
    const wallet = await this.getStreamerWallet(streamerId);
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Process with Stripe
    const transfer = await this.stripeService.transfers.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      destination: wallet.stripeAccountId,
    });
    
    // Record transaction
    await this.transactionRepo.save({
      streamerId,
      amount: -amount,
      type: 'payout',
      status: 'completed',
      externalId: transfer.id,
    });
  }
}
```

#### **Week 20: Asset Service**

```typescript
// services/asset-service/src/assets/assets.service.ts
@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    private readonly s3Service: S3Service,
  ) {}
  
  async uploadCampaignAsset(file: Express.Multer.File, campaignId: string): Promise<Asset> {
    // Validate file type and size
    // Upload to S3
    // Create asset record
    // Generate CDN URLs
    
    const fileKey = `campaigns/${campaignId}/${Date.now()}-${file.originalname}`;
    
    const uploadResult = await this.s3Service.upload({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();
    
    const asset = new this.assetModel({
      campaignId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      s3Key: fileKey,
      url: uploadResult.Location,
      cdnUrl: `${process.env.CDN_URL}/${fileKey}`,
    });
    
    return asset.save();
  }
  
  async optimizeForOverlay(assetId: string): Promise<Asset> {
    // Generate different sizes for overlay display
    // Create webp versions for better performance
    // Update asset record with optimized URLs
  }
}
```

#### **Week 21-22: Overlay & Notification Services**

```typescript
// services/overlay-service/src/overlay/overlay.service.ts
@Injectable()
export class OverlayService {
  async generateOverlayUrl(streamerId: string): Promise<string> {
    // Generate authenticated overlay URL for OBS
    const token = this.generateOverlayToken(streamerId);
    return `${process.env.OVERLAY_BASE_URL}/${streamerId}?token=${token}`;
  }
  
  async getActiveAds(streamerId: string): Promise<OverlayAd[]> {
    // Get active campaigns for streamer
    // Apply rotation logic
    // Return current ad to display
    
    const activeParticipations = await this.getActiveParticipations(streamerId);
    const rotationStrategy = await this.getRotationStrategy(streamerId);
    
    return this.selectAdsForDisplay(activeParticipations, rotationStrategy);
  }
  
  @SubscribeMessage('overlay-connected')
  handleOverlayConnection(client: Socket, data: { streamerId: string }) {
    // Add streamer to real-time room
    // Send current ad configuration
    client.join(`streamer-${data.streamerId}`);
    
    // Start sending live ad updates
    this.startAdRotation(client, data.streamerId);
  }
}

// services/notification-service/src/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  async sendEmail(notification: EmailNotification): Promise<void> {
    // Send via AWS SES or SendGrid
    // Track delivery status
    // Handle bounces and complaints
  }
  
  async sendInApp(notification: InAppNotification): Promise<void> {
    // Store in database
    // Send via WebSocket to active users
    // Queue for offline users
  }
  
  async processNotificationQueue(): Promise<void> {
    // Process queued notifications
    // Apply rate limiting
    // Handle failures with retry logic
  }
}
```

### **Phase 5: Frontend Applications (Weeks 23-26)**

#### **Week 23: Shared UI Package & Brand Portal**

```typescript
// packages/ui/src/components/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Brand Portal Structure:**
```typescript
// frontends/brand-portal/app/layout.tsx
import { AuthProvider } from '@gametriggers/auth';
import { Sidebar } from '@/components/layout/Sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

// frontends/brand-portal/app/campaigns/page.tsx
import { getCampaigns } from '@/lib/api';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { CreateCampaignButton } from '@/components/campaigns/CreateCampaignButton';

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <CreateCampaignButton />
      </div>
      <CampaignList campaigns={campaigns} />
    </div>
  );
}
```

#### **Week 24: Streamer Portal**

```typescript
// frontends/streamer-portal/app/dashboard/page.tsx
import { getStreamerDashboard } from '@/lib/api';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { ActiveCampaigns } from '@/components/campaigns/ActiveCampaigns';
import { OverlaySettings } from '@/components/overlay/OverlaySettings';

export default async function DashboardPage() {
  const dashboard = await getStreamerDashboard();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EarningsCard earnings={dashboard.earnings} />
        <ActiveCampaigns campaigns={dashboard.activeCampaigns} />
        <OverlaySettings settings={dashboard.overlaySettings} />
      </div>
    </div>
  );
}

// frontends/streamer-portal/components/overlay/OverlayUrlGenerator.tsx
'use client';

import { useState } from 'react';
import { Button } from '@gametriggers/ui';
import { generateOverlayUrl } from '@/lib/api';

export function OverlayUrlGenerator() {
  const [overlayUrl, setOverlayUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const url = await generateOverlayUrl();
      setOverlayUrl(url);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Overlay URL'}
      </Button>
      
      {overlayUrl && (
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-sm font-medium mb-2">OBS Browser Source URL:</p>
          <code className="text-xs break-all">{overlayUrl}</code>
          <Button 
            onClick={() => navigator.clipboard.writeText(overlayUrl)}
            className="mt-2"
            size="sm"
          >
            Copy URL
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### **Week 25: Admin Portal**

```typescript
// frontends/admin-portal/app/verification/page.tsx
import { getPendingVerifications } from '@/lib/api';
import { VerificationQueue } from '@/components/verification/VerificationQueue';

export default async function VerificationPage() {
  const pendingBrands = await getPendingVerifications('brands');
  const pendingStreamers = await getPendingVerifications('streamers');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Verification Queue</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerificationQueue 
          title="Brand Verifications"
          items={pendingBrands}
          type="brand"
        />
        <VerificationQueue 
          title="Streamer Verifications"
          items={pendingStreamers}
          type="streamer"
        />
      </div>
    </div>
  );
}

// frontends/admin-portal/components/verification/VerificationCard.tsx
'use client';

import { useState } from 'react';
import { Button } from '@gametriggers/ui';
import { verifyBrand, verifyStreamer } from '@/lib/api';

interface VerificationCardProps {
  item: PendingVerification;
  type: 'brand' | 'streamer';
  onVerified: () => void;
}

export function VerificationCard({ item, type, onVerified }: VerificationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  const handleVerify = async (decision: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      if (type === 'brand') {
        await verifyBrand(item.id, decision, notes);
      } else {
        await verifyStreamer(item.id, decision, notes);
      }
      onVerified();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-sm text-gray-600">{item.email}</p>
      </div>
      
      {/* Display relevant verification info */}
      <div className="text-sm">
        {type === 'brand' && (
          <div>
            <p><strong>Company:</strong> {item.companyName}</p>
            <p><strong>Industry:</strong> {item.industry}</p>
          </div>
        )}
        {type === 'streamer' && (
          <div>
            <p><strong>Platform:</strong> {item.platform}</p>
            <p><strong>Followers:</strong> {item.followers?.toLocaleString()}</p>
          </div>
        )}
      </div>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Verification notes..."
        className="w-full p-2 border rounded"
        rows={3}
      />
      
      <div className="flex space-x-2">
        <Button
          onClick={() => handleVerify('approve')}
          disabled={isProcessing}
          className="flex-1"
        >
          Approve
        </Button>
        <Button
          onClick={() => handleVerify('reject')}
          disabled={isProcessing}
          variant="destructive"
          className="flex-1"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
```

#### **Week 26: Landing Site & NextAuth Integration**

```typescript
// frontends/landing-site/app/page.tsx
import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { Testimonials } from '@/components/marketing/Testimonials';
import { CTA } from '@/components/marketing/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
      <CTA />
    </>
  );
}

// Shared NextAuth configuration
// packages/auth/src/auth-config.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import TwitchProvider from 'next-auth/providers/twitch';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Call Identity Service to get or create user
        const response = await fetch(`${process.env.API_GATEWAY_URL}/api/auth/oauth-callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: account.provider,
            providerId: account.providerAccountId,
            email: user.email,
            name: user.name,
            image: user.image,
          }),
        });
        
        const userData = await response.json();
        token.userId = userData.id;
        token.userType = userData.userType;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.userType = token.userType as 'brand' | 'streamer' | 'admin';
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
};
```

## 🧪 Testing Strategy

### **Unit Testing (Per Service)**
```typescript
// services/identity-service/src/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: createMockMongooseModel(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        userType: 'brand' as const,
      };

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(createUserDto.email);
      expect(result.user.password).not.toBe(createUserDto.password);
    });
  });
});
```

### **Integration Testing**
```typescript
// tests/integration/campaign-workflow.spec.ts
describe('Campaign Workflow Integration', () => {
  it('should complete full campaign creation and application flow', async () => {
    // 1. Create brand via Identity Service
    const brand = await testHelpers.createBrand();
    
    // 2. Create campaign via Campaign Service
    const campaign = await testHelpers.createCampaign(brand.id);
    
    // 3. Create streamer via Streamer Service
    const streamer = await testHelpers.createStreamer();
    
    // 4. Apply to campaign via Participation Service
    const participation = await testHelpers.applyToCampaign(streamer.id, campaign.id);
    
    // 5. Accept application
    await testHelpers.acceptApplication(campaign.id, streamer.id);
    
    // 6. Verify overlay is configured
    const overlayUrl = await testHelpers.getOverlayUrl(streamer.id);
    expect(overlayUrl).toContain(streamer.id);
  });
});
```

### **E2E Testing**
```typescript
// tests/e2e/brand-portal.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Brand Portal', () => {
  test('brand can create and manage campaigns', async ({ page }) => {
    // Login as brand
    await page.goto('/auth/signin');
    await page.click('[data-testid="google-signin"]');
    
    // Navigate to campaigns
    await page.goto('/campaigns');
    
    // Create new campaign
    await page.click('[data-testid="create-campaign"]');
    await page.fill('[name="title"]', 'Test Campaign');
    await page.fill('[name="description"]', 'Test Description');
    await page.selectOption('[name="category"]', 'gaming');
    await page.click('[data-testid="submit"]');
    
    // Verify campaign created
    await expect(page.locator('[data-testid="campaign-card"]')).toContainText('Test Campaign');
  });
});
```

## 📊 Resource Requirements & Timeline

### **Team Structure**
```yaml
Development Team (5 people):
  - Tech Lead (Full-stack): 1
  - Backend Developers (NestJS): 2  
  - Frontend Developers (Next.js): 2

DevOps & Infrastructure:
  - DevOps Engineer: 0.5 (part-time initially)
  
Design & Product:
  - UI/UX Designer: 0.5 (part-time)
  - Product Manager: 0.5 (part-time)
```

### **Infrastructure Costs (Monthly)**
```yaml
Development Environment:
  - AWS/GCP Credits: $200-500
  - MongoDB Atlas: $57 (M10 cluster)
  - Redis Cloud: $15
  - Total: ~$300/month

Production Environment (Month 6+):
  - Kubernetes Cluster: $200-400
  - Databases: $300-500
  - CDN & Storage: $100-200
  - Monitoring: $100
  - Total: ~$700-1200/month
```

### **Key Milestones**
- **Week 6**: Identity Service + API Gateway functional
- **Week 12**: All entity services (Brand, Streamer, Admin) complete
- **Week 18**: Core business logic (Campaigns, Participation) working
- **Week 22**: Supporting services (Payment, Analytics) integrated
- **Week 26**: All frontend portals deployed and functional

This implementation plan provides a comprehensive roadmap for building the new Gametriggers platform from scratch using modern microservices architecture while maintaining your preferred tech stack of Next.js, NextAuth, and NestJS.
