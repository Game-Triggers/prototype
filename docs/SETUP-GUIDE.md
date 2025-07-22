# Gametriggers Platform Setup Guide

This guide provides step-by-step instructions for setting up each component of the Gametriggers platform from scratch. The platform consists of four main components that can be developed independently or as part of an integrated ecosystem.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [E1 Brand Portal Setup](#e1-brand-portal-setup)
4. [E2 Ad Exchange Portal Setup](#e2-ad-exchange-portal-setup)
5. [E3 Publisher Portal Setup](#e3-publisher-portal-setup)
6. [Landing Site Setup](#landing-site-setup)
7. [Microservices Setup](#microservices-setup)
8. [Database Configuration](#database-configuration)
9. [Integration & Testing](#integration--testing)
10. [Deployment Guide](#deployment-guide)

## Prerequisites

### System Requirements
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker**: v20.10 or higher
- **Docker Compose**: v2.x or higher
- **MongoDB**: v7.x or higher
- **PostgreSQL**: v15.x or higher
- **Redis**: v7.x or higher

### Development Tools
- **Code Editor**: VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - MongoDB for VS Code
- **API Testing**: Postman or Insomnia
- **Git**: Latest version
- **Terminal**: Modern shell (zsh/bash)

### External Services
- **Twitch Developer Account** (for publisher integration)
- **YouTube API Key** (for publisher integration)
- **Stripe Account** (for payments)
- **PayPal Developer Account** (for payouts)
- **SendGrid** or **AWS SES** (for emails)
- **Cloudinary** or **AWS S3** (for file uploads)

## Development Environment Setup

### 1. Clone the Repository Template

```bash
# Create a new project directory
mkdir gametriggers-platform
cd gametriggers-platform

# Initialize git repository
git init
git remote add origin <your-repository-url>

# Create the basic folder structure
mkdir -p {apps,packages,docs,scripts}
mkdir -p apps/{brand-portal,exchange-portal,publisher-portal,landing-site}
mkdir -p packages/{shared,ui,database,auth}
```

### 2. Setup Monorepo Structure (Optional)

If you want to manage all projects in a monorepo:

```bash
# Initialize package.json for the monorepo
npm init -y

# Install monorepo tools
npm install -D lerna nx turbo

# Create turbo.json for build orchestration
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^test"]
    }
  }
}
EOF
```

### 3. Docker Environment Setup

Create a development Docker environment:

```bash
# Create docker-compose.dev.yml
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db

  postgresql:
    image: postgres:15
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: gametriggers
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    volumes:
      - postgresql_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog:latest
    restart: always
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  mongodb_data:
  postgresql_data:
  redis_data:
EOF

# Start the development services
docker-compose -f docker-compose.dev.yml up -d
```

## E1 Brand Portal Setup

### 1. Initialize Next.js Project

```bash
cd apps/brand-portal

# Create Next.js app with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install additional dependencies
npm install @auth/mongodb-adapter next-auth@beta zod react-hook-form @hookform/resolvers
npm install zustand @radix-ui/react-slot @radix-ui/react-dialog class-variance-authority clsx tailwind-merge
npm install lucide-react recharts date-fns framer-motion
npm install axios @tanstack/react-query mongoose

# Install development dependencies
npm install -D @types/node prettier prettier-plugin-tailwindcss
```

### 2. Configure Environment Variables

```bash
# Create .env.local
cat > .env.local << 'EOF'
# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/gametriggers?authSource=admin
REDIS_URL=redis://localhost:6379

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
SENDGRID_API_KEY=your_sendgrid_api_key
CLOUDINARY_URL=cloudinary://your_cloudinary_url

# API Gateway
API_GATEWAY_URL=http://localhost:4000/api/v1
EOF
```

### 3. Setup Authentication

```bash
# Create authentication configuration
mkdir -p lib
cat > lib/auth.ts << 'EOF'
import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import CredentialsProvider from "next-auth/providers/credentials"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement authentication logic
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.organizationId = token.organizationId
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
})
EOF
```

### 4. Create Basic Page Structure

```bash
# Create app directory structure
mkdir -p app/{dashboard,campaigns,analytics,settings,auth}

# Create dashboard page
cat > app/dashboard/page.tsx << 'EOF'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Brand Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Active Campaigns</h2>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Total Spend</h2>
          <p className="text-3xl font-bold text-green-600">$4,250</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Performance</h2>
          <p className="text-3xl font-bold text-purple-600">94%</p>
        </div>
      </div>
    </div>
  )
}
EOF
```

### 5. Setup Tailwind Configuration

```bash
# Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
EOF
```

### 6. Development Scripts

```bash
# Update package.json scripts
cat > package.json << 'EOF'
{
  "name": "brand-portal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
EOF
```

## E2 Ad Exchange Portal Setup

### 1. Initialize Next.js Project

```bash
cd ../exchange-portal

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install specific dependencies for exchange portal
npm install next-auth@beta zod react-hook-form @hookform/resolvers
npm install zustand d3 observable-plot socket.io-client
npm install axios @tanstack/react-query mongoose influxdb-client
npm install @radix-ui/react-slot @radix-ui/react-dialog lucide-react
```

### 2. Configure Environment Variables

```bash
cat > .env.local << 'EOF'
# Application
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-nextauth-secret-key
NODE_ENV=development

# Databases
MONGODB_URI=mongodb://admin:password123@localhost:27017/gametriggers?authSource=admin
POSTGRESQL_URL=postgresql://admin:password123@localhost:5432/gametriggers
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-influxdb-token
REDIS_URL=redis://localhost:6379

# Internal APIs
BRAND_PORTAL_API=http://localhost:3001/api
PUBLISHER_PORTAL_API=http://localhost:3003/api
EXCHANGE_API_SECRET=your-internal-api-secret

# Message Queue
RABBITMQ_URL=amqp://localhost:5672
EOF
```

### 3. Create Exchange-Specific Components

```bash
# Create system monitoring dashboard
mkdir -p components/monitoring
cat > components/monitoring/system-health.tsx << 'EOF'
"use client"

import { useEffect, useState } from "react"

interface ServiceHealth {
  name: string
  status: "up" | "down" | "degraded"
  responseTime: number
  lastCheck: Date
}

export default function SystemHealth() {
  const [services, setServices] = useState<ServiceHealth[]>([])

  useEffect(() => {
    // Implement real-time health monitoring
    const fetchHealthData = async () => {
      try {
        const response = await fetch("/api/monitoring/health")
        const data = await response.json()
        setServices(data.services)
      } catch (error) {
        console.error("Failed to fetch health data:", error)
      }
    }

    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">System Health</h2>
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <span className="font-medium">{service.name}</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-sm ${
                service.status === "up" ? "bg-green-100 text-green-800" :
                service.status === "degraded" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {service.status}
              </span>
              <span className="text-sm text-gray-500">{service.responseTime}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
EOF
```

### 4. Create Exchange Dashboard

```bash
cat > app/dashboard/page.tsx << 'EOF'
import SystemHealth from "@/components/monitoring/system-health"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ExchangeDashboard() {
  const session = await auth()
  
  if (!session || !["admin", "platform_success", "customer_success"].includes(session.user.role)) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Exchange Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealth />
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Campaign Routing</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Success Rate</span>
              <span className="font-semibold">99.2%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Match Time</span>
              <span className="font-semibold">45ms</span>
            </div>
            <div className="flex justify-between">
              <span>Active Campaigns</span>
              <span className="font-semibold">1,247</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
EOF
```

## E3 Publisher Portal Setup

### 1. Initialize Next.js Project

```bash
cd ../publisher-portal

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install publisher-specific dependencies
npm install next-auth@beta zod react-hook-form @hookform/resolvers
npm install zustand axios @tanstack/react-query mongoose
npm install socket.io-client react-player react-dropzone
npm install @radix-ui/react-slot @radix-ui/react-dialog lucide-react recharts
```

### 2. Configure Environment Variables

```bash
cat > .env.local << 'EOF'
# Application
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your-nextauth-secret-key

# Databases
MONGODB_URI=mongodb://admin:password123@localhost:27017/gametriggers?authSource=admin
REDIS_URL=redis://localhost:6379

# Platform Integrations
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Payment Processing
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# File Storage
CLOUDINARY_URL=cloudinary://your_cloudinary_url
AWS_S3_BUCKET=your_s3_bucket
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# External APIs
EXCHANGE_API_URL=http://localhost:3002/api
API_SECRET_KEY=your_api_secret_key
EOF
```

### 3. Create Publisher Registration Flow

```bash
# Create registration components
mkdir -p components/onboarding
cat > components/onboarding/platform-connection.tsx << 'EOF'
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface PlatformConnectionProps {
  onConnect: (platform: string, data: any) => void
}

export default function PlatformConnection({ onConnect }: PlatformConnectionProps) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const connectTwitch = async () => {
    setConnecting("twitch")
    try {
      // Implement Twitch OAuth flow
      const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/twitch/callback")}&response_type=code&scope=user:read:email+channel:read:subscriptions`
      window.location.href = authUrl
    } catch (error) {
      console.error("Failed to connect Twitch:", error)
    } finally {
      setConnecting(null)
    }
  }

  const connectYouTube = async () => {
    setConnecting("youtube")
    try {
      // Implement YouTube OAuth flow
      const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/youtube/callback")}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code`
      window.location.href = authUrl
    } catch (error) {
      console.error("Failed to connect YouTube:", error)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Connect Your Platforms</h2>
      <p className="text-gray-600">Connect your streaming platforms to get started</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={connectTwitch}
          disabled={connecting === "twitch"}
          className="h-16 bg-purple-600 hover:bg-purple-700"
        >
          {connecting === "twitch" ? "Connecting..." : "Connect Twitch"}
        </Button>
        
        <Button 
          onClick={connectYouTube}
          disabled={connecting === "youtube"}
          className="h-16 bg-red-600 hover:bg-red-700"
        >
          {connecting === "youtube" ? "Connecting..." : "Connect YouTube"}
        </Button>
      </div>
    </div>
  )
}
EOF
```

### 4. Create Overlay Management System

```bash
mkdir -p components/overlay
cat > components/overlay/overlay-designer.tsx << 'EOF'
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface OverlayConfig {
  position: { x: number; y: number; width: number; height: number }
  styling: { theme: string; colors: any; animations: string[] }
  behavior: { displayDuration: number; frequency: number }
}

export default function OverlayDesigner() {
  const [config, setConfig] = useState<OverlayConfig>({
    position: { x: 10, y: 10, width: 300, height: 100 },
    styling: { theme: "modern", colors: { primary: "#3b82f6" }, animations: ["fadeIn"] },
    behavior: { displayDuration: 5000, frequency: 300000 }
  })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const updatePosition = (position: Partial<OverlayConfig["position"]>) => {
    setConfig(prev => ({
      ...prev,
      position: { ...prev.position, ...position }
    }))
  }

  const previewOverlay = () => {
    // Implement real-time preview
    console.log("Preview overlay with config:", config)
  }

  const saveOverlay = async () => {
    try {
      const response = await fetch("/api/overlays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        console.log("Overlay saved successfully")
      }
    } catch (error) {
      console.error("Failed to save overlay:", error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Overlay Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="X" 
                value={config.position.x}
                onChange={(e) => updatePosition({ x: parseInt(e.target.value) })}
                className="border rounded px-3 py-2"
              />
              <input 
                type="number" 
                placeholder="Y" 
                value={config.position.y}
                onChange={(e) => updatePosition({ y: parseInt(e.target.value) })}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Width" 
                value={config.position.width}
                onChange={(e) => updatePosition({ width: parseInt(e.target.value) })}
                className="border rounded px-3 py-2"
              />
              <input 
                type="number" 
                placeholder="Height" 
                value={config.position.height}
                onChange={(e) => updatePosition({ height: parseInt(e.target.value) })}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={previewOverlay} variant="outline">
              Preview
            </Button>
            <Button onClick={saveOverlay}>
              Save Overlay
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
            width={800}
            height={450}
          />
          {/* Overlay preview will be rendered here */}
          <div 
            className="absolute bg-blue-600 text-white p-2 rounded"
            style={{
              left: `${config.position.x}px`,
              top: `${config.position.y}px`,
              width: `${config.position.width}px`,
              height: `${config.position.height}px`
            }}
          >
            Sample Ad Content
          </div>
        </div>
      </div>
    </div>
  )
}
EOF
```

## Landing Site Setup

### 1. Initialize Next.js Project

```bash
cd ../landing-site

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install marketing-specific dependencies
npm install framer-motion lucide-react @radix-ui/react-slot
npm install next-auth@beta axios zod react-hook-form @hookform/resolvers
npm install @next/mdx @mdx-js/loader @mdx-js/react
npm install sharp # for image optimization
```

### 2. Configure Environment Variables

```bash
cat > .env.local << 'EOF'
# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# External Services
SENDGRID_API_KEY=your_sendgrid_api_key
GOOGLE_ANALYTICS_ID=your_ga_id
HOTJAR_ID=your_hotjar_id

# Portal URLs
NEXT_PUBLIC_BRAND_PORTAL_URL=http://localhost:3001
NEXT_PUBLIC_EXCHANGE_PORTAL_URL=http://localhost:3002
NEXT_PUBLIC_PUBLISHER_PORTAL_URL=http://localhost:3003

# API
API_GATEWAY_URL=http://localhost:4000/api/v1
EOF
```

### 3. Create Landing Page Components

```bash
mkdir -p components/landing
cat > components/landing/hero-section.tsx << 'EOF'
"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              The Future of 
              <span className="text-blue-600"> In-Stream</span> Advertising
            </h1>
            
            <p className="text-xl text-gray-600 mt-6 leading-relaxed">
              Connect brands with streamers through intelligent, non-intrusive advertising
              that maximizes engagement while respecting the viewing experience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/register?role=brand">
                  Start as a Brand
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/register?role=publisher">
                  Join as Creator
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-8 mt-8">
              <div>
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">Active Streamers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">$1M+</div>
                <div className="text-sm text-gray-600">Payouts Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">99.5%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Demo interface mockup */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-16 bg-blue-100 rounded border-2 border-blue-300 border-dashed flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">Live Ad Overlay</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
EOF
```

### 4. Create Registration Flow

```bash
mkdir -p app/register
cat > app/register/page.tsx << 'EOF'
"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(["brand", "publisher", "agency"]),
  company: z.string().optional(),
  platform: z.string().optional(),
})

type RegistrationData = z.infer<typeof registrationSchema>

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") as "brand" | "publisher" | "agency" || "brand"
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { role: defaultRole }
  })

  const role = watch("role")

  const onSubmit = async (data: RegistrationData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        // Redirect to appropriate portal
        const portalUrls = {
          brand: process.env.NEXT_PUBLIC_BRAND_PORTAL_URL,
          publisher: process.env.NEXT_PUBLIC_PUBLISHER_PORTAL_URL,
          agency: process.env.NEXT_PUBLIC_PUBLISHER_PORTAL_URL
        }
        window.location.href = `${portalUrls[role]}/onboarding?token=${result.temporaryToken}`
      }
    } catch (error) {
      console.error("Registration failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Join Gametriggers
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your role and get started
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to join as a:
            </label>
            <select 
              {...register("role")}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="brand">Brand/Advertiser</option>
              <option value="publisher">Content Creator/Streamer</option>
              <option value="agency">Agency/Management</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                {...register("firstName")}
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                {...register("lastName")}
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {(role === "brand" || role === "agency") && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                {...register("company")}
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Get Started"}
          </Button>
        </form>
      </div>
    </div>
  )
}
EOF
```

## Microservices Setup

### 1. Create Shared Services Structure

```bash
# Create microservices directory
mkdir -p microservices/{auth,brand,publisher,campaign,analytics,payment,upload,workflow}

# Create shared package
mkdir -p packages/shared/src/{types,utils,middleware}
```

### 2. Setup Auth Service

```bash
cd microservices/auth

# Initialize NestJS project
npx @nestjs/cli new . --package-manager npm
cd ../..

# Install additional dependencies for auth service
cd microservices/auth
npm install @nestjs/mongoose @nestjs/passport @nestjs/jwt passport passport-jwt
npm install bcrypt mongoose class-validator class-transformer
npm install -D @types/bcrypt @types/passport-jwt

# Create auth module structure
npx nest generate module auth
npx nest generate controller auth
npx nest generate service auth
npx nest generate module users
npx nest generate service users
```

### 3. Configure Auth Service

```bash
# Create auth service configuration
cat > src/auth/auth.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id, 
      role: user.role,
      organizationId: user.organizationId 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });
    return this.login(user);
  }
}
EOF
```

### 4. Setup API Gateway

```bash
mkdir -p api-gateway
cd api-gateway

