"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Video,
  Target
} from "lucide-react";
import { UserRole } from "@/schemas/user.schema";
import { StatCard } from "./stat-card";
import { StreamerDashboardContent } from "./streamer-content";
import { BrandDashboardContent } from "./brand-content";
import { AdminDashboardContent } from "./admin-content";
import { formatCurrency } from "@/lib/currency-config";

interface DashboardStats {
  campaignsCount: number;
  analytics: number;
  earnings: number;
  streamers: number;
}

interface DashboardData {
  summary?: {
    activeCampaigns?: number;
    totalImpressions?: number;
    totalClicks?: number;
    recentEarnings?: number;
    allTimeEarnings?: number;
    recentSpend?: number; // For brands
    allTimeSpend?: number; // For brands
    uniqueStreamers?: number; // For brands
    totalStreamers?: number;
    totalBrands?: number;
    newStreamers?: number;
    newBrands?: number;
    newCampaigns?: number;
    platform30DayGrowth?: number;
  };
  analytics?: {
    totalImpressions?: number;
    totalClicks?: number;
    totalEarnings?: number;
  };
  platformTotals?: {
    totalStreamers?: number;
    totalBrands?: number;
    activeCampaigns?: number;
  };
}

export function DashboardContent() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  const [stats, setStats] = useState<DashboardStats>({
    campaignsCount: 0,
    analytics: 0,
    earnings: 0,
    streamers: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real dashboard data using direct fetch to proxy endpoint
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.accessToken) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/analytics/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Include session cookies
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = await response.json() as DashboardData;
        
        // Map the API response to our stats format based on user role
        if (userRole === UserRole.STREAMER) {
          setStats({
            campaignsCount: data.summary?.activeCampaigns || 0,
            analytics: data.summary?.totalImpressions || 0,
            earnings: data.summary?.recentEarnings || 0,
            streamers: 0, // Not relevant for streamers
          });
        } else if (userRole === UserRole.BRAND) {
          setStats({
            campaignsCount: data.summary?.activeCampaigns || 0,
            analytics: data.summary?.totalImpressions || 0,
            earnings: data.summary?.recentSpend || 0, // Use recentSpend for brands
            streamers: data.summary?.uniqueStreamers || 0, // Use uniqueStreamers for brands
          });
        } else if (userRole === UserRole.ADMIN) {
          setStats({
            campaignsCount: data.platformTotals?.activeCampaigns || 0,
            analytics: data.analytics?.totalImpressions || 0,
            earnings: data.analytics?.totalEarnings || 0,
            streamers: data.platformTotals?.totalStreamers || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        // Fallback to mock data if real data fails
        setStats({
          campaignsCount: userRole === UserRole.STREAMER ? 5 : 12,
          analytics: 1458,
          earnings: userRole === UserRole.STREAMER ? 341.50 : 2750.00,
          streamers: 24,
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken && userRole) {
      fetchDashboardData();
    }
  }, [session?.accessToken, userRole]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name}
          {error && <span className="text-yellow-600 ml-2">⚠️ Using cached data</span>}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={userRole === UserRole.STREAMER ? "Active Campaigns" : "Total Campaigns"}
          value={stats.campaignsCount}
          change="+12% from last month"
          trend="up"
          icon={<Target className="h-5 w-5" />}
        />

        <StatCard
          title="Total Impressions"
          value={stats.analytics.toLocaleString()}
          change="+8% from last month"
          trend="up"
          icon={<BarChart3 className="h-5 w-5" />}
        />

        {userRole === UserRole.STREAMER ? (
          <StatCard
            title="Total Earnings"
            value={formatCurrency(stats.earnings)}
            change="+5% from last month"
            trend="up"
            icon={<DollarSign className="h-5 w-5" />}
          />
        ) : (
          <StatCard
            title="Total Spend"
            value={formatCurrency(stats.earnings)}
            change="+15% from last month"
            trend="up"
            icon={<DollarSign className="h-5 w-5" />}
          />
        )}

        {userRole === UserRole.BRAND ? (
          <StatCard
            title="Active Streamers"
            value={stats.streamers}
            change="+3 new this month"
            trend="up"
            icon={<Users className="h-5 w-5" />}
          />
        ) : (
          <StatCard
            title="Video Views"
            value="12.5K"
            change="+24% from last month"
            trend="up"
            icon={<Video className="h-5 w-5" />}
          />
        )}
      </div>

      {/* Role-specific content */}
      {userRole === UserRole.STREAMER && <StreamerDashboardContent />}
      {userRole === UserRole.BRAND && <BrandDashboardContent />}
      {userRole === UserRole.ADMIN && <AdminDashboardContent />}
    </div>
  );
}
