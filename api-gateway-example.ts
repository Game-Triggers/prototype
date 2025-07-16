// API Gateway Implementation Example for Gametriggers Microservices
// This is a reference implementation showing how the API Gateway would work

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Service endpoints configuration
const services = {
  identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
  brand: process.env.BRAND_SERVICE_URL || 'http://localhost:3002',
  streamer: process.env.STREAMER_SERVICE_URL || 'http://localhost:3003',
  campaign: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:3004',
  participation: process.env.PARTICIPATION_SERVICE_URL || 'http://localhost:3005',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007',
  asset: process.env.ASSET_SERVICE_URL || 'http://localhost:3008',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
  overlay: process.env.OVERLAY_SERVICE_URL || 'http://localhost:3010',
};

// Authentication middleware
const authenticateToken = (allowedRoles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      if (!allowedRoles.includes(user.userType)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    });
  };
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Public routes (no authentication required)
app.use('/api/auth', createProxyMiddleware({
  target: services.identity,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Service unavailable' });
  },
}));

// Brand-specific routes
app.use('/api/brands', 
  authenticateToken(['brand']), 
  createProxyMiddleware({
    target: services.brand,
    changeOrigin: true,
    pathRewrite: { '^/api/brands': '/brands' },
    onProxyReq: (proxyReq, req) => {
      // Add user context to the request
      proxyReq.setHeader('X-User-ID', req.user?.id);
      proxyReq.setHeader('X-User-Type', req.user?.userType);
    },
  })
);

// Streamer-specific routes
app.use('/api/streamers', 
  authenticateToken(['streamer']), 
  createProxyMiddleware({
    target: services.streamer,
    changeOrigin: true,
    pathRewrite: { '^/api/streamers': '/streamers' },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-User-ID', req.user?.id);
      proxyReq.setHeader('X-User-Type', req.user?.userType);
    },
  })
);

// Shared routes (accessible by both brands and streamers)
app.use('/api/campaigns', 
  authenticateToken(['brand', 'streamer']), 
  createProxyMiddleware({
    target: services.campaign,
    changeOrigin: true,
    pathRewrite: { '^/api/campaigns': '/campaigns' },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-User-ID', req.user?.id);
      proxyReq.setHeader('X-User-Type', req.user?.userType);
    },
  })
);

// Participation routes (streamers can apply, brands can approve)
app.use('/api/participations', 
  authenticateToken(['brand', 'streamer']), 
  createProxyMiddleware({
    target: services.participation,
    changeOrigin: true,
    pathRewrite: { '^/api/participations': '/participations' },
  })
);

// Analytics routes (both user types)
app.use('/api/analytics', 
  authenticateToken(['brand', 'streamer']), 
  createProxyMiddleware({
    target: services.analytics,
    changeOrigin: true,
    pathRewrite: { '^/api/analytics': '/analytics' },
  })
);

// Payment routes (both user types)
app.use('/api/payments', 
  authenticateToken(['brand', 'streamer']), 
  createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '/payments' },
  })
);

// Asset management routes
app.use('/api/assets', 
  authenticateToken(['brand', 'streamer']), 
  createProxyMiddleware({
    target: services.asset,
    changeOrigin: true,
    pathRewrite: { '^/api/assets': '/assets' },
  })
);

// Notification routes
app.use('/api/notifications', 
  authenticateToken(['brand', 'streamer']), 
  createProxyMiddleware({
    target: services.notification,
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/notifications' },
  })
);

// Overlay routes (primarily for streamers)
app.use('/api/overlay', 
  authenticateToken(['streamer']), 
  createProxyMiddleware({
    target: services.overlay,
    changeOrigin: true,
    pathRewrite: { '^/api/overlay': '/overlay' },
  })
);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Gateway error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Services configuration:`, services);
});

export default app;

// Extended type definitions for the gateway
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: 'brand' | 'streamer';
        permissions: string[];
      };
    }
  }
}

// Circuit breaker implementation example
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
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

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null && 
           (Date.now() - this.lastFailureTime) >= this.timeout;
  }
}

// Service discovery implementation example
class ServiceDiscovery {
  private services = new Map<string, string[]>();

  registerService(name: string, url: string) {
    if (!this.services.has(name)) {
      this.services.set(name, []);
    }
    this.services.get(name)!.push(url);
  }

  getServiceUrl(name: string): string {
    const instances = this.services.get(name);
    if (!instances || instances.length === 0) {
      throw new Error(`No instances available for service: ${name}`);
    }
    
    // Simple round-robin load balancing
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  removeService(name: string, url: string) {
    const instances = this.services.get(name);
    if (instances) {
      const index = instances.indexOf(url);
      if (index > -1) {
        instances.splice(index, 1);
      }
    }
  }
}

// Request/Response transformation example
const transformBrandRequest = (req: express.Request) => {
  // Add brand-specific headers or modify request
  return {
    ...req.body,
    brandId: req.user?.id,
    timestamp: new Date().toISOString(),
  };
};

const transformStreamerRequest = (req: express.Request) => {
  // Add streamer-specific headers or modify request
  return {
    ...req.body,
    streamerId: req.user?.id,
    timestamp: new Date().toISOString(),
  };
};

// Monitoring and metrics collection
class MetricsCollector {
  private requestCount = new Map<string, number>();
  private responseTime = new Map<string, number[]>();

  recordRequest(endpoint: string, responseTime: number) {
    // Count requests
    const count = this.requestCount.get(endpoint) || 0;
    this.requestCount.set(endpoint, count + 1);

    // Track response times
    if (!this.responseTime.has(endpoint)) {
      this.responseTime.set(endpoint, []);
    }
    this.responseTime.get(endpoint)!.push(responseTime);
  }

  getMetrics() {
    const metrics: any = {};
    
    for (const [endpoint, count] of this.requestCount) {
      const times = this.responseTime.get(endpoint) || [];
      const avgResponseTime = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0;

      metrics[endpoint] = {
        requestCount: count,
        averageResponseTime: avgResponseTime,
        maxResponseTime: Math.max(...times),
        minResponseTime: Math.min(...times),
      };
    }

    return metrics;
  }
}