# Initialize NestJS gateway
npx @nestjs/cli new . --package-manager npm

# Install gateway-specific dependencies
npm install @nestjs/microservices @nestjs/config
npm install express-rate-limit helmet cors

# Create gateway configuration
cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security
  app.use(helmet());
  app.enableCors();
  
  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }));
  
  // Validation
  app.useGlobalPipes(new ValidationPipe());
  
  // Start server
  await app.listen(4000);
  console.log('API Gateway running on http://localhost:4000');
}
bootstrap();
EOF
```

## Database Configuration

### 1. MongoDB Setup

```bash
# Create database initialization script
mkdir -p scripts/database
cat > scripts/database/init-mongodb.js << 'EOF'
// MongoDB initialization script
db = db.getSiblingDB('gametriggers');

// Create collections
db.createCollection('users');
db.createCollection('organizations');
db.createCollection('campaigns');
db.createCollection('publishers');
db.createCollection('campaign_participations');
db.createCollection('overlays');
db.createCollection('analytics');
db.createCollection('payments');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, organizationId: 1 });
db.campaigns.createIndex({ organizationId: 1, status: 1 });
db.publishers.createIndex({ 'platforms.channelId': 1 });
db.campaign_participations.createIndex({ campaignId: 1, publisherId: 1 });
db.analytics.createIndex({ campaignId: 1, date: 1 });

