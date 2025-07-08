'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  Wallet,
  Activity,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface PlatformFinancialData {
  totalVolume: number;
  activeWallets: number;
  reservedFunds: number;
  adminActionsToday: number;
  pendingWithdrawals: number;
  frozenWallets: number;
  flaggedTransactions: number;
  systemHealth: {
    walletSystem: 'healthy' | 'warning' | 'error';
    paymentProcessing: 'operational' | 'degraded' | 'down';
    campaignEngine: 'running' | 'slow' | 'stopped';
  };
  growth: {
    volumeGrowth: number;
    newWalletsThisWeek: number;
  };
}

export function AdminFinancialOverview() {
  const [data, setData] = useState<PlatformFinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/dashboard/financial', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
      case 'slow':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'down':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <p className="text-lg font-medium">Failed to load data</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
            <Button onClick={fetchFinancialData} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Overview</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchFinancialData} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : data ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data.totalVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  {(data?.growth?.volumeGrowth || 0) > 0 ? '+' : ''}{(data?.growth?.volumeGrowth || 0).toFixed(1)}% from last month
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : data ? (
              <>
                <div className="text-2xl font-bold">{data?.activeWallets?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{data?.growth?.newWalletsThisWeek} new this week
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved Funds</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : data ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data.reservedFunds)}</div>
                <p className="text-xs text-muted-foreground">Across active campaigns</p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : data ? (
              <>
                <div className="text-2xl font-bold">{data.adminActionsToday}</div>
                <p className="text-xs text-muted-foreground">Actions performed today</p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                  </div>
                ))}
              </div>
            ) : data ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Wallet System</span>
                  <Badge className={getHealthBadge(data?.systemHealth?.walletSystem || 'unknown')}>
                    {data?.systemHealth?.walletSystem ? 
                      (data.systemHealth.walletSystem.charAt(0).toUpperCase() + data.systemHealth.walletSystem.slice(1)) : 
                      'Unknown'
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Payment Processing</span>
                  <Badge className={getHealthBadge(data?.systemHealth?.paymentProcessing || 'unknown')}>
                    {data?.systemHealth?.paymentProcessing ? 
                      (data.systemHealth.paymentProcessing.charAt(0).toUpperCase() + data.systemHealth.paymentProcessing.slice(1)) : 
                      'Unknown'
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Campaign Engine</span>
                  <Badge className={getHealthBadge(data?.systemHealth?.campaignEngine || 'unknown')}>
                    {data?.systemHealth?.campaignEngine ? 
                      (data.systemHealth.campaignEngine.charAt(0).toUpperCase() + data.systemHealth.campaignEngine.slice(1)) : 
                      'Unknown'
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Frozen Wallets</span>
                  <Badge className={(data?.frozenWallets || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                    {data?.frozenWallets || 0} Active
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Reviews</span>
                  <Badge className={(data?.pendingWithdrawals || 0) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {data?.pendingWithdrawals || 0} Items
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Flagged Transactions</span>
                  <Badge className={(data?.flaggedTransactions || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {data?.flaggedTransactions || 0} Items
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <div className="space-y-3">
                {(data?.frozenWallets || 0) > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {data?.frozenWallets || 0} wallet{(data?.frozenWallets || 0) > 1 ? 's' : ''} frozen
                      </p>
                      <p className="text-xs text-yellow-700">Requires admin attention</p>
                    </div>
                  </div>
                )}
                
                {(data?.flaggedTransactions || 0) > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {data?.flaggedTransactions || 0} transaction{(data?.flaggedTransactions || 0) > 1 ? 's' : ''} flagged
                      </p>
                      <p className="text-xs text-red-700">Manual review needed</p>
                    </div>
                  </div>
                )}

                {(data?.pendingWithdrawals || 0) > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {data?.pendingWithdrawals || 0} withdrawal{(data?.pendingWithdrawals || 0) > 1 ? 's' : ''} pending
                      </p>
                      <p className="text-xs text-blue-700">Awaiting processing</p>
                    </div>
                  </div>
                )}

                {(data?.frozenWallets || 0) === 0 && (data?.flaggedTransactions || 0) === 0 && (data?.pendingWithdrawals || 0) === 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <p className="text-sm text-green-800">All systems operating normally</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">No alerts available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
