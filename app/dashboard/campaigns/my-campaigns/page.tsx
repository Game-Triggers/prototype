"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  Search
} from "lucide-react";
import { CampaignCard } from "@/components/ui/campaign-card";

// Define types for campaign data
interface Participation {
  impressions: number;
  clicks: number;
  estimatedEarnings: number;
  browserSourceUrl: string;
  browserSourceToken: string;
  joinedAt: string;
}

interface JoinedCampaign {
  campaign: {
    _id: string;
    title: string;
    description: string;
    brandId: string;
    brandName: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    paymentRate: number;
    paymentType: "cpm" | "fixed";
    budget: number;
    remainingBudget: number;
    startDate: string;
    endDate: string;
    status: string;
    categories: string[];
  };
  participation: Participation;
}

export default function MyStreamerCampaignsPage() {
  const { status } = useSession();
  const [campaigns, setCampaigns] = useState<JoinedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch joined campaigns
  useEffect(() => {
    const fetchJoinedCampaigns = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching joined campaigns for streamer');
        
        // Fetch campaigns from the API
        const response = await fetch('/api/campaigns/streamer/active', {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch joined campaigns: ${response.status}`, errorText);
          throw new Error(`Failed to fetch joined campaigns: ${response.status}`);
        }
        
        // Process the API response
        const joinedCampaigns = await response.json();
        console.log('Fetched joined campaigns data:', joinedCampaigns);
        
        // If we got data, set it to state
        if (joinedCampaigns && Array.isArray(joinedCampaigns)) {
          console.log(`Received ${joinedCampaigns.length} joined campaigns`);
          setCampaigns(joinedCampaigns);
        } else {
          console.warn('Received non-array data from API:', joinedCampaigns);
          setCampaigns([]); // Set empty array as fallback
        }
      } catch (error) {
        console.error('Error fetching joined campaigns:', error);
        // No mock data for this case - just set empty array
        setCampaigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchJoinedCampaigns();
    }
  }, [status]);

  // Handle campaign actions
  const handleCampaignAction = (action: string, campaignId: string) => {
    console.log(`Action: ${action}, Campaign ID: ${campaignId}`);
    
    switch(action) {
      case 'getBrowserSource':
        const campaign = campaigns.find(c => c.campaign._id === campaignId);
        if (campaign) {
          alert(`Browser Source URL: ${campaign.participation.browserSourceUrl}`);
          // In production, you would show this in a modal with a copy button
        }
        break;
        
      case 'leave':
        // Implementation for leaving a campaign would go here
        alert('Leave campaign functionality coming soon');
        break;
        
      default:
        break;
    }
  };

  // Search and filter functionality
  const filteredCampaigns = campaigns.filter(item => {
    const campaign = item.campaign;
    
    // Filter by category
    const matchesCategory = filter === 'all' || 
      campaign.categories.some(cat => cat.toLowerCase() === filter.toLowerCase());
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your joined campaigns and view your statistics
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/campaigns/my-campaigns/overlay-help">
            Overlay Setup Guide
          </Link>
        </Button>
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 sm:w-auto sm:px-4">
          <Filter className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex overflow-x-auto py-2 mb-4 gap-2">
        {["all", ...new Set(campaigns.flatMap(item => item.campaign.categories))].map((category) => (
          <Button
            key={category}
            variant={filter === category ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setFilter(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Campaigns grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(item => {
            const campaignData = {
              id: item.campaign._id,
              title: item.campaign.title,
              description: item.campaign.description,
              mediaUrl: item.campaign.mediaUrl,
              mediaType: item.campaign.mediaType,
              paymentType: item.campaign.paymentType,
              paymentRate: item.campaign.paymentRate,
              budget: item.campaign.budget,
              remainingBudget: item.campaign.remainingBudget,
              startDate: item.campaign.startDate,
              endDate: item.campaign.endDate,
              status: item.campaign.status,
              participationStatus: 'active',  // Already joined
              impressions: item.participation.impressions,
              clicks: item.participation.clicks,
              earnings: item.participation.estimatedEarnings,
            };
            
            return (
              <CampaignCard 
                key={item.campaign._id}
                campaign={campaignData}
                variant="streamer"
                onActionClick={handleCampaignAction}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No joined campaigns found</h3>
          <p className="text-muted-foreground mb-6">
            {filter !== 'all'
              ? `You haven't joined any campaigns in the "${filter}" category.`
              : searchQuery
              ? `No campaigns match your search for "${searchQuery}".`
              : "You haven't joined any campaigns yet."}
          </p>
            <Button asChild>
            <Link href="/dashboard/campaigns">Browse Available Campaigns</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