print('MongoDB initialization completed');
EOF

# Run initialization
docker exec -i gametriggers-mongodb-1 mongo < scripts/database/init-mongodb.js
```

### 2. PostgreSQL Setup

```bash
# Create PostgreSQL schema
cat > scripts/database/init-postgresql.sql << 'EOF'
-- Create database
CREATE DATABASE gametriggers;

-- Connect to the database
\c gametriggers;

-- Create analytics tables
CREATE TABLE campaign_analytics (
    id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publisher_performance (
    id SERIAL PRIMARY KEY,
    publisher_id VARCHAR(255) NOT NULL,
    campaign_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    earnings DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'payout', 'fee'
    amount DECIMAL(12,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date);
CREATE INDEX idx_publisher_performance_publisher_date ON publisher_performance(publisher_id, date);
CREATE INDEX idx_financial_transactions_user_type ON financial_transactions(user_id, type);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
EOF

# Run PostgreSQL initialization
docker exec -i gametriggers-postgresql-1 psql -U admin -d postgres < scripts/database/init-postgresql.sql
```

## Integration & Testing

### 1. Create Integration Test Suite

```bash
# Create test directory structure
mkdir -p tests/{e2e,integration,unit}

# Create integration test for authentication flow
cat > tests/integration/auth-flow.test.ts << 'EOF'
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../api-gateway/src/app.module';

describe('Authentication Flow (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should register a new brand user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@brand.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'brand',
        company: 'Test Company'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(res.body.user.role).toBe('brand');
      });
  });

  it('should register a new publisher user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@streamer.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Streamer',
        role: 'publisher',
        platform: 'twitch'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(res.body.user.role).toBe('publisher');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
EOF
```

### 2. Create End-to-End Test

```bash
# Install testing dependencies
npm install -D cypress @testing-library/cypress playwright

# Create Cypress test
mkdir -p cypress/{integration,fixtures,support}
cat > cypress/integration/user-journey.spec.ts << 'EOF'
describe('Complete User Journey', () => {
  it('should complete brand onboarding flow', () => {
    // Visit landing page
    cy.visit('http://localhost:3000');
    
    // Navigate to registration
    cy.contains('Start as a Brand').click();
    
    // Fill registration form
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('john@testbrand.com');
    cy.get('input[name="company"]').type('Test Brand Inc.');
    cy.get('select[name="role"]').select('brand');
    
    // Submit registration
    cy.get('button[type="submit"]').click();
    
    // Should redirect to brand portal
    cy.url().should('include', ':3001');
    cy.contains('Brand Dashboard').should('be.visible');
  });

  it('should complete publisher onboarding flow', () => {
    // Similar flow for publisher registration
    cy.visit('http://localhost:3000');
    cy.contains('Join as Creator').click();
    
    // Fill publisher registration
    cy.get('input[name="firstName"]').type('Jane');
    cy.get('input[name="lastName"]').type('Stream');
    cy.get('input[name="email"]').type('jane@teststreamer.com');
    cy.get('select[name="role"]').select('publisher');
    
    cy.get('button[type="submit"]').click();
    
    // Should redirect to publisher portal
    cy.url().should('include', ':3003');
    cy.contains('Connect Your Platforms').should('be.visible');
  });
});
EOF
```

## Deployment Guide

### 1. Docker Configuration for Production

```bash
# Create production docker-compose
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Frontend Applications
  landing-site:
    build:
      context: ./apps/landing-site
      dockerfile: Dockerfile.prod
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api-gateway

  brand-portal:
    build:
      context: ./apps/brand-portal
      dockerfile: Dockerfile.prod
    ports:
      - "81:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api-gateway

  publisher-portal:
    build:
      context: ./apps/publisher-portal
      dockerfile: Dockerfile.prod
    ports:
      - "82:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api-gateway

  exchange-portal:
    build:
      context: ./apps/exchange-portal
      dockerfile: Dockerfile.prod
    ports:
      - "83:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api-gateway

  # Backend Services
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - postgresql
      - redis

  auth-service:
    build:
      context: ./microservices/auth
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis

  # Databases
  mongodb:
    image: mongo:7.0
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}

  postgresql:
    image: postgres:15
    volumes:
      - postgresql_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: gametriggers
      POSTGRES_USER: ${POSTGRES_USERNAME}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  postgresql_data:
  redis_data:
