'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency-config';
import type { PlatformStatsData } from './admin-content';

interface PlatformStatsProps {
  stats: PlatformStatsData | null;
}

export function PlatformStats({ stats }: PlatformStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalStreamers} Streamers, {stats?.totalBrands} Brands
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active / {stats?.totalCampaigns || 0} Total
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Impressions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalImpressions.toLocaleString() || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalClicks.toLocaleString() || 0} Clicks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.revenueLastMonth || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
