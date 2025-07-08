'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { formatCurrency } from '@/lib/currency-config';

const fetchAnalytics = async (query = {}) => {
  // Convert query params to URL params
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  try {
    console.log('Fetching analytics from:', `/api/analytics/advanced?${params}`);
    const response = await fetch(`/api/analytics/advanced?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}:`, errorText);
      throw new Error(`Failed to fetch analytics: ${response.status} - ${errorText || 'No error details'}`);
    }
    
    const data = await response.json();
    console.log('Advanced analytics data received:', data ? 'Success' : 'Empty');
    return data;
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    throw error;
  }
};

export default function AdvancedAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState('30d'); // Default to last 30 days
  const [activeView, setActiveView] = useState('overview');
  
  // Color scheme
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case 'all':
            startDate = null;
            break;
        }
        
        // Build query object
        const query = {};
        if (startDate) {
          query.startDate = startDate.toISOString().split('T')[0];
          query.endDate = endDate.toISOString().split('T')[0];
        }
        
        const data = await fetchAnalytics(query);
        setAnalytics(data);
        toast.success("Analytics data loaded successfully");
      } catch (err) {
        console.error('Error loading analytics:', err);
        toast.error(err instanceof Error 
          ? `Error: ${err.message}` 
          : "Failed to load analytics data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [dateRange]);
  
  // Helper functions to handle both earnings (streamers) and spend (brands) terminology
  const getTotalAmount = () => analytics?.estimatedEarnings ?? analytics?.totalSpend ?? 0;
  const getAmountPerStream = () => analytics?.earningsPerStream ?? analytics?.spendPerStream ?? 0;
  const getAmountPerMinute = () => analytics?.earningsPerMinute ?? analytics?.spendPerMinute ?? 0;
  const getAmountPerImpression = () => analytics?.earningsPerImpression ?? analytics?.spendPerImpression ?? 0;
  const isSpendMode = () => analytics?.totalSpend !== undefined;
  const getAmountLabel = () => isSpendMode() ? 'Spend' : 'Earnings';
  
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };
  
  // Data for pie chart - click sources
  const getClickSourcesData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Overlay', value: analytics.clicks || 0 },
      { name: 'Chat', value: analytics.chatClicks || 0 },
      { name: 'QR Code', value: analytics.qrScans || 0 },
      { name: 'Tracked Links', value: analytics.linkClicks || 0 },
    ];
  };
  
  // Data for engagement breakdown
  const getEngagementBreakdown = () => {
    if (!analytics) return [];
    
    return [
      { 
        name: 'Streams',
        count: analytics.totalStreams || 0,
        rate: analytics.totalStreams > 0 ? getAmountPerStream().toFixed(2) : '0.00'
      },
      { 
        name: 'Minutes',
        count: analytics.totalStreamMinutes || 0,
        rate: analytics.totalStreamMinutes > 0 ? getAmountPerMinute().toFixed(4) : '0.00'
      },
      { 
        name: 'Impressions',
        count: analytics.impressions || 0,
        rate: analytics.impressions > 0 ? getAmountPerImpression().toFixed(4) : '0.00'
      }
    ];
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <Tabs defaultValue="30d" value={dateRange} onValueChange={setDateRange}>
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* View Type Selector */}
      <Tabs defaultValue="overview" value={activeView} onValueChange={setActiveView} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="impression">Impression Analysis</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="earnings">{getAmountLabel()}</TabsTrigger>
        </TabsList>
        
        {/* Overview View */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Key Metric Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatNumber(analytics?.impressions || 0)}
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Viewer-based impression count
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatNumber(analytics?.totalClicks || 0)}
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                All engagement types combined
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="text-2xl font-bold">
                    {(analytics?.engagementRate || 0).toFixed(2)}%
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Interactions per impression
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total {getAmountLabel()}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(getTotalAmount())}
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Estimated from all campaigns
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Click Sources Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Engagement by Source</CardTitle>
                <CardDescription>Breakdown of interaction types</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getClickSourcesData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getClickSourcesData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Performance Metrics Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>{getAmountLabel()} efficiency breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getEngagementBreakdown()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'count') return formatNumber(value);
                        return formatCurrency(value as number);
                      }} />
                      <Legend />
                      <Bar dataKey="count" name="Total Count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Additional Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Stream Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Total Stream Minutes</span>
                        <span className="text-sm font-medium">{formatNumber(analytics?.totalStreamMinutes || 0)}</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Average Viewers</span>
                        <span className="text-sm font-medium">{formatNumber(analytics?.avgViewerCount || 0)}</span>
                      </div>
                      <Progress value={Math.min(analytics?.avgViewerCount / (analytics?.peakViewerCount || 1) * 100, 100) || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Peak Viewers</span>
                        <span className="text-sm font-medium">{formatNumber(analytics?.peakViewerCount || 0)}</span>
                      </div>
                      <Progress value={100} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Campaigns</span>
                        <span className="text-sm font-medium">{analytics?.totalCampaigns || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Stream Sessions</span>
                        <span className="text-sm font-medium">{analytics?.totalStreams || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Unique Streamers</span>
                        <span className="text-sm font-medium">{analytics?.totalStreamers || 0}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{getAmountLabel()} Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Per Stream</span>
                        <span className="text-sm font-medium">{formatCurrency(getAmountPerStream())}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Per Minute</span>
                        <span className="text-sm font-medium">{formatCurrency(getAmountPerMinute())}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Per Impression</span>
                        <span className="text-sm font-medium">{formatCurrency(getAmountPerImpression())}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Other tabs would be implemented similarly */}
        <TabsContent value="impression">
          <Card>
            <CardHeader>
              <CardTitle>Impression Analysis</CardTitle>
              <CardDescription>Detailed view of impression metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Impression analysis details would be shown here.</p>
              {/* Detailed impression analytics content */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analysis</CardTitle>
              <CardDescription>Detailed view of user engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Engagement analysis details would be shown here.</p>
              {/* Detailed engagement analytics content */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>{getAmountLabel()} Analysis</CardTitle>
              <CardDescription>Detailed view of {getAmountLabel().toLowerCase()} metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{getAmountLabel()} analysis details would be shown here.</p>
              {/* Detailed earnings/spend analytics content */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
