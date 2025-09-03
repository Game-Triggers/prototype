"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Campaign {
  _id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  startDate: string;
  endDate: string;
}

export function StreamerDashboardContent() {
  const { data: session } = useSession();
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableCampaigns = async () => {
      if (!session?.accessToken) return;
      
      try {
        setLoading(true);
        // Fetch available campaigns for streamers using direct fetch to proxy endpoint
        const response = await fetch('/api/campaigns?status=active&limit=10', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Include session cookies
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campaigns: ${response.status}`);
        }

        const campaigns = await response.json() as Campaign[];
        // Show only first 3 campaigns
        const activeCampaigns = campaigns.slice(0, 3);
        
        setAvailableCampaigns(activeCampaigns);
      } catch (error) {
        console.error('Error fetching available campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchAvailableCampaigns();
    }
  }, [session?.accessToken]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Available Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-primary text-sm flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="bg-card p-6 rounded-lg border">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
              </div>
            </div>
          ) : availableCampaigns.length > 0 ? (
            <div className="space-y-4">
              {availableCampaigns.map((campaign) => (
                <div key={campaign._id} className="bg-card p-6 rounded-lg border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{campaign.title}</h3>
                      <p className="text-muted-foreground mb-2">{campaign.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Budget: ${campaign.budget.toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/campaigns/${campaign._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Button asChild>
                  <Link href="/dashboard/campaigns">Browse All Campaigns</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-lg border">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Ready to earn with sponsored content?</h3>
                <p className="text-muted-foreground mb-4">
                  Browse available campaigns and start earning today.
                </p>
                <Button asChild>
                  <Link href="/dashboard/campaigns">Browse Campaigns</Link>
                </Button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Setup</h2>
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-2">Set up your streaming overlay</h3>
              <p className="text-muted-foreground mb-4">
                Add a browser source to your OBS or Streamlabs to display sponsored content.
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/settings/overlay">Configure Overlay</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Additional widgets can be added here */}
        </div>
      </div>
    </div>
  );
}
