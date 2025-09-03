'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Video,
  StopCircle,
  XCircle,
  DollarSign,
  AlertTriangle,
  Eye,
  TrendingUp,
} from 'lucide-react';
import CampaignCompletionMonitor from './campaign-completion-monitor';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  brandId: string;
  brandName: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget: number;
  spent: number;
  reserved: number;
  impressionTarget: number;
  impressionCount: number;
  clickCount: number;
  participantCount: number;
  createdAt: string;
  endDate?: string;
}

interface FinancialOverview {
  totalBudget: number;
  totalSpent: number;
  totalReserved: number;
  totalEarnings: number;
  impressionRevenue: number;
  clickRevenue: number;
}

export function CampaignManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForceCompleteDialog, setShowForceCompleteDialog] = useState(false);
  const [showForceCancelDialog, setShowForceCancelDialog] = useState(false);
  const [showBudgetOverrideDialog, setShowBudgetOverrideDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  
  // Form states
  const [forceReason, setForceReason] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [budgetReason, setBudgetReason] = useState('');
  const [emergencyAction, setEmergencyAction] = useState<'pause' | 'terminate'>('pause');
  const [emergencyReason, setEmergencyReason] = useState('');

  const searchCampaigns = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/search?query=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.campaigns || []);
    } catch (error) {
      console.error('Failed to search campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaignFinancials = async (campaignId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/financial-overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFinancialOverview(data);
    } catch (error) {
      console.error('Failed to fetch campaign financials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceComplete = async () => {
    if (!selectedCampaign || !forceReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign._id}/force-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: forceReason,
          adminAction: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh campaign data
      setShowForceCompleteDialog(false);
      setForceReason('');
      // Optionally refresh search results
      searchCampaigns();
    } catch (error) {
      console.error('Failed to force complete campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCancel = async () => {
    if (!selectedCampaign || !forceReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign._id}/force-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: forceReason,
          adminAction: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowForceCancelDialog(false);
      setForceReason('');
      searchCampaigns();
    } catch (error) {
      console.error('Failed to force cancel campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetOverride = async () => {
    if (!selectedCampaign || !newBudget || !budgetReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign._id}/override-budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newBudget: parseFloat(newBudget),
          reason: budgetReason,
          adminAction: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowBudgetOverrideDialog(false);
      setNewBudget('');
      setBudgetReason('');
      searchCampaigns();
    } catch (error) {
      console.error('Failed to override budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyControl = async () => {
    if (!selectedCampaign || !emergencyReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign._id}/emergency-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: emergencyAction,
          reason: emergencyReason,
          adminAction: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowEmergencyDialog(false);
      setEmergencyReason('');
      searchCampaigns();
    } catch (error) {
      console.error('Failed to execute emergency control:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercentage = (current: number, target: number) => {
    return target > 0 ? ((current / target) * 100).toFixed(1) + '%' : '0%';
  };

  return (
    <div className="space-y-6">
      {/* Campaign Completion Monitor */}
      <CampaignCompletionMonitor showAllCampaigns={true} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Campaign Management
          </CardTitle>
          <CardDescription>Search and manage campaigns with admin controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by campaign title, brand name, or campaign ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCampaigns()}
            />
            <Button onClick={searchCampaigns} disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((campaign) => (
                    <TableRow key={campaign._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {campaign.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{campaign.brandName}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(campaign.budget)}</div>
                          <div className="text-sm text-gray-500">
                            Spent: {formatCurrency(campaign.spent)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Impressions: {campaign.impressionCount.toLocaleString()} / {campaign.impressionTarget.toLocaleString()}
                          </div>
                          <div>
                            ({formatPercentage(campaign.impressionCount, campaign.impressionTarget)})
                          </div>
                          <div>Clicks: {campaign.clickCount.toLocaleString()}</div>
                          <div>Participants: {campaign.participantCount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            fetchCampaignFinancials(campaign._id);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Campaign Controls: {selectedCampaign.title}</span>
              <div className="flex gap-2">
                {/* Financial Overview Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCampaignFinancials(selectedCampaign._id)}
                  disabled={isLoading}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Financials
                </Button>

                {/* Force Complete Dialog */}
                <Dialog open={showForceCompleteDialog} onOpenChange={setShowForceCompleteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedCampaign.status === 'completed' || selectedCampaign.status === 'cancelled'}
                    >
                      <StopCircle className="h-4 w-4 mr-1" />
                      Force Complete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Force Complete Campaign</DialogTitle>
                      <DialogDescription>
                        This will immediately complete the campaign and process all pending transactions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="force-reason">Reason for Force Completion</Label>
                        <Textarea
                          id="force-reason"
                          value={forceReason}
                          onChange={(e) => setForceReason(e.target.value)}
                          placeholder="Provide a detailed reason for forcing completion..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowForceCompleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleForceComplete} 
                        disabled={!forceReason.trim() || isLoading}
                        variant="destructive"
                      >
                        Force Complete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Force Cancel Dialog */}
                <Dialog open={showForceCancelDialog} onOpenChange={setShowForceCancelDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedCampaign.status === 'completed' || selectedCampaign.status === 'cancelled'}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Force Cancel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Force Cancel Campaign</DialogTitle>
                      <DialogDescription>
                        This will immediately cancel the campaign and refund the remaining budget.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cancel-reason">Reason for Force Cancellation</Label>
                        <Textarea
                          id="cancel-reason"
                          value={forceReason}
                          onChange={(e) => setForceReason(e.target.value)}
                          placeholder="Provide a detailed reason for cancellation..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowForceCancelDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleForceCancel} 
                        disabled={!forceReason.trim() || isLoading}
                        variant="destructive"
                      >
                        Force Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Budget Override Dialog */}
                <Dialog open={showBudgetOverrideDialog} onOpenChange={setShowBudgetOverrideDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Override Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Override Campaign Budget</DialogTitle>
                      <DialogDescription>
                        Change the campaign budget. Current budget: {formatCurrency(selectedCampaign.budget)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-budget">New Budget (₹)</Label>
                        <Input
                          id="new-budget"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newBudget}
                          onChange={(e) => setNewBudget(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget-reason">Reason for Budget Override</Label>
                        <Textarea
                          id="budget-reason"
                          value={budgetReason}
                          onChange={(e) => setBudgetReason(e.target.value)}
                          placeholder="Explain why the budget needs to be changed..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowBudgetOverrideDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBudgetOverride} 
                        disabled={!newBudget || !budgetReason.trim() || isLoading}
                      >
                        Override Budget
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Emergency Control Dialog */}
                <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Emergency
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Emergency Campaign Control</DialogTitle>
                      <DialogDescription>
                        Take immediate emergency action on this campaign
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emergency-action">Emergency Action</Label>
                        <Select value={emergencyAction} onValueChange={(value: 'pause' | 'terminate') => setEmergencyAction(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pause">Pause Campaign</SelectItem>
                            <SelectItem value="terminate">Terminate Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="emergency-reason">Emergency Reason</Label>
                        <Textarea
                          id="emergency-reason"
                          value={emergencyReason}
                          onChange={(e) => setEmergencyReason(e.target.value)}
                          placeholder="Describe the emergency situation..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleEmergencyControl} 
                        disabled={!emergencyReason.trim() || isLoading}
                        variant="destructive"
                      >
                        Execute Emergency Action
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-500">Current Budget</Label>
                <div className="text-2xl font-bold">{formatCurrency(selectedCampaign.budget)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-500">Spent</Label>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedCampaign.spent)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-500">Reserved</Label>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(selectedCampaign.reserved)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-500">Remaining</Label>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedCampaign.budget - selectedCampaign.spent - selectedCampaign.reserved)}
                </div>
              </div>
            </div>

            {financialOverview && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Total Budget</Label>
                      <div className="text-lg font-semibold">{formatCurrency(financialOverview.totalBudget)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Total Spent</Label>
                      <div className="text-lg font-semibold">{formatCurrency(financialOverview.totalSpent)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Total Reserved</Label>
                      <div className="text-lg font-semibold">{formatCurrency(financialOverview.totalReserved)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Total Earnings</Label>
                      <div className="text-lg font-semibold">{formatCurrency(financialOverview.totalEarnings)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Impression Revenue</Label>
                      <div className="text-lg font-semibold">{formatCurrency(financialOverview.impressionRevenue)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Click Revenue</Label>
                      <div className="text-lg font-semibold">{formatCurrency(financialOverview.clickRevenue)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
