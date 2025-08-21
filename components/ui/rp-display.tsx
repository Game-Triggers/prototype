"use client";

import { useState } from "react";
import { Shield, Star, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRP } from "@/lib/contexts/rp-context";

export function RPDisplay() {
  const { data: session } = useSession();
  const { rpData, loading } = useRP();
  const [isHovering, setIsHovering] = useState(false);

  // Don't show for unauthenticated users
  if (!session?.user) {
    return null;
  }

  if (loading || !rpData) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
        <Shield className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">--</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Shield className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">{rpData.total}</span>
      </div>

      {isHovering && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-card border rounded-lg shadow-lg z-50 min-w-[280px]">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            Reputation Points
          </div>
          
          {/* RP Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Total RP</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {rpData.total} RP
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Today</span>
                </div>
                <span className="text-muted-foreground">+{rpData.earnedToday} RP</span>
              </div>
              
              <div className="bg-muted/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Activities</span>
                </div>
                <span className="text-muted-foreground">{rpData.activities.length}</span>
              </div>
            </div>

            {/* Recent Activities */}
            {rpData.activities.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-2 text-muted-foreground">Recent Activities</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {rpData.activities.slice(0, 3).map((activity, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="capitalize">
                        {activity.type.replace('_', ' ')}
                      </span>
                      <span className="text-green-500 font-medium">+{activity.amount} RP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
