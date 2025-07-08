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
  participantCount?: number;
}

export function BrandDashboardContent() {
  const { data: session } = useSession();
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCampaigns = async () => {
      if (!session?.accessToken) return;
      
      try {
        setLoading(true);
        // Fetch campaigns created by this brand using direct fetch to proxy endpoint
        const response = await fetch('/api/campaigns?limit=10', {
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
        // Show latest 3 campaigns
        const brandCampaigns = campaigns.slice(0, 3);
        
        setUserCampaigns(brandCampaigns);
      } catch (error) {
        console.error('Error fetching user campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchUserCampaigns();
    }
  }, [session?.accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Campaigns</h2>
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
      ) : userCampaigns.length > 0 ? (
        <div className="space-y-4">
          {userCampaigns.map((campaign) => (
            <div key={campaign._id} className="bg-card p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{campaign.title}</h3>
                  <p className="text-muted-foreground mb-2">{campaign.description}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Budget: ${campaign.budget.toLocaleString()}</span>
                    <span>Status: {campaign.status}</span>
                    {campaign.participantCount && (
                      <span>Participants: {campaign.participantCount}</span>
                    )}
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/campaigns/${campaign._id}`}>
                    Manage
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          <div className="text-center pt-4">
            <Button asChild>
              <Link href="/dashboard/campaigns/create">Create New Campaign</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg border">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Ready to promote your brand?</h3>
            <p className="text-muted-foreground mb-4">
              Create a new campaign to reach streamers and their audiences.
            </p>
            <Button asChild>
              <Link href="/dashboard/campaigns/create">Create Campaign</Link>
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Campaign Performance</h2>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-2">Track your campaign metrics</h3>
          <p className="text-muted-foreground mb-4">
            See how your campaigns are performing and optimize your strategy.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/analytics">View Analytics</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
