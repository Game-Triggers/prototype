'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Bell, ArrowRight } from 'lucide-react';
import type { RecentActivityData } from './admin-content';

interface RecentActivityProps {
  activities: RecentActivityData[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            <div className="divide-y">
              {activities.map((activity) => (
                <div key={activity.id} className="py-3 flex items-start">
                  <div className="mr-4">
                    {activity.type === 'user_signup' && (
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                    )}
                    {activity.type === 'campaign_created' && (
                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                        <Video className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                    )}
                    {activity.type === 'campaign_joined' && (
                      <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.entityName} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No recent activity found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
