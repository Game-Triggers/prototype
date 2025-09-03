"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  KeyStatus, 
  getCategoryInfo,
  formatCooloffTime
} from "@/lib/key-constants";
import { Clock, Play, Pause, RefreshCw } from "lucide-react";

// Interface for G-Key from backend
interface IGKey {
  _id: string;
  userId: string;
  category: string;
  status: KeyStatus;
  usageCount: number;
  lastUsed?: Date;
  cooloffEndsAt?: Date;
  cooloffTimeRemaining?: number; // Time remaining in milliseconds
  cooloffTimeFormatted?: string; // Human-readable time remaining
  cooloffTimeElapsed?: number; // Time elapsed since cooloff started
  cooloffTimeElapsedFormatted?: string; // Human-readable elapsed time
  completionCount?: number; // Number of times this key has completed campaigns
  lockedWith?: string; // Campaign ID when locked
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for keys summary
interface KeysSummary {
  total: number;
  available: number;
  locked: number;
  cooloff: number;
  categories: {
    [category: string]: {
      total: number;
      available: number;
      locked: number;
      cooloff: number;
    };
  };
}

export default function KeysPage() {
  const [keys, setKeys] = useState<IGKey[]>([]);
  const [summary, setSummary] = useState<KeysSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setError(null);
      
      // Get session to check user role
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (!session?.user) {
        throw new Error('Not authenticated');
      }
      
      // Only streamers have G-Keys
      if (session.user.role !== 'streamer') {
        setUserRole(session.user.role);
        setKeys([]);
        setSummary({
          total: 0,
          available: 0,
          locked: 0,
          cooloff: 0,
          categories: {}
        });
        return;
      }

      setUserRole(session.user.role);

      // Fetch keys summary
      const summaryResponse = await fetch('/api/g-keys?summary=true');
      if (!summaryResponse.ok) {
        throw new Error(`Backend error: ${summaryResponse.status}`);
      }
      const summaryData = await summaryResponse.json();
      setSummary(summaryData);

      // Fetch individual keys
      const keysResponse = await fetch('/api/g-keys');
      if (!keysResponse.ok) {
        throw new Error(`Backend error: ${keysResponse.status}`);
      }
      const keysData = await keysResponse.json();
      setKeys(keysData);
      
    } catch (error) {
      console.error('Error fetching keys:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch keys');
    }
  };  const initializeKeys = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/g-keys', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize keys: ${response.status}`);
      }
      
      // After initialization, fetch keys
      await fetchKeys();
      
    } catch (error) {
      console.error('Error initializing keys:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize keys');
    } finally {
      setLoading(false);
    }
  };

  const refreshKeys = async () => {
    setRefreshing(true);
    await fetchKeys();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadKeys = async () => {
      setLoading(true);
      await fetchKeys();
      setLoading(false);
    };

    loadKeys();
  }, []);

  const getStatusColor = (status: KeyStatus) => {
    switch (status) {
      case KeyStatus.AVAILABLE:
        return "bg-green-500";
      case KeyStatus.LOCKED:
        return "bg-red-500";
      case KeyStatus.COOLOFF:
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: KeyStatus) => {
    switch (status) {
      case KeyStatus.AVAILABLE:
        return <Play className="h-4 w-4" />;
      case KeyStatus.LOCKED:
        return <Pause className="h-4 w-4" />;
      case KeyStatus.COOLOFF:
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCooloffTime = (key: IGKey) => {
    // Use formatted cooloff time from backend if available
    if (key.cooloffTimeFormatted) {
      return key.cooloffTimeFormatted;
    }
    
    // Use cooloffTimeRemaining from backend if available
    if (key.cooloffTimeRemaining !== undefined) {
      if (key.cooloffTimeRemaining <= 0) return "Ready";
      
      const minutesLeft = Math.ceil(key.cooloffTimeRemaining / (1000 * 60));
      return formatCooloffTime(minutesLeft);
    }
    
    // Fallback to client-side calculation
    if (!key.cooloffEndsAt) return "Ready";
    
    const now = new Date();
    const timeDiff = new Date(key.cooloffEndsAt).getTime() - now.getTime();
    
    if (timeDiff <= 0) return "Ready";
    
    const minutesLeft = Math.ceil(timeDiff / (1000 * 60));
    return formatCooloffTime(minutesLeft);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Keys Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Keys Management</h1>
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>
            {error.includes('Backend error: 404') && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  It looks like your keys haven&apos;t been initialized yet.
                </p>
                <Button onClick={initializeKeys} disabled={loading}>
                  Initialize Keys
                </Button>
              </div>
            )}
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Keys Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={refreshKeys} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="secondary" 
            size="sm"
          >
            Force Reload
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">Total Keys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{summary.available}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{summary.locked}</div>
              <p className="text-xs text-muted-foreground">Locked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{summary.cooloff}</div>
              <p className="text-xs text-muted-foreground">Cooloff</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keys Grid */}
      {userRole && userRole !== 'streamer' ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-blue-600 mb-4">ℹ️</div>
            <h3 className="text-lg font-semibold mb-2">G-Keys Not Available</h3>
            <p className="text-muted-foreground">
              G-Keys are only available for streamers. This feature allows streamers to manage their campaign participation across different categories.
            </p>
          </CardContent>
        </Card>
      ) : keys.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No keys found.</p>
            <Button onClick={initializeKeys} disabled={loading}>
              Initialize Keys
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {keys.map((key) => (
            <Card key={key._id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{getCategoryInfo(key.category)?.displayName || key.category}</span>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(key.status)} text-white flex items-center gap-1`}
                  >
                    {getStatusIcon(key.status)}
                    {key.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Completion Count */}
                {key.completionCount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Campaigns Completed</span>
                    <span className="font-medium">{key.completionCount}</span>
                  </div>
                )}

                {/* Cooloff Information */}
                {key.status === KeyStatus.COOLOFF && (
                  <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Cooloff Period
                    </div>
                    
                    {/* Time Remaining */}
                    <div className="text-sm text-yellow-700">
                      <span className="font-medium">Time Remaining: </span>
                      {getCooloffTime(key)}
                    </div>
                    
                    {/* Time Elapsed */}
                    {key.cooloffTimeElapsedFormatted && (
                      <div className="text-sm text-yellow-700">
                        <span className="font-medium">Time in Cooloff: </span>
                        {key.cooloffTimeElapsedFormatted}
                      </div>
                    )}
                  </div>
                )}

                {/* Last Used */}
                {key.lastUsed && (
                  <div className="text-xs text-muted-foreground">
                    Last used: {new Date(key.lastUsed).toLocaleString()}
                  </div>
                )}

                {/* Action Info */}
                <div className="text-sm text-muted-foreground">
                  {key.status === KeyStatus.AVAILABLE && (
                    "Ready to use for campaigns"
                  )}
                  {key.status === KeyStatus.LOCKED && (
                    "Currently locked by active campaign"
                  )}
                  {key.status === KeyStatus.COOLOFF && (
                    "Key will be available after cooloff period ends"
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
