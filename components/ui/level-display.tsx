"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLevel } from "@/lib/contexts/level-context";
import { getLevelBadge, getLevelColor } from "@/lib/level-constants";
import { Crown, TrendingUp, Lock, Zap } from "lucide-react";

export function LevelDisplay() {
  const { data: session } = useSession();
  const { 
    currentLevel, 
    currentLevelData, 
    nextLevelData, 
    progressToNext, 
    missingXP,
    missingRP,
    loading 
  } = useLevel();
  const [isHovering, setIsHovering] = useState(false);

  // Don't show for unauthenticated users
  if (!session?.user) {
    return null;
  }

  if (loading || !currentLevelData) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
        <Crown className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">--</span>
      </div>
    );
  }

  const levelColor = getLevelColor(currentLevel);
  const levelBadge = getLevelBadge(currentLevel);

  return (
    <div className="relative">
      <Link
        href="/dashboard/levels"
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Crown className="h-4 w-4" style={{ color: levelColor }} />
        <span className="text-sm font-medium">
          {currentLevel}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {levelBadge}
        </span>
      </Link>

      {isHovering && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-card border rounded-lg shadow-lg z-50 min-w-[320px]">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4" style={{ color: levelColor }} />
            Level {currentLevel} - {currentLevelData.title}
          </div>
          
          {/* Current Level Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{levelBadge}</span>
                <span className="text-sm font-medium">{currentLevelData.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Level {currentLevel}
              </span>
            </div>

            {/* Progress to Next Level */}
            {nextLevelData && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress to Level {nextLevelData.level}</span>
                  <span>{Math.round(progressToNext)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(progressToNext, 100)}%`,
                      backgroundColor: levelColor
                    }}
                  />
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">XP</span>
                </div>
                <span className="text-muted-foreground">Current Level</span>
                {nextLevelData && (
                  <div className="text-xs text-muted-foreground">
                    /{nextLevelData.minXP} needed
                  </div>
                )}
              </div>
              
              <div className="bg-muted/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-green-500" />
                  <span className="font-medium">RP</span>
                </div>
                <span className="text-muted-foreground">Current Level</span>
                {nextLevelData && (
                  <div className="text-xs text-muted-foreground">
                    /{nextLevelData.minRP} needed
                  </div>
                )}
              </div>
            </div>

            {/* Next Level Preview */}
            {nextLevelData && (
              <div className="border-t pt-2">
                <div className="text-xs font-medium mb-1 text-muted-foreground">Next Level</div>
                <div className="flex items-center gap-2">
                  <span>{getLevelBadge(nextLevelData.level)}</span>
                  <span className="text-xs font-medium">{nextLevelData.title}</span>
                </div>
                {missingXP > 0 || missingRP > 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    Need: {missingXP > 0 && `${missingXP} XP`}
                    {missingXP > 0 && missingRP > 0 && ', '}
                    {missingRP > 0 && `${missingRP} RP`}
                  </div>
                ) : (
                  <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Ready to advance!
                  </div>
                )}
              </div>
            )}

            {/* Max Level */}
            {!nextLevelData && (
              <div className="border-t pt-2 text-center">
                <div className="text-xs text-yellow-500 font-medium">
                  🎉 Maximum Level Reached! 🎉
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t">
            <Link
              href="/dashboard/levels"
              className="text-xs text-primary hover:underline"
            >
              View detailed progression →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