EOF
```

### 2. Kubernetes Configuration

```bash
# Create Kubernetes manifests
mkdir -p k8s/{apps,services,databases}

# Create deployment for brand portal
cat > k8s/apps/brand-portal-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brand-portal
  labels:
    app: brand-portal
spec:
  replicas: 3
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
        image: gametriggers/brand-portal:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: brand-portal-service
spec:
  selector:
    app: brand-portal
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
EOF
```

### 3. CI/CD Pipeline

```bash
# Create GitHub Actions workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy Gametriggers Platform

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: |
        npm install
        npm run install:all
        
    - name: Run tests
      run: |
        npm run test:unit
        npm run test:integration
        
    - name: Run E2E tests
      run: |
        npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [landing-site, brand-portal, publisher-portal, exchange-portal]
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -t gametriggers/${{ matrix.app }}:${{ github.sha }} ./apps/${{ matrix.app }}
        
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push gametriggers/${{ matrix.app }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Kubernetes
      run: |
        # Configure kubectl
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        
        # Update deployments
        kubectl set image deployment/landing-site landing-site=gametriggers/landing-site:${{ github.sha }}
        kubectl set image deployment/brand-portal brand-portal=gametriggers/brand-portal:${{ github.sha }}
        kubectl set image deployment/publisher-portal publisher-portal=gametriggers/publisher-portal:${{ github.sha }}
        kubectl set image deployment/exchange-portal exchange-portal=gametriggers/exchange-portal:${{ github.sha }}
EOF
```

### 4. Environment Configuration

```bash
# Create environment configuration script
cat > scripts/setup-env.sh << 'EOF'
#!/bin/bash

# Setup script for Gametriggers Platform
echo "Setting up Gametriggers Platform..."

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "Node.js is not installed. Please install Node.js 20.x or higher."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    echo "Prerequisites check passed!"
}

