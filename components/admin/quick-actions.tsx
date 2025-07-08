'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, BarChart3, DollarSign } from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center justify-center">
          <Link href="/dashboard/admin/users">
            <Users className="h-6 w-6 mb-2" />
            <span>Manage Users</span>
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center justify-center">
          <Link href="/dashboard/admin/campaigns">
            <Video className="h-6 w-6 mb-2" />
            <span>Manage Campaigns</span>
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center justify-center">
          <Link href="/dashboard/analytics">
            <BarChart3 className="h-6 w-6 mb-2" />
            <span>Platform Analytics</span>
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center justify-center">
          <Link href="/dashboard/admin/reports">
            <DollarSign className="h-6 w-6 mb-2" />
            <span>Financial Reports</span>
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center justify-center border-orange-200 bg-orange-50 hover:bg-orange-100">
          <Link href="/dashboard/admin/monetary">
            <DollarSign className="h-6 w-6 mb-2 text-orange-600" />
            <span className="text-orange-600 font-medium">Monetary Controls</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
