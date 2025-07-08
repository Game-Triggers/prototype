"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/schemas/user.schema";
import { PlusCircle, Filter, Search } from "lucide-react";
import { CampaignCard, Campaign } from "./campaign-card";
import { FilterBar } from "./filter-bar";

export function CampaignsContent() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = session?.user?.role;

  // Fetch campaigns from API based on user role
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        
        // Determine which API endpoint to use based on user role
        let apiEndpoint = '/campaigns';
        if (userRole === UserRole.BRAND) {
          apiEndpoint = '/campaigns/brand';
        } else if (userRole === UserRole.STREAMER) {
          apiEndpoint = '/campaigns/streamer/available';
        }
        
        console.log(`Fetching campaigns from API endpoint: /api${apiEndpoint}`);
        
        // Fetch real campaigns from the API
        const response = await fetch(`/api${apiEndpoint}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch campaigns: ${response.status}`, errorText);
          throw new Error(`Failed to fetch campaigns: ${response.status}`);
        }
        
        // Process the API response
        const apiCampaigns = await response.json();
        console.log('Fetched campaigns data:', apiCampaigns);
        
        // If we got data, map it to our Campaign interface
        if (apiCampaigns && Array.isArray(apiCampaigns)) {
          console.log(`Received ${apiCampaigns.length} campaigns from API`);
          
          const formattedCampaigns = apiCampaigns.map((campaign: Record<string, unknown>) => ({
            id: campaign._id?.toString() || campaign.id?.toString() || '',
            title: campaign.title?.toString() || 'Untitled Campaign',
            description: campaign.description?.toString() || '',
            brandName: campaign.brandName?.toString() || 'Brand', 
            brandLogo: campaign.brandLogo?.toString(),
            mediaUrl: campaign.mediaUrl?.toString() || 'https://placehold.co/600x400?text=Campaign',
            mediaType: (campaign.mediaType as 'image' | 'video') || 
              (campaign.mediaUrl?.toString()?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image' : 'video'),
            budget: typeof campaign.budget === 'number' ? campaign.budget : 0,
            remainingBudget: typeof campaign.remainingBudget === 'number' ? 
              campaign.remainingBudget : (typeof campaign.budget === 'number' ? campaign.budget : 0),
            paymentRate: typeof campaign.paymentRate === 'number' ? campaign.paymentRate : 0,
            paymentType: ((campaign.paymentType as string) === 'fixed' ? 'fixed' : 'cpm') as 'cpm' | 'fixed',
            categories: Array.isArray(campaign.categories) ? 
              campaign.categories.map(cat => cat.toString()) : [],
            status: ['draft', 'active', 'paused', 'completed'].includes(campaign.status?.toString() || '') ? 
              campaign.status as 'draft' | 'active' | 'paused' | 'completed' : 'draft',
            activeStreamers: typeof campaign.activeStreamers === 'number' ? campaign.activeStreamers : 0,
            participationStatus: campaign.participationStatus?.toString() || 'not_joined', // Default to 'not_joined'
          }));
          
          console.log('Formatted campaigns:', formattedCampaigns);
          setCampaigns(formattedCampaigns);
        } else {
          console.warn('Received non-array data from API:', apiCampaigns);
          setCampaigns([]); // Set empty array as fallback
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        // Fall back to mock data if the API call fails
        console.log('Using mock data as fallback');
        const mockCampaigns: Campaign[] = [
          {
            id: '1',
            title: 'Gaming Headset Promotion',
            description: 'Promote our new gaming headset during your streams.',
            brandName: 'AudioTech',
            mediaUrl: 'https://placehold.co/600x400?text=Campaign',
            mediaType: 'image',
            budget: 5000,
            remainingBudget: 3750,
            paymentRate: 35,
            paymentType: 'cpm',
            categories: ['Gaming'],
            status: 'active',
            activeStreamers: 12,
            participationStatus: 'active', // This campaign will show as already joined
          },
          {
            id: '2',
            title: 'Energy Drink Campaign',
            description: 'Show our energy drink brand during your gaming sessions.',
            brandName: 'PowerBoost',
            mediaUrl: 'https://placehold.co/600x400?text=Campaign',
            mediaType: 'image',
            budget: 8000,
            remainingBudget: 6500,
            paymentRate: 40,
            paymentType: 'cpm',
            categories: ['Lifestyle', 'Gaming'],
            status: 'active',
            activeStreamers: 8,
            participationStatus: '', // Not joined
          },
        ];
        setCampaigns(mockCampaigns);
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchCampaigns();
    }
  }, [userRole, session, status]);

  const handleJoinCampaign = async (campaignId: string) => {
    try {
      // Get the campaign from our state
      const campaign = campaigns.find(c => c.id === campaignId);
      
      // Check if the user has already joined this campaign
      if (campaign?.participationStatus === 'active') {
        alert('You have already joined this campaign.');
        return;
      }
      
      console.log(`Joining campaign with ID: ${campaignId}`);
      
      // Call the API to join the campaign
      const response = await fetch('/api/campaigns/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to join campaign:', errorData);
        alert(`Error: ${errorData.message || 'Failed to join campaign'}`);
        return;
      }
      
      const data = await response.json();
      console.log('Successfully joined campaign:', data);
      
      // Show success message
      alert('Successfully joined campaign! You can now set up your overlay in the dashboard.');
        // Refresh campaigns list to update UI
      const updatedCampaigns = campaigns.map(campaign => {
        if (campaign.id === campaignId) {
          return { 
            ...campaign, 
            // Update activeStreamers count if defined
            activeStreamers: campaign.activeStreamers !== undefined ? campaign.activeStreamers + 1 : undefined,
            // Set participation status to active
            participationStatus: 'active'
          };
        }
        return campaign;
      });
      
      setCampaigns(updatedCampaigns);    } catch (error) {
      console.error('Error joining campaign:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'An error occurred while joining the campaign.';
      
      if (error instanceof Error) {
        if (error.message.includes('streamerId')) {
          errorMessage = 'There was an issue with your user account. Please try signing out and signing back in.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Unable to join campaign: ${errorMessage}`);
    }
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Apply filters to campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {userRole === UserRole.STREAMER 
              ? 'Browse Campaigns' 
              : userRole === UserRole.BRAND 
              ? 'My Campaigns' 
              : 'All Campaigns'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === UserRole.STREAMER
              ? 'Find campaigns to join and start earning'
              : userRole === UserRole.BRAND
              ? 'Manage your campaign portfolio'
              : 'View and manage all platform campaigns'}
          </p>
        </div>
        {userRole === UserRole.BRAND && (
          <Button asChild>
            <Link href="/dashboard/campaigns/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        )}
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
            onChange={handleSearchChange}
          />
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 sm:w-auto sm:px-4">
          <Filter className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
      </div>

      {/* Filter bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Campaigns grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              userRole={userRole || ''}
              onJoin={handleJoinCampaign}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">
            {filter !== 'all'
              ? `There are no campaigns in the "${filter}" category.`
              : searchQuery
              ? `No campaigns match your search for "${searchQuery}".`
              : userRole === UserRole.BRAND
              ? "You haven't created any campaigns yet."
              : "There are no campaigns available at the moment."}
          </p>
          
          {userRole === UserRole.BRAND && (
            <Button asChild className="mt-4">
              <Link href="/dashboard/campaigns/create">Create Your First Campaign</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
