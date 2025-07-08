'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Video,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';

// Import our new admin components
import { WalletManagement } from './wallet-management';
import { CampaignManagement } from './campaign-management';
import { AuditTrailViewer } from './audit-trail-viewer';
import { AdminFinancialOverview } from './admin-financial-overview';

export function AdminMonetaryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Monetary Controls</h1>
          <p className="text-muted-foreground">
            Comprehensive financial management and oversight tools
          </p>
        </div>
        <Badge className="bg-red-100 text-red-800 px-3 py-1">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Administrative Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Management
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Campaign Controls
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminFinancialOverview />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('wallets')}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Search & Manage User Wallets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('campaigns')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Campaign Emergency Controls
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('audit')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Recent Admin Actions
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Controls</CardTitle>
                <CardDescription>Emergency platform controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('/api/admin/reports/audit/export?format=csv', '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Full Audit Log
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm('This will refresh all cached data. Continue?')) {
                      window.location.reload();
                    }
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh System Cache
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm('This will enable emergency mode. Continue?')) {
                      alert('Emergency mode would be implemented here');
                    }
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Mode
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallets">
          <WalletManagement />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTrailViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
