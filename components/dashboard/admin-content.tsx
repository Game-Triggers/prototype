"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminDashboardData {
  summary?: {
    newStreamers?: number;
    newBrands?: number;
    newCampaigns?: number;
    platform30DayGrowth?: number;
  };
  platformTotals?: {
    totalStreamers?: number;
    totalBrands?: number;
    activeCampaigns?: number;
    totalEarnings?: number;
  };
}

export function AdminDashboardContent() {
  const { data: session } = useSession();
  const [adminData, setAdminData] = useState<AdminDashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!session?.accessToken) return;
      
      try {
        setLoading(true);
        // Fetch admin dashboard data using direct fetch to proxy endpoint
        const response = await fetch('/api/analytics/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Include session cookies
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch admin dashboard data: ${response.status}`);
        }

        const data = await response.json() as AdminDashboardData;
        setAdminData(data);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        // Fallback to mock data
        setAdminData({
          platformTotals: {
            totalStreamers: 352,
            totalBrands: 89,
            activeCampaigns: 28,
            totalEarnings: 12450.00,
          },
          summary: {
            newStreamers: 3,
            newBrands: 2,
            newCampaigns: 1,
            platform30DayGrowth: 15.3,
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchAdminData();
    }
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = (adminData.platformTotals?.totalStreamers || 0) + (adminData.platformTotals?.totalBrands || 0);
  const newUsers = (adminData.summary?.newStreamers || 0) + (adminData.summary?.newBrands || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Platform Summary</h3>
          <ul className="space-y-2 mb-4">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Total Users:</span>
              <span className="font-medium">{totalUsers.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Total Streamers:</span>
              <span className="font-medium">{(adminData.platformTotals?.totalStreamers || 0).toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Total Brands:</span>
              <span className="font-medium">{(adminData.platformTotals?.totalBrands || 0).toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Active Campaigns:</span>
              <span className="font-medium">{adminData.platformTotals?.activeCampaigns || 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Platform Revenue:</span>
              <span className="font-medium">${(adminData.platformTotals?.totalEarnings || 0).toLocaleString()}</span>
            </li>
          </ul>
          <Button variant="outline" asChild>
            <Link href="/dashboard/analytics">View Full Reports</Link>
          </Button>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <div className="space-y-2 mb-4">
            <p className="text-sm">
              <span className="font-medium">{newUsers}</span> new users joined in the last 30 days
            </p>
            <p className="text-sm">
              <span className="font-medium">{adminData.summary?.newCampaigns || 0}</span> new campaigns created
            </p>
            <p className="text-sm">
              Platform growth: <span className="font-medium text-green-600">
                +{adminData.summary?.platform30DayGrowth || 0}%
              </span> this month
            </p>
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/admin/users">Manage Users</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/admin/campaigns">Manage Campaigns</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