# Setup databases
setup_databases() {
    echo "Setting up databases..."
    docker-compose -f docker-compose.dev.yml up -d mongodb postgresql redis
    
    # Wait for databases to be ready
    sleep 10
    
    # Initialize MongoDB
    docker exec -i $(docker-compose -f docker-compose.dev.yml ps -q mongodb) mongo < scripts/database/init-mongodb.js
    
    # Initialize PostgreSQL
    docker exec -i $(docker-compose -f docker-compose.dev.yml ps -q postgresql) psql -U admin -d postgres < scripts/database/init-postgresql.sql
    
    echo "Databases initialized!"
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies for all applications..."
    
    cd apps/landing-site && npm install && cd ../..
    cd apps/brand-portal && npm install && cd ../..
    cd apps/publisher-portal && npm install && cd ../..
    cd apps/exchange-portal && npm install && cd ../..
    cd api-gateway && npm install && cd ..
    cd microservices/auth && npm install && cd ../..
    
    echo "Dependencies installed!"
}

# Setup environment files
setup_env_files() {
    echo "Setting up environment files..."
    
    # Copy example env files
    cp apps/landing-site/.env.example apps/landing-site/.env.local
    cp apps/brand-portal/.env.example apps/brand-portal/.env.local
    cp apps/publisher-portal/.env.example apps/publisher-portal/.env.local
    cp apps/exchange-portal/.env.example apps/exchange-portal/.env.local
    
    echo "Environment files created. Please update them with your actual values."
}

