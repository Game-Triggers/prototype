"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Calendar,
  Eye,
} from "lucide-react";
import { Chart } from "./chart";
import { StatCard } from "./stat-card";
import { formatCurrency } from "@/lib/currency-config";
import { useEurekaRole, usePermissions } from "@/lib/hooks/use-eureka-roles";
import { Permission, Portal } from "@/lib/eureka-roles";

export function AnalyticsContent() {
  const { data: session, status } = useSession();
  const { eurekaRole, portal, permissions, isAuthenticated } = useEurekaRole();
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    impressions: 0,
    campaignStats: {},
    viewersData: {},
    campaigns: [],
    topCampaigns: [],
    topStreamers: [],
  });

  // Permission checks
  const canViewAnalytics = hasPermission(Permission.VIEW_ANALYTICS);
  const canViewDetailedAnalytics = hasPermission(Permission.VIEW_DETAILED_ANALYTICS);
  const canExportReports = hasPermission(Permission.EXPORT_REPORTS);

  // Fetch analytics data using our proxy routes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!session?.user) return;

      setIsLoading(true);
      try {
        // Fetch dashboard data from our proxy route
        const apiEndpoint = "/analytics/dashboard";

        const response = await fetch(`/api${apiEndpoint}`,{
          headers : {
            "Content-Type": "application/json",
          },
          cache: "no-store"
        });

        console.log(`API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch analytics data: ${errorText}`);
          throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
        }

        const dashboardData = await response.json();
        console.log("Fetched dashboard data:", dashboardData);

        // For admins, also fetch platform overview data
        let platformOverviewData = null;
        if (hasPermission(Permission.VIEW_DETAILED_ANALYTICS)) {
          try {
            const overviewResponse = await fetch("/api/analytics/overview", {
              headers: {
                "Content-Type": "application/json",
              },
              cache: "no-store",
            });
            
            if (overviewResponse.ok) {
              platformOverviewData = await overviewResponse.json();
              console.log("Fetched platform overview data:", platformOverviewData);
            } else {
              console.error("Failed to fetch platform overview:", await overviewResponse.text());
            }
          } catch (error) {
            console.error("Error fetching platform overview:", error);
          }
        }
        
        // Fetch top campaigns and streamers        // Initialize with empty arrays for safety
        let topCampaignsData = [];
        let topStreamersData = [];
        
        try {
          const topCampaignsResponse = await fetch("/api/analytics/campaigns/top", {
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });
          
          if (topCampaignsResponse.ok) {
            topCampaignsData = await topCampaignsResponse.json();
            console.log("Fetched top campaigns:", topCampaignsData);
          } else {
            console.error("Failed to fetch top campaigns:", await topCampaignsResponse.text());
          }
        } catch (error) {
          console.error("Error fetching top campaigns:", error);
        }
        
        try {
          const topStreamersResponse = await fetch("/api/analytics/streamers/top", {
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });
          
          if (topStreamersResponse.ok) {
            topStreamersData = await topStreamersResponse.json();
            console.log("Fetched top streamers:", topStreamersData);
          } else {
            console.error("Failed to fetch top streamers:", await topStreamersResponse.text());
          }
        } catch (error) {
          console.error("Error fetching top streamers:", error);
        }        // Combine the data
        let combinedData = {
          ...dashboardData,
          topCampaigns: topCampaignsData,
          topStreamers: topStreamersData,
        };

        // For admins, merge platform overview data and format properly
        if (hasPermission(Permission.VIEW_DETAILED_ANALYTICS) && dashboardData) {
          combinedData = {
            ...combinedData,
            platformOverview: platformOverviewData,
            // Use platform totals for admin stats
            impressions: dashboardData.platformTotals?.impressions || 0,
            totalRevenue: dashboardData.platformTotals?.totalEarnings || 0,
            totalStreamers: dashboardData.platformTotals?.totalStreamers || 0,
            totalCampaigns: dashboardData.platformTotals?.totalCampaigns || 0,
            activeCampaigns: dashboardData.platformTotals?.activeCampaigns || 0,
            totalBrands: dashboardData.platformTotals?.totalBrands || 0,
            engagementRate: dashboardData.platformTotals?.ctr || 0,
            avgWatchTime: "N/A", // Platform-wide average not calculated yet
          };
        }

        setAnalyticsData(combinedData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        // Fallback to mock data in case of error
        setTimeout(() => {
          const mockAnalyticsData = {
            impressions: 84250,
            engagementRate: 5.4,
            totalStreamers: 28,
            totalCampaigns: 12,
            totalRevenue: portal === Portal.PUBLISHER ? 629.4 : 3450.0,
            avgWatchTime: "00:08:32",
            campaignStats: {
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [
                {
                  label: "Impressions",
                  data: [12000, 14500, 9800, 10900, 15600, 13200, 8250],
                },
                {
                  label: "Engagements",
                  data: [640, 720, 540, 590, 840, 710, 490],
                },
              ],
            },
            viewersData: {
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [
                {
                  label: "Viewers",
                  data: [2800, 3600, 2400, 2950, 4200, 3800, 2500],
                },
              ],
            },
            campaigns: [
              {
                id: "c1",
                name: "Gaming Headset Promo",
                impressions: 24150,
                engagement: 1250,
                revenue: 840.5,
                status: "active",
              },
              {
                id: "c2",
                name: "Energy Drink Launch",
                impressions: 18720,
                engagement: 980,
                revenue: 690.3,
                status: "active",
              },
              {
                id: "c3",
                name: "Streaming Software",
                impressions: 15890,
                engagement: 840,
                revenue: 520.6,
                status: "active",
              },
              {
                id: "c4",
                name: "Gaming Chair",
                impressions: 12450,
                engagement: 680,
                revenue: 415.2,
                status: "active",
              },
              {
                id: "c5",
                name: "Mechanical Keyboard",
                impressions: 9650,
                engagement: 520,
                revenue: 310.8,
                status: "active",
              },
            ],
            topCampaigns: [
              {
                id: "c1",
                name: "Gaming Headset Promo",
                impressions: 24150,
                engagement: 1250,
                revenue: 840.5,
                ctr: 5.2,
              },
              {
                id: "c2",
                name: "Energy Drink Launch",
                impressions: 18720,
                engagement: 980,
                revenue: 690.3,
                ctr: 5.0,
              },
              {
                id: "c3",
                name: "Streaming Software",
                impressions: 15890,
                engagement: 840,
                revenue: 520.6,
                ctr: 5.3,
              },
            ],
            topStreamers: [
              {
                id: "s1",
                name: "GameMaster99",
                impressions: 12500,
                engagement: 680,
                revenue: 435.2,
                viewers: 2850,
              },
              {
                id: "s2",
                name: "ProGamerXYZ",
                impressions: 10850,
                engagement: 590,
                revenue: 380.6,
                viewers: 2450,
              },
              {
                id: "s3",
                name: "StreamQueen",
                impressions: 8950,
                engagement: 490,
                revenue: 310.5,
                viewers: 2100,
              },
            ],
          };
          setAnalyticsData(mockAnalyticsData);
          setIsLoading(false);
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchAnalyticsData();
    } else {
      setIsLoading(false);
    }
  }, [session, hasPermission, portal, timeRange]);

  // Handle tab switching
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle time range switching
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // This would trigger a re-fetch of data with the new time range
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Analytics Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex space-x-2">
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              onClick={() => setTimeRange("7d")}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === "30d" ? "default" : "outline"}
              onClick={() => setTimeRange("30d")}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === "90d" ? "default" : "outline"}
              onClick={() => setTimeRange("90d")}
            >
              90 Days
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.location.href = '/dashboard/analytics/advanced'}
          >
            <TrendingUp className="h-4 w-4" />
            Advanced Analytics
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance metrics and campaign insights
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "overview"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => handleTabChange("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "campaigns"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => handleTabChange("campaigns")}
          >
            Campaigns
          </button>
          {portal === Portal.BRAND && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "streamers"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => handleTabChange("streamers")}
            >
              Streamers
            </button>
          )}
          {hasPermission(Permission.VIEW_DETAILED_ANALYTICS) && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "streamers"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => handleTabChange("streamers")}
            >
              Top Streamers
            </button>
          )}
          {hasPermission(Permission.VIEW_DETAILED_ANALYTICS) && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "platform"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => handleTabChange("platform")}
            >
              Platform Insights
            </button>
          )}
        </div>

        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Impressions"              value={(analyticsData.impressions || 0).toLocaleString()}
                change={`+${analyticsData.campaignStats?.percentChange || 0}% from previous period`}
                trend="up"
                icon={<Eye className="h-5 w-5" />}
              />

              <StatCard
                title={
                  portal === Portal.PUBLISHER
                    ? "Total Earnings"
                    : hasPermission(Permission.VIEW_DETAILED_ANALYTICS)
                    ? "Platform Revenue"
                    : "Total Spent"
                }              value={formatCurrency(analyticsData.totalRevenue || 0)}
                change="+8.3% from previous period"
                trend="up"
                icon={<DollarSign className="h-5 w-5" />}
              />

              {hasPermission(Permission.VIEW_DETAILED_ANALYTICS) ? (
                <StatCard
                  title="Total Brands"
                  value={(analyticsData.totalBrands || 0).toLocaleString()}
                  change="+5 from last month"
                  trend="up"
                  icon={<Users className="h-5 w-5" />}
                />
              ) : (
                <StatCard
                  title="Average Watch Time"
                  value={analyticsData.avgWatchTime || "N/A"}
                  change="+12% from previous period"
                  trend="up"
                  icon={<Clock className="h-5 w-5" />}
                />
              )}

              <StatCard
                title={
                  portal === Portal.PUBLISHER
                    ? "Active Campaigns"
                    : hasPermission(Permission.VIEW_DETAILED_ANALYTICS)
                    ? "Total Streamers"
                    : "Total Streamers"
                }
                value={
                  portal === Portal.PUBLISHER
                    ? analyticsData.totalCampaigns
                    : analyticsData.totalStreamers
                }
                change="+3 from last month"
                trend="up"
                icon={
                  portal === Portal.PUBLISHER ? (
                    <Calendar className="h-5 w-5" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )
                }
              />
            </div>

            {/* Admin-specific additional stats */}
            {hasPermission(Permission.VIEW_DETAILED_ANALYTICS) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <StatCard
                  title="Active Campaigns"
                  value={(analyticsData.activeCampaigns || 0).toLocaleString()}
                  change="+8 from last month"
                  trend="up"
                  icon={<Calendar className="h-5 w-5" />}
                />

                <StatCard
                  title="Total Campaigns"
                  value={(analyticsData.totalCampaigns || 0).toLocaleString()}
                  change="+12 from last month"
                  trend="up"
                  icon={<Calendar className="h-5 w-5" />}
                />

                <StatCard
                  title="Platform CTR"
                  value={`${(analyticsData.engagementRate || 0).toFixed(2)}%`}
                  change="+0.3% from last month"
                  trend="up"
                  icon={<TrendingUp className="h-5 w-5" />}
                />

                <StatCard
                  title="Growth Rate"
                  value={`+${analyticsData.summary?.platform30DayGrowth?.toFixed(1) || 0}%`}
                  change="30-day growth"
                  trend="up"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
              </div>
            )}

            {/* Impression chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Impressions Over Time
              </h3>
              <Chart
                type="Line"
                data={{
                  labels: [
                    "Day 1",
                    "Day 2",
                    "Day 3",
                    "Day 4",
                    "Day 5",
                    "Day 6",
                    "Day 7",
                  ],
                  datasets: [
                    {
                      label: "Impressions",
                      data: [12400, 13200, 14500, 12800, 15600, 16800, 18800],
                    },
                  ],
                }}
              />
            </Card>

            {/* Revenue chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {portal === Portal.PUBLISHER ? "Earnings" : "Spend"} Over Time
              </h3>
              <Chart
                type="Bar"
                data={{
                  labels: [
                    "Day 1",
                    "Day 2",
                    "Day 3",
                    "Day 4",
                    "Day 5",
                    "Day 6",
                    "Day 7",
                  ],
                  datasets: [
                    {
                      label:
                        portal === Portal.PUBLISHER ? "Earnings" : "Spend",
                      data: [120, 145, 135, 150, 180, 190, 210],
                    },
                  ],
                }}
              />
            </Card>
          </>
        )}

        {activeTab === "campaigns" && (
          <>
            {/* Campaign performance chart */}          <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
              <Chart
                type="Bar"
                data={{
                  labels: (analyticsData.campaigns || []).map((c) => c?.name || 'Unknown'),
                  datasets: [
                    {
                      label: "Impressions",
                      data: (analyticsData.campaigns || []).map(
                        (c) => c?.impressions || 0
                      ),
                    },
                  ],
                }}
              />
            </Card>

            {/* Top performing campaigns */}          <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Top Performing Campaigns
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">Campaign</th>
                      <th className="py-3 px-4 text-right">Impressions</th>
                      <th className="py-3 px-4 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData.topCampaigns || []).map((campaign) => (
                      <tr key={campaign?.name || 'unknown'} className="border-b">
                        <td className="py-3 px-4">{campaign?.name || 'Unknown Campaign'}</td>
                        <td className="py-3 px-4 text-right">
                          {(campaign?.impressions || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">{campaign?.ctr || 0}</td>
                      </tr>
                    ))}
                    {(!analyticsData.topCampaigns || analyticsData.topCampaigns.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-center">No campaigns data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === "streamers" && portal === Portal.BRAND && (
          <>
            {/* Streamer performance chart */}          <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Streamer Performance</h3>
              <Chart
                type="Bar"
                data={{
                  labels: (analyticsData.topStreamers || []).map((s) => s?.name || 'Unknown'),
                  datasets: [
                    {
                      label: "Impressions",
                      data: (analyticsData.topStreamers || []).map(
                        (s) => s?.impressions || 0
                      ),
                    },
                  ],
                }}
              />
            </Card>

            {/* Top Performing Streamers */}          <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Streamers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">Streamer</th>
                      <th className="py-3 px-4 text-right">Impressions</th>
                      <th className="py-3 px-4 text-right">Average Viewers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData.topStreamers || []).map((streamer) => (
                      <tr key={streamer?.name || 'unknown'} className="border-b">
                        <td className="py-3 px-4">{streamer?.name || 'Unknown Streamer'}</td>
                        <td className="py-3 px-4 text-right">
                          {(streamer?.impressions || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {streamer?.viewers || 0}
                        </td>
                      </tr>
                    ))}
                    {(!analyticsData.topStreamers || analyticsData.topStreamers.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-center">No streamers data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === "platform" && hasPermission(Permission.VIEW_DETAILED_ANALYTICS) && (
          <>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Platform Insights</h2>
                <p className="text-muted-foreground">
                  Comprehensive platform analytics and growth metrics
                </p>
              </div>

              {/* Platform Growth Chart */}
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Platform Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Platform-wide metrics over time
                  </p>
                </div>
                <Chart
                  data={{
                    labels: (analyticsData.analytics || []).map((item: any) => {
                      if (item.date?.year && item.date?.month && item.date?.day) {
                        return new Date(item.date.year, item.date.month - 1, item.date.day).toLocaleDateString();
                      }
                      return 'N/A';
                    }),
                    datasets: [
                      {
                        label: "Daily Impressions",
                        data: (analyticsData.analytics || []).map((item: any) => item.impressions || 0),
                        borderColor: "#8884d8",
                        backgroundColor: "rgba(136, 132, 216, 0.1)",
                      },
                      {
                        label: "Daily Clicks",
                        data: (analyticsData.analytics || []).map((item: any) => item.clicks || 0),
                        borderColor: "#82ca9d",
                        backgroundColor: "rgba(130, 202, 157, 0.1)",
                      },
                    ],
                  }}
                  type="line"
                />
              </Card>

              {/* Platform Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Streamers (30d)</span>
                      <span className="font-medium">
                        {analyticsData.summary?.newStreamers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Brands (30d)</span>
                      <span className="font-medium">
                        {analyticsData.summary?.newBrands || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Campaigns (30d)</span>
                      <span className="font-medium">
                        {analyticsData.summary?.newCampaigns || 0}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Platform Health</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average CTR</span>
                      <span className="font-medium">
                        {(analyticsData.engagementRate || 0).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Campaign Ratio</span>
                      <span className="font-medium">
                        {analyticsData.totalCampaigns > 0 
                          ? ((analyticsData.activeCampaigns / analyticsData.totalCampaigns) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Revenue/Campaign</span>
                      <span className="font-medium">
                        {formatCurrency(analyticsData.totalCampaigns > 0 
                          ? ((analyticsData.totalRevenue || 0) / analyticsData.totalCampaigns)
                          : 0)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Platform Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Platform is performing well</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Last updated: Just now</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">
                        {analyticsData.summary?.newCampaigns || 0} new campaigns this month
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">30 days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">
                        {((analyticsData.summary?.newStreamers || 0) + (analyticsData.summary?.newBrands || 0))} new users joined
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">30 days</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
