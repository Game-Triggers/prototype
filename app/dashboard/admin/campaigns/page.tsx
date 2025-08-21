'use client';

import { useSession } from "next-auth/react";
import { formatCurrency as formatPlatformCurrency } from '../../../../lib/currency-config';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Search, 
  AlertTriangle, 
  Filter,
  Trash,
  Edit,
  Eye,
  AlertCircle,
  Play,
  Pause,
  Ban,
  Video
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

interface CampaignData {
  _id: string;
  title: string;
  brandId: string;
  brandName: string;
  status: CampaignStatus;
  budget: number;
  remainingBudget: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  participatingStreamers: number;
  impressions: number;
  clicks: number;
}

interface CampaignFilterOptions {
  status?: CampaignStatus;
  search?: string;
  brandId?: string;
  page: number;
  limit: number;
}

export default function AdminCampaigns() {
  const { data: session } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [filterOptions, setFilterOptions] = useState<CampaignFilterOptions>({
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSuccess(null); // Clear success message on new fetch

        // Build query string from filter options
        const queryParams = new URLSearchParams();
        if (filterOptions.status) queryParams.append('status', filterOptions.status);
        if (filterOptions.search) queryParams.append('search', filterOptions.search);
        if (filterOptions.brandId) queryParams.append('brandId', filterOptions.brandId);
        queryParams.append('page', filterOptions.page.toString());
        queryParams.append('limit', filterOptions.limit.toString());

        // Fetch campaigns with applied filters using admin proxy route
        const response = await fetch(`/api/admin/campaigns?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campaigns: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setTotalCampaigns(data.totalCount || 0);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaign data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is logged in and has admin role
    if (session?.user) {
      if (session.user.role === UserRole.ADMIN) {
        fetchCampaigns();
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    }
  }, [session, router, filterOptions]);

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

  // Handle campaign action (actual implementation would be needed for a real application)
  const handleCampaignAction = async (action: string, campaignId: string) => {
    console.log(`Performing action: ${action} on campaign: ${campaignId}`);
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      switch (action) {
        case 'view':
          // View campaign details - redirect to campaign detail page
          router.push(`/dashboard/admin/campaigns/${campaignId}`);
          break;
          
        case 'edit':
          // Edit campaign - redirect to campaign edit page
          router.push(`/dashboard/admin/campaigns/${campaignId}/edit`);
          break;
          
        case 'approve':
        case 'activate':
          // Approve/activate pending campaign
          response = await fetch(`/api/admin/campaigns/${campaignId}/approve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            // Refresh the campaigns list
            setFilterOptions(prev => ({ ...prev })); // Trigger useEffect
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
          response = await fetch(`/api/admin/campaigns/${campaignId}/pause`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            // Refresh the campaigns list
            setFilterOptions(prev => ({ ...prev })); // Trigger useEffect
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
          response = await fetch(`/api/admin/campaigns/${campaignId}/resume`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            // Refresh the campaigns list
            setFilterOptions(prev => ({ ...prev })); // Trigger useEffect
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
          response = await fetch(`/api/admin/campaigns/${campaignId}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: rejectionReason }),
          });
          if (response.ok) {
            // Refresh the campaigns list
            setFilterOptions(prev => ({ ...prev })); // Trigger useEffect
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
          // Delete campaign (would require confirmation in a real application)
          const confirmed = window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.');
          if (confirmed) {
            response = await fetch(`/api/admin/campaigns/${campaignId}/delete`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              // Refresh the campaigns list
              setFilterOptions(prev => ({ ...prev })); // Trigger useEffect
              setSuccess('Campaign deleted successfully');
              // Auto-clear success message after 3 seconds
              setTimeout(() => setSuccess(null), 3000);
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

  // Get total pages for pagination
  const totalPages = Math.ceil(totalCampaigns / filterOptions.limit);

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground">Moderate and manage all platform campaigns</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Total of {totalCampaigns} campaigns across the platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Success and Error Messages */}
          {success && (
            <div className="mb-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {error && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title..."
                  className="pl-8"
                  value={filterOptions.search || ''}
                  onChange={(e) => setFilterOptions({
                    ...filterOptions,
                    search: e.target.value,
                    page: 1, // Reset to first page on new search
                  })}
                />
              </div>              <Select
                value={filterOptions.status || 'all'}
                onValueChange={(value) => setFilterOptions({
                  ...filterOptions,
                  status: value === 'all' ? undefined : value as CampaignStatus,
                  page: 1,
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={CampaignStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={CampaignStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={CampaignStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={CampaignStatus.PAUSED}>Paused</SelectItem>
                  <SelectItem value={CampaignStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={CampaignStatus.REJECTED}>Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-muted-foreground">Loading campaign data...</p>
            </div>
          ) : error ? (
            <div className="py-10">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-2 overflow-hidden">
                              {campaign.mediaUrl ? (
                                campaign.mediaType === 'image' ? (
                                  <Image src={campaign.mediaUrl} alt={campaign.title} width={40} height={40} className="h-full w-full object-cover" />
                                ) : (
                                  <Video className="h-5 w-5" />
                                )
                              ) : (
                                <Video className="h-5 w-5" />
                              )}
                            </div>
                            {campaign.title}
                          </div>
                        </TableCell>
                        <TableCell>{campaign.brandName}</TableCell>
                        <TableCell>
                          <div>
                            {formatCurrency(campaign.remainingBudget)} 
                            <span className="text-xs text-muted-foreground block">
                              of {formatCurrency(campaign.budget)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{campaign?.impressions?.toLocaleString() || 0} impressions</div>
                            <div className="text-xs text-muted-foreground">{campaign?.clicks?.toLocaleString() || 0} clicks</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleCampaignAction('view', campaign._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCampaignAction('edit', campaign._id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Campaign</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.PENDING) && (
                                <DropdownMenuItem onClick={() => handleCampaignAction('approve', campaign._id)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  <span>Approve & Activate</span>
                                </DropdownMenuItem>
                              )}
                              
                              {campaign.status === CampaignStatus.PENDING && (
                                <DropdownMenuItem onClick={() => handleCampaignAction('reject', campaign._id)} className="text-red-600">
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Reject Campaign</span>
                                </DropdownMenuItem>
                              )}
                              
                              {campaign.status === CampaignStatus.ACTIVE && (
                                <DropdownMenuItem onClick={() => handleCampaignAction('pause', campaign._id)}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  <span>Pause Campaign</span>
                                </DropdownMenuItem>
                              )}
                              
                              {campaign.status === CampaignStatus.PAUSED && (
                                <DropdownMenuItem onClick={() => handleCampaignAction('resume', campaign._id)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  <span>Resume Campaign</span>
                                </DropdownMenuItem>
                              )}
                              
                              {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.PENDING) && (
                                <DropdownMenuItem onClick={() => handleCampaignAction('reject', campaign._id)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Reject Campaign</span>
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCampaignAction('delete', campaign._id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete Campaign</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No campaigns found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {!isLoading && !error && totalPages > 0 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((filterOptions.page - 1) * filterOptions.limit) + 1}-
              {Math.min(filterOptions.page * filterOptions.limit, totalCampaigns)} of {totalCampaigns} campaigns
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOptions({
                  ...filterOptions,
                  page: Math.max(1, filterOptions.page - 1),
                })}
                disabled={filterOptions.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm font-medium">
                Page {filterOptions.page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOptions({
                  ...filterOptions,
                  page: Math.min(totalPages, filterOptions.page + 1),
                })}
                disabled={filterOptions.page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}