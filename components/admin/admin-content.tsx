'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowRight,
  Video,
  DollarSign,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { useEurekaRole, usePermissions } from '@/lib/hooks/use-eureka-roles';
import { Permission } from '@/lib/eureka-roles';
import { apiClient } from '@/lib/api-client';

// Components for Admin Dashboard
import { PlatformStats } from './platform-stats';
import { QuickActions } from './quick-actions';
import { RecentActivity } from './recent-activity'

export interface PlatformStatsData {
  totalUsers: number;
  totalStreamers: number;
  totalBrands: number;
  activeCampaigns: number;
  totalCampaigns: number;
  platformGrowth: number;
  totalImpressions: number;
  totalClicks: number;
  revenueLastMonth: number;
}

export interface RecentActivityData {
  id: string;
  type: 'user_signup' | 'campaign_created' | 'campaign_joined';
  message: string;
  timestamp: string;
  entityId: string;
  entityName: string;
}

export default function AdminContent() {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStatsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch platform overview
        const overviewResponse = await apiClient.get('/api/v1/analytics/overview');
        
        // Format the stats
        setStats({
          totalUsers: overviewResponse.data.platformTotals.totalStreamers + overviewResponse.data.platformTotals.totalBrands,
          totalStreamers: overviewResponse.data.platformTotals.totalStreamers,
          totalBrands: overviewResponse.data.platformTotals.totalBrands,
          activeCampaigns: overviewResponse.data.platformTotals.activeCampaigns,
          totalCampaigns: overviewResponse.data.platformTotals.totalCampaigns,
          platformGrowth: overviewResponse.data.summary?.platform30DayGrowth || 0,
          totalImpressions: overviewResponse.data.platformTotals.impressions,
          totalClicks: overviewResponse.data.platformTotals.clicks,
          revenueLastMonth: overviewResponse.data.platformTotals.totalEarnings || 0,
        });

        // In a real application, we would fetch recent activities
        // For now, let's use placeholder data
        setRecentActivity([
          {
            id: '1',
            type: 'user_signup',
            message: 'New streamer signed up',
            timestamp: new Date().toISOString(),
            entityId: 'user123',
            entityName: 'StreamerUser1',
          },
          {
            id: '2',
            type: 'campaign_created',
            message: 'New campaign created',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            entityId: 'campaign456',
            entityName: 'Summer Promotion',
          },
          {
            id: '3',
            type: 'campaign_joined',
            message: 'Streamer joined campaign',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            entityId: 'user789',
            entityName: 'TopStreamer',
          },
        ]);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is logged in and has admin role
    if (session?.user) {
      if (hasPermission(Permission.VIEW_DETAILED_ANALYTICS)) {
        fetchAdminData();
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    }
  }, [session, router, hasPermission]);

  if (!session) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please sign in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission(Permission.VIEW_DETAILED_ANALYTICS)) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform, users, and campaigns</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <PlatformStats stats={stats} />
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Recent Activity */}
          <RecentActivity activities={recentActivity} />
        </>
      )}
    </div>
  );
}
