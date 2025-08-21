'use client';

import { useSession } from "next-auth/react";
import { formatCurrency as formatPlatformCurrency } from '../../../../../lib/currency-config';
import { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  MoreVertical, 
  AlertTriangle, 
  Edit,
  AlertCircle,
  Play,
  Pause,
  Ban,
  Video,
  Trash,
  DollarSign,
  Users,
  Eye,
  MousePointer
} from 'lucide-react';
import { UserRole } from '@/schemas/user.schema';

// Campaign status from schema
enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

interface CampaignDetailData {
  _id: string;
  title: string;
  description: string;
  brandId: string;
  brandName: string;
  status: CampaignStatus;
  budget: number;
  remainingBudget: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  participatingStreamers: number;
  activeStreamers?: number;
  impressions: number;
  clicks: number;
  viewerImpressions?: number;
  chatClicks?: number;
  qrScans?: number;
  linkClicks?: number;
  totalClicks?: number;
  engagementRate?: number;
  estimatedEarnings?: number;
  categories: string[];
  languages: string[];
}

export default function AdminCampaignDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<CampaignDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch campaign details using admin proxy route
        const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is logged in and has admin role
    if (session?.user) {
      if (session.user.role === UserRole.ADMIN) {
        if (campaignId) {
          fetchCampaignDetail();
        }
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    }
  }, [session, router, campaignId]);

  // Handle campaign action
  const handleCampaignAction = async (action: string) => {
    if (!campaign) return;
    
    console.log(`Performing action: ${action} on campaign: ${campaign._id}`);
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      switch (action) {
        case 'edit':
          // Edit campaign - redirect to campaign edit page
          router.push(`/dashboard/admin/campaigns/${campaign._id}/edit`);
          break;
          
        case 'approve':
        case 'activate':
          // Approve/activate pending campaign
          response = await fetch(`/api/admin/campaigns/${campaign._id}/approve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            // Refresh the campaign data
            setCampaign(prev => prev ? { ...prev, status: CampaignStatus.ACTIVE } : null);
            setSuccess('Campaign approved and activated successfully');
            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
            console.log('Campaign approved and activated successfully');
          } else {
            const errorData = await response.json();
            setError(`Failed to approve campaign: ${errorData.message || 'Unknown error'}`);
          }
          break;
          
        case 'pause':
          // Pause campaign
          response = await fetch(`/api/admin/campaigns/${campaign._id}/pause`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            // Refresh the campaign data
            setCampaign(prev => prev ? { ...prev, status: CampaignStatus.PAUSED } : null);
            setSuccess('Campaign paused successfully');
            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
            console.log('Campaign paused successfully');
          } else {
            const errorData = await response.json();
            setError(`Failed to pause campaign: ${errorData.message || 'Unknown error'}`);
          }
          break;
          
        case 'resume':
          // Resume paused campaign
          response = await fetch(`/api/admin/campaigns/${campaign._id}/resume`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            // Refresh the campaign data
            setCampaign(prev => prev ? { ...prev, status: CampaignStatus.ACTIVE } : null);
            setSuccess('Campaign resumed successfully');
            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
            console.log('Campaign resumed successfully');
          } else {
            const errorData = await response.json();
            setError(`Failed to resume campaign: ${errorData.message || 'Unknown error'}`);
          }
          break;
          
        case 'reject':
          // Reject campaign with optional reason
          const rejectionReason = window.prompt('Please enter a reason for rejection (optional):');
          response = await fetch(`/api/admin/campaigns/${campaign._id}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: rejectionReason }),
          });
          if (response.ok) {
            // Refresh the campaign data
            setCampaign(prev => prev ? { ...prev, status: CampaignStatus.REJECTED } : null);
            setSuccess('Campaign rejected successfully');
            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
            console.log('Campaign rejected successfully');
          } else {
            const errorData = await response.json();
            setError(`Failed to reject campaign: ${errorData.message || 'Unknown error'}`);
          }
          break;
          
        case 'delete':
          // Delete campaign with confirmation
          const confirmed = window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.');
          if (confirmed) {
            response = await fetch(`/api/admin/campaigns/${campaign._id}/delete`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              setSuccess('Campaign deleted successfully. Redirecting...');
              // Redirect back to campaigns list after successful deletion
              setTimeout(() => {
                router.push('/dashboard/admin/campaigns');
              }, 2000);
              console.log('Campaign deleted successfully');
            } else {
              const errorData = await response.json();
              setError(`Failed to delete campaign: ${errorData.message || 'Unknown error'}`);
            }
          }
          break;
          
        default:
          console.log(`Action ${action} not implemented`);
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      setError(`Failed to perform action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!session) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please sign in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get status badge variant based on campaign status
  const getStatusVariant = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'default';
      case CampaignStatus.DRAFT:
        return 'secondary';
      case CampaignStatus.PENDING:
        return 'secondary';
      case CampaignStatus.PAUSED:
        return 'outline';
      case CampaignStatus.COMPLETED:
        return 'secondary';
      case CampaignStatus.REJECTED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return formatPlatformCurrency(amount);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Campaign not found.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground">Campaign Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant(campaign.status)}>
            {campaign.status.toUpperCase()}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCampaignAction('edit')}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Campaign</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.PENDING) && (
                <DropdownMenuItem onClick={() => handleCampaignAction('approve')}>
                  <Play className="mr-2 h-4 w-4" />
                  <span>Approve & Activate</span>
                </DropdownMenuItem>
              )}
              
              {campaign.status === CampaignStatus.PENDING && (
                <DropdownMenuItem onClick={() => handleCampaignAction('reject')} className="text-red-600">
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Reject Campaign</span>
                </DropdownMenuItem>
              )}
              
              {campaign.status === CampaignStatus.ACTIVE && (
                <DropdownMenuItem onClick={() => handleCampaignAction('pause')}>
                  <Pause className="mr-2 h-4 w-4" />
                  <span>Pause Campaign</span>
                </DropdownMenuItem>
              )}
              
              {campaign.status === CampaignStatus.PAUSED && (
                <DropdownMenuItem onClick={() => handleCampaignAction('resume')}>
                  <Play className="mr-2 h-4 w-4" />
                  <span>Resume Campaign</span>
                </DropdownMenuItem>
              )}
              
              {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.PENDING) && (
                <DropdownMenuItem onClick={() => handleCampaignAction('reject')}>
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Reject Campaign</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleCampaignAction('delete')}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete Campaign</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Success and Error Messages */}
      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Campaign Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(campaign.budget)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(campaign.remainingBudget)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaign.viewerImpressions ?? campaign.impressions ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.viewerImpressions ? 'Viewer-based' : 'Total views'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaign.totalClicks ?? campaign.clicks ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(campaign.impressions ?? campaign.viewerImpressions) > 0 ? 
                `${(((campaign.totalClicks ?? campaign.clicks ?? 0) / (campaign.viewerImpressions ?? campaign.impressions ?? 1)) * 100).toFixed(2)}% CTR` : 
                '0% CTR'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streamers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.activeStreamers ?? campaign.participatingStreamers ?? 0}</div>
            <p className="text-xs text-muted-foreground">Participating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(campaign.estimatedEarnings ?? (campaign.budget - campaign.remainingBudget))}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaign.estimatedEarnings ? 'Est. earnings' : 'Budget used'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Brand</label>
              <p className="text-sm">{campaign.brandName}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{campaign.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{new Date(campaign.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated</label>
                <p className="text-sm">{new Date(campaign.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {campaign.startDate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-sm">{new Date(campaign.startDate).toLocaleDateString()}</p>
                </div>
                {campaign.endDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="text-sm">{new Date(campaign.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}

            {campaign.categories && campaign.categories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categories</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.categories.map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {campaign.languages && campaign.languages.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Languages</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.languages.map((language, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {campaign.mediaUrl ? (
                campaign.mediaType === 'image' ? (
                  <Image 
                    src={campaign.mediaUrl} 
                    alt={campaign.title} 
                    width={400} 
                    height={225} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Video Content</p>
                    <a 
                      href={campaign.mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2"
                    >
                      View Video
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No media available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
