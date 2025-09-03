'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CampaignCompletionStatus {
  campaignId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  isEligibleForCompletion: boolean;
  completionReason?: string;
  metrics: {
    totalImpressions: number;
    totalClicks: number;
    activeParticipants: number;
    budgetUsedPercentage: string;
    remainingBudget: number;
  };
  criteria: {
    impressionTarget?: number;
    budgetThreshold?: number;
  };
  lastChecked: string;
}

interface CampaignCompletionMonitorProps {
  campaignId?: string;
  showAllCampaigns?: boolean;
}

export default function CampaignCompletionMonitor({
  campaignId,
  showAllCampaigns = false,
}: CampaignCompletionMonitorProps) {
  const [completionStatus, setCompletionStatus] =
    useState<CampaignCompletionStatus | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingCompletion, setCheckingCompletion] = useState(false);

  const fetchCompletionStatus = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/campaigns/${id}/completion-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch completion status: ${response.statusText}`);
      }

      const data = await response.json();
      setCompletionStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch completion status');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/campaigns?adminAccess=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
      }

      const data = await response.json();
      const campaignList = Array.isArray(data) ? data : data.campaigns || [];
      
      // Only show active campaigns for completion monitoring
      const activeCampaigns = campaignList.filter((c: any) => c.status === 'active');
      setCampaigns(activeCampaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const triggerCompletionCheck = async (id?: string) => {
    try {
      setCheckingCompletion(true);
      setError(null);

      const url = id 
        ? `/api/v1/campaigns/${id}/completion-check`
        : '/api/v1/campaigns/completion-check/trigger';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger completion check: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (id && completionStatus) {
        // Refresh the specific campaign status
        await fetchCompletionStatus(id);
      } else if (showAllCampaigns) {
        // Refresh all campaigns
        await fetchAllCampaigns();
      }

      // Show success message
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger completion check');
    } finally {
      setCheckingCompletion(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCompletionStatus(campaignId);
    } else if (showAllCampaigns) {
      fetchAllCampaigns();
    }
  }, [campaignId, showAllCampaigns]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCompletionStatus = (status: CampaignCompletionStatus) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campaign {status.campaignId}</h3>
        <Badge className={getStatusColor(status.status)}>
          {status.status.toUpperCase()}
        </Badge>
      </div>

      {status.isEligibleForCompletion && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Eligible for Completion:</strong> {status.completionReason}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Impressions</p>
          <p className="text-2xl font-bold text-blue-600">
            {status.metrics.totalImpressions.toLocaleString()}
          </p>
          {status.criteria.impressionTarget && (
            <p className="text-xs text-gray-500">
              Target: {status.criteria.impressionTarget.toLocaleString()}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-600">Budget Used</p>
          <p className="text-2xl font-bold text-green-600">
            {status.metrics.budgetUsedPercentage}%
          </p>
          {status.criteria.budgetThreshold && (
            <p className="text-xs text-gray-500">
              Threshold: {status.criteria.budgetThreshold}%
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-600">Active Streamers</p>
          <p className="text-2xl font-bold text-purple-600">
            {status.metrics.activeParticipants}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-600">Remaining Budget</p>
          <p className="text-2xl font-bold text-red-600">
            ${status.metrics.remainingBudget.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Last checked: {new Date(status.lastChecked).toLocaleString()}
        </p>
        <Button
          onClick={() => triggerCompletionCheck(status.campaignId)}
          disabled={checkingCompletion}
          variant="outline"
          size="sm"
        >
          {checkingCompletion ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Check Now
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Campaign Completion Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading completion status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Campaign Completion Monitor
          </div>
          {showAllCampaigns && (
            <Button
              onClick={() => triggerCompletionCheck()}
              disabled={checkingCompletion}
              size="sm"
            >
              {checkingCompletion ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Check All Campaigns
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {campaignId && completionStatus ? (
          renderCompletionStatus(completionStatus)
        ) : showAllCampaigns ? (
          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No active campaigns found.
              </p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign._id} className="border-b last:border-b-0 pb-6 last:pb-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{campaign.title}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Budget</p>
                        <p className="text-lg font-bold text-green-600">
                          ${campaign.budget?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Remaining</p>
                        <p className="text-lg font-bold text-red-600">
                          ${campaign.remainingBudget?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Streamers</p>
                        <p className="text-lg font-bold text-purple-600">
                          {campaign.activeStreamers || 0}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Impressions</p>
                        <p className="text-lg font-bold text-blue-600">
                          {campaign.impressions?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => triggerCompletionCheck(campaign._id)}
                        disabled={checkingCompletion}
                        variant="outline"
                        size="sm"
                      >
                        {checkingCompletion ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Check Completion
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No campaign specified for monitoring.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
