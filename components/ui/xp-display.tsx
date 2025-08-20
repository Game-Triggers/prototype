"use client";

import { useState } from "react";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useXP } from "@/lib/contexts/xp-context";


export function XPDisplay() {
  const { data: session } = useSession();
  const { xpData, loading } = useXP();
  const [isHovering, setIsHovering] = useState(false);

  // Don't show for unauthenticated users
  if (!session?.user) {
    return null;
  }

  if (loading || !xpData) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
        <Trophy className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">--</span>
      </div>
    );
  }

  const progress = getXPProgress(xpData.total);
  return (
    <div className="relative">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Trophy className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">{xpData.total}</span>
      </div>

      {isHovering && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-card border rounded-lg shadow-lg z-50 min-w-[280px]">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-500" />
            Experience Points
          </div>
          
          {/* XP Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Total XP</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {xpData.total} XP
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Level {progress.currentLevel}</span>
              <span className="text-xs text-muted-foreground">
                {progress.currentLevelXP}/{progress.nextLevelXP} XP
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.currentLevelXP} XP</span>
                <span>{progress.nextLevelXP} XP to next level</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                />
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Today</span>
                </div>
                <span className="text-muted-foreground">+{xpData.earnedToday} XP</span>
              </div>
              
              <div className="bg-muted/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Trophy className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">Activities</span>
                </div>
                <span className="text-muted-foreground">{xpData.activities.length}</span>
              </div>
            </div>

            {/* Recent Activities */}
            {xpData.activities.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-2 text-muted-foreground">Recent Activities</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {xpData.activities.slice(0, 3).map((activity, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="capitalize">
                        {activity.type.replace('_', ' ')}
                      </span>
                      <span className="text-green-500 font-medium">+{activity.amount} XP</span>
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
function getXPProgress(total: number) {
  // XP levels follow an exponential curve: level n requires n^2 * 100 XP
  // Level 1: 100 XP, Level 2: 400 XP, Level 3: 900 XP, etc.
  
  let currentLevel = 1;
  let totalRequiredForCurrentLevel = 0;
  
  // Find current level
  while (true) {
    const xpRequiredForLevel = currentLevel * currentLevel * 100;
    if (total < xpRequiredForLevel) {
      break;
    }
    totalRequiredForCurrentLevel = xpRequiredForLevel;
    currentLevel++;
  }
  
  // Calculate XP within current level
  const xpInCurrentLevel = total - totalRequiredForCurrentLevel;
  
  // Calculate XP needed for next level
  const nextLevelTotalXP = currentLevel * currentLevel * 100;
  const xpNeededForNextLevel = nextLevelTotalXP - totalRequiredForCurrentLevel;
  
  // Calculate progress percentage
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  
  return {
    currentLevel: currentLevel - 1, // Adjust since we incremented to find the break point
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForNextLevel,
    progressPercentage: Math.max(0, progressPercentage),
    totalRequiredForCurrentLevel
  };
}

