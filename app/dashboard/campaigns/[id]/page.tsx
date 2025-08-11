"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Clock,
  Users,
  Eye,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Pencil,
  Pause,
  Play
} from "lucide-react";
import { formatCurrency } from "@/lib/currency-config";
import { CampaignStatus } from "@/schemas/campaign.schema";
import { UserRole } from "@/schemas/user.schema";

interface Campaign {
  id: string;
  title: string;
  description: string;
  brandName: string;
  brandId?: string;
  brandLogo?: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  budget: number;
  remainingBudget: number;
  paymentRate: number;
  paymentType: 'cpm' | 'fixed';
  categories: string[];
  languages?: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  activeStreamers?: number;
  // Analytics metrics (viewer-based)
  impressions?: number; // Traditional impressions
  clicks?: number; // Traditional clicks
  ctr?: number;
  // Advanced viewer-based metrics
  viewerImpressions?: number; // New viewer-based impressions
  chatClicks?: number;
  qrScans?: number;
  linkClicks?: number;
  totalClicks?: number;
  engagementRate?: number; // Traditional engagement rate
  viewerEngagementRate?: number; // New viewer-based engagement rate
  // Dates
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const userRole = session?.user?.role;
  const userCanEdit = userRole === UserRole.BRAND || userRole === UserRole.ADMIN;
  const userIsCampaignOwner = userRole === UserRole.BRAND && session?.user?.id === campaign?.brandId;
  const showActivateButton = userIsCampaignOwner && campaign?.status === 'draft';
  const showPauseButton = userIsCampaignOwner && campaign?.status === 'active';
  const showResumeButton = userIsCampaignOwner && campaign?.status === 'paused';

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch campaign details from API
        const response = await fetch(`/api/campaigns/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status}`);
        }
        
        const campaignData = await response.json();
        console.log('Fetched campaign data:', campaignData);
        
        // Try to fetch advanced analytics for this campaign if active
        type AdvancedMetrics = {
          viewerImpressions?: number;
          chatClicks?: number;
          qrScans?: number;
          linkClicks?: number;
          totalClicks?: number;
          viewerEngagementRate?: number;
        };
        let advancedMetrics: AdvancedMetrics = {};
        if (campaignData.status === 'active') {
          try {
            const metricsResponse = await fetch(`/api/analytics/advanced?campaignId=${id}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (metricsResponse.ok) {
              const metricsData = await metricsResponse.json();
              console.log('Fetched advanced metrics:', metricsData);
              advancedMetrics = metricsData;
            } else {
              console.warn('Advanced metrics request failed:', metricsResponse.status, metricsResponse.statusText);
            }
          } catch (analyticsError) {
            console.warn('Could not fetch advanced analytics:', analyticsError);
            // Non-critical error, continue with basic campaign data
          }
        }
        
        // Format the campaign data with advanced metrics if available
        setCampaign({
          id: campaignData._id || campaignData.id || '',
          title: campaignData.title || '',
          description: campaignData.description || '',
          brandName: campaignData.brandName || '',
          brandId: campaignData.brandId || '',
          brandLogo: campaignData.brandLogo || null,
          mediaUrl: campaignData.mediaUrl || '',
          mediaType: campaignData.mediaType || 
            (campaignData.mediaUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image' : 'video'),
          budget: campaignData.budget || 0,
          remainingBudget: campaignData.remainingBudget || campaignData.budget || 0,
          paymentRate: campaignData.paymentRate || 0,
          paymentType: campaignData.paymentType || 'cpm',
          categories: campaignData.categories || [],
          languages: campaignData.languages || [],
          status: campaignData.status || 'draft',
          activeStreamers: campaignData.activeStreamers || 0,
          
          // Traditional metrics
          impressions: campaignData.impressions || 0,
          clicks: campaignData.clicks || 0,
          ctr: campaignData.ctr || 0,
          
          // Advanced metrics if available
          viewerImpressions: advancedMetrics?.viewerImpressions,
          chatClicks: advancedMetrics?.chatClicks,
          qrScans: advancedMetrics?.qrScans,
          linkClicks: advancedMetrics?.linkClicks,
          totalClicks: advancedMetrics?.totalClicks,
          viewerEngagementRate: advancedMetrics?.viewerEngagementRate,
          
          // Dates
          startDate: campaignData.startDate || null,
          endDate: campaignData.endDate || null,
          createdAt: campaignData.createdAt || null
        });
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setError('Failed to load campaign details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id && status !== 'loading') {
      fetchCampaign();
    }
  }, [id, status]);

  const updateCampaignStatus = async (newStatus: CampaignStatus) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(false);
      
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update campaign status: ${response.status}`);
      }
      
      await response.json();
      
      // Update local state with new campaign data
      setCampaign((prev): Campaign | null => {
         if (!prev) return null;
         return {
           ...prev,
           status: String(newStatus) as Campaign['status'],
         };
       });
      
      setUpdateSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update campaign status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivateCampaign = () => {
    updateCampaignStatus(CampaignStatus.ACTIVE);
  };

  const handlePauseCampaign = () => {
    updateCampaignStatus(CampaignStatus.PAUSED);
  };

  const handleResumeCampaign = () => {
    updateCampaignStatus(CampaignStatus.ACTIVE);
  };

  const handleJoinCampaign = async () => {
    if (!id) return;
    try {
      setJoinLoading(true);
      setJoinError(null);
      setJoinSuccess(false);
      const resp = await fetch('/api/campaigns/join', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ campaignId: String(id) }),
       });
       if (!resp.ok) {
        let data: { message?: string } = {};
        try { data = await resp.json(); } catch {}
        throw new Error(data?.message || 'Failed to join campaign');
       }
      setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 3000);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Failed to join campaign');
    } finally {
      setJoinLoading(false);
    }
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        
        <div className="bg-destructive/10 text-destructive rounded-md p-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Campaign not found
  if (!campaign) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Campaign Not Found</h3>
          <p className="text-muted-foreground">
            The campaign you are looking for does not exist or you don&apos;t have permission to view it.
          </p>
        </div>
      </div>
    );
  }
  
  // Format the payment display
  const getPaymentDisplay = () => {
    if (campaign.paymentType === "cpm") {
      return `${formatCurrency(campaign.paymentRate)} per 1,000 impressions`;
    } else {
      return `${formatCurrency(campaign.paymentRate)} fixed rate per stream`;
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-2"
        >
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
              {campaign.categories.map((category, index) => (
                <span key={index} className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {category}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {showActivateButton && (
              <Button 
                onClick={handleActivateCampaign}
                disabled={isUpdating}
              >
                <Play className="h-4 w-4 mr-2" />
                Activate Campaign
              </Button>
            )}
            
            {showPauseButton && (
              <Button 
                variant="outline"
                onClick={handlePauseCampaign}
                disabled={isUpdating}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Campaign
              </Button>
            )}
            
            {showResumeButton && (
              <Button 
                onClick={handleResumeCampaign}
                disabled={isUpdating}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Campaign
              </Button>
            )}
            
            {userCanEdit && (
              <Button
                variant="outline"
                asChild
              >
                <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Status update messages */}
      {updateSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5" />
          <p className="text-sm">Campaign status updated successfully!</p>
        </div>
      )}
      
      {updateError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <p className="text-sm">{updateError}</p>
        </div>
      )}

      {joinSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5" />
          <p className="text-sm">You have joined this campaign successfully.</p>
        </div>
      )}
      {joinError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <p className="text-sm">{joinError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main campaign information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign media */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {campaign.mediaUrl && (
                <>
                  {(campaign.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || campaign.mediaType === 'image') && (
                    <Image 
                      src={campaign.mediaUrl} 
                      alt={campaign.title} 
                      fill 
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  
                  {(campaign.mediaUrl.match(/\.(mp4|webm|ogg)$/i) || campaign.mediaType === 'video') && (
                    <video
                      src={campaign.mediaUrl}
                      controls
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}
                </>
              )}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Details</h3>
              <p className="text-muted-foreground mb-4">{campaign.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Brand</h4>
                  <p>{campaign.brandName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Payment</h4>
                  <p>{getPaymentDisplay()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Duration</h4>
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    {campaign.categories.map((category, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Languages</h4>
                  <div className="flex flex-wrap gap-1">
                    {campaign.languages && campaign.languages.length > 0 ? (
                      campaign.languages.map((language, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                          {language}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No language restrictions</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Campaign status info and explanation */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Campaign Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  campaign.status === 'active' ? 'bg-green-500' :
                  campaign.status === 'paused' ? 'bg-yellow-500' :
                  campaign.status === 'draft' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="font-medium">
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
              
              <div className="bg-muted/50 rounded-md p-4 text-sm">
                {campaign.status === 'draft' && (
                  <>
                    <p className="font-medium mb-2">Your campaign is currently in draft status</p>
                    <p className="text-muted-foreground">
                      This campaign is not yet visible to streamers. To make it available for streamers to join, 
                      click the &quot;Activate Campaign&quot; button. Once activated, streamers will be able to discover and join your campaign.
                    </p>
                  </>
                )}
                
                {campaign.status === 'active' && (
                  <>
                    <p className="font-medium mb-2">Your campaign is active and available to streamers</p>
                    <p className="text-muted-foreground">
                      Streamers can discover and join this campaign. Your budget will be used as streamers participate. 
                      You can pause the campaign at any time to temporarily stop new streamers from joining.
                    </p>
                  </>
                )}
                
                {campaign.status === 'paused' && (
                  <>
                    <p className="font-medium mb-2">Your campaign is currently paused</p>
                    <p className="text-muted-foreground">
                      While paused, no new streamers can join your campaign. Existing streamers who have already joined 
                      can continue to run your ads. You can resume the campaign at any time.
                    </p>
                  </>
                )}
                
                {campaign.status === 'completed' && (
                  <>
                    <p className="font-medium mb-2">Your campaign has been completed</p>
                    <p className="text-muted-foreground">
                      This campaign has run its course and is no longer active. You can view its performance metrics
                      but can&apos;t modify or restart it.
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Campaign stats and details sidebar */}
        <div className="space-y-6">
          {/* Budget card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Budget</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(campaign.budget)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                <p className="text-xl">{formatCurrency(campaign.remainingBudget)}</p>
                
                {/* Budget progress bar */}
                <div className="h-2 w-full bg-muted rounded-full mt-2">
                  <div 
                    className="h-2 bg-primary rounded-full" 
                    style={{ width: `${Math.max(0, Math.min(100, (campaign.remainingBudget / campaign.budget) * 100))}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((campaign.remainingBudget / campaign.budget) * 100)}% remaining
                </p>
              </div>
            </div>
          </Card>
          
          {/* Performance card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance</h3>
            
            {/* Show message for campaigns with no activity yet */}
            {campaign.status === 'draft' && (
              <div className="bg-muted/50 rounded-md p-4 mb-4 text-sm">
                <p className="text-muted-foreground">
                  Performance metrics will appear here once your campaign is activated and streamers begin participating.
                </p>
              </div>
            )}
            
            {campaign.status === 'active' && !campaign.activeStreamers && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-sm">
                <p className="text-blue-800">
                  Your campaign is active but no streamers have joined yet. Metrics will update as streamers participate.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Streamers</p>
                  <p className="text-xl font-medium flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {campaign.activeStreamers || 0}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-1">
                    <p className="text-sm text-muted-foreground mr-1">Viewer Impressions</p>
                    <HelpCircle 
                      className="h-3 w-3 text-muted-foreground cursor-help" 
                    />
                  </div>
                  <p className="text-xl font-medium flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {(campaign.viewerImpressions || campaign.impressions || 0).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <p className="text-sm text-muted-foreground mr-1">Total Interactions</p>
                    <HelpCircle 
                      className="h-3 w-3 text-muted-foreground cursor-help" 
                    />
                  </div>
                  <p className="text-xl font-medium flex items-center">
                    <MousePointer className="h-4 w-4 mr-1" />
                    {(campaign.totalClicks || campaign.clicks || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                <p className="text-xl font-medium">
                  {campaign.viewerEngagementRate !== undefined
                    ? `${campaign.viewerEngagementRate.toFixed(2)}%`
                    : (campaign.impressions && campaign.totalClicks)
                      ? `${((campaign.totalClicks / campaign.impressions) * 100).toFixed(2)}%`
                      : campaign.impressions
                        ? `${((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2)}%`
                        : '0.00%'
                  }
                </p>
              </div>

              {(campaign.chatClicks || campaign.qrScans || campaign.linkClicks) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Engagement Breakdown</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {campaign.chatClicks !== undefined && (
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <p className="font-medium">Chat</p>
                        <p>{campaign.chatClicks}</p>
                      </div>
                    )}
                    {campaign.qrScans !== undefined && (
                      <div className="bg-green-50 p-2 rounded text-center">
                        <p className="font-medium">QR</p>
                        <p>{campaign.qrScans}</p>
                      </div>
                    )}
                    {campaign.linkClicks !== undefined && (
                      <div className="bg-purple-50 p-2 rounded text-center">
                        <p className="font-medium">Links</p>
                        <p>{campaign.linkClicks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Actions card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {userCanEdit && (
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  asChild
                >
                  <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                    Edit Details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              
              {userCanEdit && campaign.status === 'active' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  asChild
                >
                  <Link href={`/dashboard/analytics/campaign/${campaign.id}`}>
                    View Analytics
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              
              {userRole === UserRole.STREAMER && campaign.status === 'active' && (
                <>
                <Button 
                  className="w-full justify-between"
                  onClick={handleJoinCampaign}
                  disabled={joinLoading}
                >
                  Join Campaign
                  <ChevronRight className="h-4 w-4" />
                </Button>
              
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  asChild
                >
                  <Link href={`/dashboard/analytics/campaign/${campaign.id}`}>
                    View Analytics
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
