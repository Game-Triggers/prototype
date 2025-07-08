"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletDashboard } from "@/components/wallet/wallet-dashboard";
import { KYCVerification } from "@/components/wallet/kyc-verification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, 
  Shield, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";

interface UserProfile {
  role: 'brand' | 'streamer';
  kycStatus?: 'not_started' | 'pending' | 'approved' | 'rejected';
}

export function WalletPaymentsPage() {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile to determine role
      const userResponse = await fetch('/api/user/profile');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Fetch KYC status
        let kycStatus = 'not_started';
        try {
          const kycResponse = await fetch('/api/kyc/status');
          if (kycResponse.ok) {
            const kycData = await kycResponse.json();
            kycStatus = kycData.status;
          }
        } catch (error) {
          // KYC not found, default to not_started
        }
        
        setUserProfile({
          role: userData.role,
          kycStatus: kycStatus as UserProfile['kycStatus'],
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    if (!userProfile) return '';
    
    if (userProfile.role === 'brand') {
      return 'Manage your campaign budgets, track spending, and monitor wallet balance';
    } else {
      return 'Track your earnings from campaigns, manage wallet funds, and process withdrawals';
    }
  };

  const shouldShowKYCAlert = () => {
    return userProfile?.role === 'streamer' && 
           userProfile?.kycStatus !== 'approved';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load profile</h3>
        <p className="text-gray-500">Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {userProfile.role === 'brand' ? 'Wallet & Payments' : 'Earnings & Wallet'}
        </h1>
        <p className="text-muted-foreground">
          {getWelcomeMessage()}
        </p>
      </div>

      {/* KYC Alert for Streamers */}
      {shouldShowKYCAlert() && (
        <Alert className="border-orange-200 bg-orange-50">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>KYC Verification Required:</strong> Complete your identity verification to enable withdrawals and unlock all features.
            {userProfile.kycStatus === 'rejected' && ' Your previous submission was rejected. Please resubmit with correct information.'}
            {userProfile.kycStatus === 'pending' && ' Your documents are under review. We\'ll notify you once approved.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>{userProfile.role === 'brand' ? 'Wallet & Budget' : 'Wallet & Earnings'}</span>
          </TabsTrigger>
          {userProfile.role === 'streamer' && (
            <TabsTrigger value="kyc" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>KYC Verification</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>{userProfile.role === 'brand' ? 'Spending Analytics' : 'Earnings Analytics'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <WalletDashboard userRole={userProfile.role} />
        </TabsContent>

        {userProfile.role === 'streamer' && (
          <TabsContent value="kyc" className="space-y-4">
            <KYCVerification />
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {userProfile.role === 'brand' ? 'Campaign ROI' : 'Earning Trends'}
                </CardTitle>
                <CardDescription>
                  {userProfile.role === 'brand' ? 'Return on investment' : 'Monthly earning trends'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {userProfile.role === 'brand' ? '+24.5%' : '+15.2%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userProfile.role === 'brand' ? 'vs last quarter' : 'vs last month'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {userProfile.role === 'brand' ? 'Active Campaigns' : 'Active Streams'}
                </CardTitle>
                <CardDescription>
                  {userProfile.role === 'brand' ? 'Currently running' : 'This month'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {userProfile.role === 'brand' ? '8' : '12'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userProfile.role === 'brand' ? '+2 from last month' : '+3 from last month'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {userProfile.role === 'brand' ? 'Avg. Cost per Stream' : 'Avg. Earning per Stream'}
                </CardTitle>
                <CardDescription>
                  Per stream performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{userProfile.role === 'brand' ? '2,450' : '1,850'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userProfile.role === 'brand' ? '-5.2% cost reduction' : '+8.3% improvement'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {userProfile.role === 'brand' ? 'Spending Overview' : 'Earnings Overview'}
              </CardTitle>
              <CardDescription>
                {userProfile.role === 'brand' ? 'Your campaign spending breakdown' : 'Your earnings breakdown by source'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {userProfile.role === 'brand' ? 'Gaming Campaigns' : 'Gaming Streams'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.role === 'brand' ? '65% of total spend' : '70% of total earnings'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{userProfile.role === 'brand' ? '45,600' : '28,400'}</p>
                    <p className="text-sm text-green-600">+12.5%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {userProfile.role === 'brand' ? 'Tech Campaigns' : 'Tech Streams'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.role === 'brand' ? '25% of total spend' : '20% of total earnings'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{userProfile.role === 'brand' ? '17,500' : '8,100'}</p>
                    <p className="text-sm text-blue-600">+8.2%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {userProfile.role === 'brand' ? 'Other Campaigns' : 'Other Streams'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.role === 'brand' ? '10% of total spend' : '10% of total earnings'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{userProfile.role === 'brand' ? '7,020' : '4,050'}</p>
                    <p className="text-sm text-orange-600">+3.1%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