# Run setup
check_prerequisites
setup_databases
install_dependencies
setup_env_files

echo "Setup completed! You can now start the development servers:"
echo "  npm run dev:landing    # Start landing site (port 3000)"
echo "  npm run dev:brands     # Start brand portal (port 3001)"
echo "  npm run dev:exchange   # Start exchange portal (port 3002)"
echo "  npm run dev:publishers # Start publisher portal (port 3003)"
EOF

chmod +x scripts/setup-env.sh
```

## Quick Start Commands

### 1. Development Commands

```bash
# Add these to your root package.json
cat > package.json << 'EOF'
{
  "name": "gametriggers-platform",
  "version": "1.0.0",
  "scripts": {
    "setup": "./scripts/setup-env.sh",
    "dev": "turbo run dev",
    "dev:landing": "cd apps/landing-site && npm run dev",
    "dev:brands": "cd apps/brand-portal && npm run dev",
    "dev:publishers": "cd apps/publisher-portal && npm run dev",
    "dev:exchange": "cd apps/exchange-portal && npm run dev",
    "dev:gateway": "cd api-gateway && npm run dev",
    "dev:auth": "cd microservices/auth && npm run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "cypress run",
    "lint": "turbo run lint",
    "db:start": "docker-compose -f docker-compose.dev.yml up -d",
    "db:stop": "docker-compose -f docker-compose.dev.yml down",
    "db:reset": "docker-compose -f docker-compose.dev.yml down -v && npm run db:start"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "cypress": "^12.0.0"
  }
}
EOF
```

### 2. Getting Started

```bash
# 1. Clone and setup
git clone <your-repo>
cd gametriggers-platform
npm run setup

# 2. Start databases
npm run db:start

# 3. Start all applications in development mode
npm run dev

# Or start individual applications
npm run dev:landing    # http://localhost:3000
npm run dev:brands     # http://localhost:3001
npm run dev:exchange   # http://localhost:3002
npm run dev:publishers # http://localhost:3003
```

## Conclusion

This setup guide provides a complete foundation for building each component of the Gametriggers platform. Each portal can be developed independently while maintaining consistency through shared packages and standardized patterns.

### Key Points:
1. **Modular Architecture**: Each portal is independent but can share common components
2. **Development Environment**: Docker-based development with hot reloading
3. **Testing Strategy**: Unit, integration, and E2E testing across all components
4. **Deployment Ready**: Docker and Kubernetes configurations for production
5. **CI/CD Pipeline**: Automated testing and deployment

### Next Steps:
1. Follow the setup instructions for each portal you want to develop
2. Customize the components and features based on your specific requirements
3. Set up external service integrations (Twitch, Stripe, etc.)
4. Configure production environment variables
5. Deploy to your preferred cloud provider

---

**Document Version**: 1.0  
**Last Updated**: July 22, 2025  
**Maintained By**: Engineering Team
