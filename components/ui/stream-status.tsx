"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Tv, Users, Globe } from 'lucide-react';

interface StreamStatusProps {
  autoRefresh?: boolean;
}

export const StreamStatus = ({ autoRefresh = true }: StreamStatusProps) => {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [platform, setPlatform] = useState<string>('unknown');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to check stream status
  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
    //   const result = await usersApi.checkStreamStatus();
        
      const response = await fetch('/api/stream-status',{
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure we get fresh data
      });      

      const result = await response.json();

      if (result.success) {
        setIsLive(result.isLive);
        setViewerCount(result.viewerCount);
        setPlatform(result.platform);
        setLastChecked(new Date(result.lastChecked));
      } else {
        setError(result.error || 'Failed to check stream status');
        setIsLive(false);
      }
    } catch (err) {
      console.error('Error checking stream status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh status every 60 seconds
  useEffect(() => {
    checkStatus();
    
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(checkStatus, 60000); // Check every 60 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Get platform icon
  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'twitch':
        return <Tv className="h-4 w-4 mr-1" />;
      case 'youtube':
        return <Tv className="h-4 w-4 mr-1" />;
      default:
        return <Globe className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Stream Status</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkStatus}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <span className="mr-2">Status:</span>
          {loading ? (
            <Badge variant="outline" className="flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking...
            </Badge>
          ) : isLive === true ? (
            <Badge variant="default" className="bg-green-500">Live</Badge>
          ) : isLive === false ? (
            <Badge variant="secondary">Offline</Badge>
          ) : (
            <Badge variant="outline">Unknown</Badge>
          )}
        </div>
        
        <div className="flex items-center">
          <span className="mr-2">Platform:</span>
          <Badge variant="outline" className="flex items-center capitalize">
            {getPlatformIcon()}
            {platform || 'Unknown'}
          </Badge>
        </div>
        
        {isLive && (
          <div className="flex items-center">
            <span className="mr-2">Viewers:</span>
            <Badge variant="outline" className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {viewerCount.toLocaleString()}
            </Badge>
          </div>
        )}
        
        {lastChecked && (
          <div className="text-xs text-gray-500 mt-1">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );
};
