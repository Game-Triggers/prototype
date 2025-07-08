"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chart } from "@/components/analytics/chart";
import { StatCard } from "@/components/analytics/stat-card";
import { Eye, DollarSign, Users, BarChart2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency-config";

// Define types for our data
interface CampaignAnalyticsItem {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  streamerCount: number;
  earnings: number;
}

interface Streamer {
  streamerId: {
    _id: string;
    name: string;
    image?: string;
    category?: string;
    language?: string;
  };
  impressions: number;
  clicks: number;
  estimatedEarnings: number;
}

interface CampaignDetails {
  _id: string;
  name: string;
  description?: string;
  status: string;
  budget: number;
  impressionGoal?: number;
  clickGoal?: number;
  startDate: string;
  endDate: string;
  adContent?: {
    imageUrl?: string;
    title: string;
  };
}

interface CampaignData {
  campaign: CampaignDetails;
  analytics: CampaignAnalyticsItem[];
  totals: {
    impressions: number;
    clicks: number;
    earnings: number;
    ctr: number;
  };
  participatingStreamers: Streamer[];
}

export default function CampaignAnalyticsPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    campaign: {
      _id: '',
      name: '',
      status: '',
      budget: 0,
      startDate: '',
      endDate: '',
    },
    analytics: [],
    totals: {
      impressions: 0,
      clicks: 0,
      earnings: 0,
      ctr: 0,
    },
    participatingStreamers: [],
  });
  // Fetch campaign analytics data
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!session?.user) return;

      setIsLoading(true);
      try {
        const apiEndpoint = `/api/analytics/campaign/${id}?dateRange=${timeRange}`;
        
        console.log(`Fetching campaign data from: ${apiEndpoint}`);
        
        const response = await fetch(apiEndpoint, {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        console.log(`API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch campaign data: ${errorText}`);
          setError(`Failed to fetch campaign data: ${response.statusText}`);
          throw new Error(`Failed to fetch campaign data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched campaign data:", data);
        setCampaignData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching campaign analytics:", error);
        setError("Failed to load campaign analytics. Using mock data instead.");
        // Fallback to mock data in case of error
        setTimeout(() => {
          const mockCampaignData = getMockCampaignData();
          setCampaignData(mockCampaignData);
          setIsLoading(false);
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Helper function to generate mock campaign data with proper types
    function getMockCampaignData(): CampaignData {
      return {
        campaign: {
          _id: Array.isArray(id) ? id[0] : id || "mock-id",
          name: "Sample Campaign",
          description: "This is a sample campaign with mock data",
          status: "active",
          budget: 5000,
          impressionGoal: 100000,
          clickGoal: 5000,
          startDate: "2025-06-01T00:00:00Z",
          endDate: "2025-06-30T00:00:00Z",
          adContent: {
            title: "Sample Ad Content",
            imageUrl: "/images/placeholder.jpg"
          }
        },
        analytics: [
          { date: "2025-06-01", impressions: 3200, clicks: 160, ctr: 5.0, streamerCount: 3, earnings: 180 },
          { date: "2025-06-02", impressions: 4100, clicks: 205, ctr: 5.0, streamerCount: 3, earnings: 225 },
          { date: "2025-06-03", impressions: 3800, clicks: 190, ctr: 5.0, streamerCount: 3, earnings: 210 },
          { date: "2025-06-04", impressions: 4300, clicks: 215, ctr: 5.0, streamerCount: 3, earnings: 235 },
          { date: "2025-06-05", impressions: 5200, clicks: 260, ctr: 5.0, streamerCount: 3, earnings: 290 },
          { date: "2025-06-06", impressions: 4800, clicks: 240, ctr: 5.0, streamerCount: 3, earnings: 265 },
          { date: "2025-06-07", impressions: 3900, clicks: 195, ctr: 5.0, streamerCount: 3, earnings: 215 },
        ],
        totals: {
          impressions: 29300,
          clicks: 1465,
          ctr: 5.0,
          earnings: 1420,
        },
        participatingStreamers: [
          { 
            streamerId: {
              _id: "s1", 
              name: "GameMaster99",
              image: "/images/avatars/streamer1.jpg",
              category: "Gaming",
              language: "English"
            },
            impressions: 12500, 
            clicks: 625,
            estimatedEarnings: 625
          },
          { 
            streamerId: {
              _id: "s2", 
              name: "ProGamerXYZ",
              image: "/images/avatars/streamer2.jpg",
              category: "Just Chatting",
              language: "English"
            },
            impressions: 8900, 
            clicks: 445,
            estimatedEarnings: 445
          },
          { 
            streamerId: {
              _id: "s3", 
              name: "StreamQueen",
              image: "/images/avatars/streamer3.jpg",
              category: "IRL",
              language: "Spanish"
            },
            impressions: 7900, 
            clicks: 395,
            estimatedEarnings: 395
          },
        ]
      };
    };

    if (session?.user && id) {
      fetchCampaignData();
    } else {
      setIsLoading(false);
    }
  }, [session, id, timeRange]);

  // Handle time range switching
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // This will trigger a re-fetch with the new time range
  };
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format campaign dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate campaign progress
  const impressionProgress = campaignData.campaign.impressionGoal && campaignData.campaign.impressionGoal > 0
    ? (campaignData.totals.impressions / campaignData.campaign.impressionGoal) * 100
    : 0;
  
  const budgetProgress = campaignData.campaign.budget && campaignData.campaign.budget > 0
    ? (campaignData.totals.earnings / campaignData.campaign.budget) * 100
    : 0;
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <a href="/dashboard/analytics" className="hover:text-primary transition-colors">
            Analytics
          </a>
          <span className="mx-2">→</span>
          <span>Campaign Details</span>
        </div>
      </div>
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{campaignData.campaign.name || "Campaign Analytics"}</h1>
          <p className="text-muted-foreground mt-1">
            {campaignData.campaign.status === "active" ? "Active Campaign" : "Campaign"} • 
            {` ${formatDate(campaignData.campaign.startDate)} - ${formatDate(campaignData.campaign.endDate)}`}
          </p>
          {campaignData.campaign.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {campaignData.campaign.description}
            </p>
          )}
        </div>
        
        {/* Time range selector */}
        <div className="flex space-x-2">
          {["7d", "30d", "90d", "all"].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range === "7d"
                ? "7 Days"
                : range === "30d"
                ? "30 Days"
                : range === "90d"
                ? "90 Days"
                : "All Time"}
            </Button>
          ))}
        </div>
      </div>      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Impressions"
          value={(campaignData.totals?.impressions || 0).toLocaleString()}
          change={campaignData.campaign.impressionGoal ? 
            `${impressionProgress.toFixed(1)}% of goal` : 
            "No goal set"}
          trend={impressionProgress >= 50 ? "up" : "neutral"}
          icon={<Eye className="h-5 w-5" />}
        />

        <StatCard
          title="Total Clicks"
          value={(campaignData.totals?.clicks || 0).toLocaleString()}
          change={`${(campaignData.totals?.ctr || 0).toFixed(2)}% CTR`}
          trend={campaignData.totals?.ctr > 3 ? "up" : "neutral"}
          icon={<BarChart2 className="h-5 w-5" />}
        />

        <StatCard
          title="Campaign Budget"
          value={formatCurrency(campaignData.campaign.budget || 0)}
          change={`${formatCurrency(campaignData.totals?.earnings || 0)} spent (${budgetProgress.toFixed(1)}%)`}
          trend={budgetProgress <= 90 ? "up" : "down"}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <StatCard
          title="Participating Streamers"
          value={(campaignData.participatingStreamers?.length || 0).toString()}
          icon={<Users className="h-5 w-5" />}
        />
      </div>{/* Performance chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Campaign Performance Over Time</h3>
        <Chart
          type="Line"
          data={{
            labels: (campaignData.analytics || []).map((item: CampaignAnalyticsItem) => {
              const date = new Date(item.date);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }),
            datasets: [
              {
                label: "Impressions",
                data: (campaignData.analytics || []).map((item: CampaignAnalyticsItem) => item.impressions || 0),
              },
              {
                label: "Clicks",
                data: (campaignData.analytics || []).map((item: CampaignAnalyticsItem) => item.clicks || 0),
              },
            ],
          }}
        />
      </Card>

      {/* Streamer performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Streamer Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4 text-left">Streamer</th>
                <th className="py-3 px-4 text-right">Impressions</th>
                <th className="py-3 px-4 text-right">Clicks</th>
                <th className="py-3 px-4 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {(campaignData.participatingStreamers || []).map((streamer: Streamer) => (
                <tr key={streamer.streamerId?._id || 'unknown'} className="border-b">
                  <td className="py-3 px-4">
                    <div className="flex items-center">                      {streamer.streamerId.image && (
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                          <Image
                            src={streamer.streamerId.image}
                            alt={streamer.streamerId.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{streamer.streamerId?.name || 'Unknown Streamer'}</p>
                        {streamer.streamerId.category && (
                          <p className="text-xs text-muted-foreground">
                            {streamer.streamerId.category}
                            {streamer.streamerId.language && ` • ${streamer.streamerId.language}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(streamer?.impressions || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(streamer?.clicks || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(streamer?.estimatedEarnings || 0)}
                  </td>
                </tr>
              ))}
              {(!campaignData.participatingStreamers || campaignData.participatingStreamers.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-center">No streamer data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
