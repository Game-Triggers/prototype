import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EarningsData {
  allTimeEarnings: number;
  currentMonthEarnings: number;
  earningsByCampaign: Array<{
    campaignId: string;
    campaignTitle: string;
    earnings: number;
    impressions: number;
    clicks: number;
  }>;
  dailyEarnings: Array<{
    date: string;
    earnings: number;
    impressions: number;
    clicks: number;
  }>;
}

interface EarningsOverviewProps {
  data: EarningsData;
  isLoading?: boolean;
}

import { formatCurrency as formatPlatformCurrency } from '../../lib/currency-config';

const formatCurrency = (value: number): string => {
  return formatPlatformCurrency(value);
};

export function EarningsOverview({ data, isLoading = false }: EarningsOverviewProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>Loading your earnings data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse">Loading earnings data...</div>
        </CardContent>
      </Card>
    );
  }

  // Format dates for chart display
  const chartData = data.dailyEarnings.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <CardDescription>All-time earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.allTimeEarnings)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Month</CardTitle>
          <CardDescription>Earnings this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.currentMonthEarnings)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          <CardDescription>Number of earning campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.earningsByCampaign.length}</div>
        </CardContent>
      </Card>

      {/* Earnings Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Daily Earnings (Last 30 Days)</CardTitle>
          <CardDescription>Track your earnings performance</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                domain={[0, 'dataMax + 5']} 
              />
              <Tooltip 
                formatter={(value) => [`${formatCurrency(value as number)}`, 'Earnings']} 
                labelFormatter={(label) => `Date: ${label}`} 
              />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                name="Earnings"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Campaigns */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Top Earning Campaigns</CardTitle>
          <CardDescription>Campaigns that generate the most revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.earningsByCampaign.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left font-medium p-2">Campaign</th>
                      <th className="text-right font-medium p-2">Impressions</th>
                      <th className="text-right font-medium p-2">Clicks</th>
                      <th className="text-right font-medium p-2">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.earningsByCampaign.slice(0, 5).map((campaign) => (
                      <tr key={campaign.campaignId} className="border-t">
                        <td className="p-2">{campaign.campaignTitle}</td>
                        <td className="text-right p-2">{campaign.impressions.toLocaleString()}</td>
                        <td className="text-right p-2">{campaign.clicks.toLocaleString()}</td>
                        <td className="text-right p-2">{formatCurrency(campaign.earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No campaign data available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}