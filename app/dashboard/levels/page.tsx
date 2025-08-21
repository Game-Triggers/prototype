"use client";

import { useSession } from "next-auth/react";
import { useLevel } from "@/lib/contexts/level-context";
import { 
  LEVEL_REQUIREMENTS, 
  getLevelBonus,
  LEVEL_CONFIG 
} from "@/lib/level-constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Trophy, 
  Star, 
  TrendingUp, 
  Zap, 
  Target, 
  Gift,
  ChevronRight,
  CheckCircle,
  Lock,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function LevelsPage() {
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

  if (!session?.user) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Level System</h1>
          <p className="text-muted-foreground mt-2">Please sign in to view your level progression</p>
        </div>
      </div>
    );
  }

  if (loading || !currentLevelData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-muted-foreground">Loading level data...</p>
        </div>
      </div>
    );
  }

  const levelBonus = getLevelBonus(currentLevel);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8" style={{ color: currentLevelData.color }} />
            Level System
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your progression through our 10-level advancement system
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Level Settings
          </Link>
        </Button>
      </div>

      {/* Current Level Overview */}
      <Card className="border-2" style={{ borderColor: currentLevelData.color }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {currentLevelData.badge}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Level {currentLevel} - {currentLevelData.title}
                  <Badge style={{ backgroundColor: currentLevelData.color, color: 'white' }}>
                    Current
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentLevelData.description}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: currentLevelData.color }}>
                {Math.round(progressToNext)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Progress
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Level Perks */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Current Level Perks
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentLevelData.perks.map((perk: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {perk}
                </div>
              ))}
            </div>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold">Current XP</div>
              <div className="text-xs text-muted-foreground">Experience Points</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Zap className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold">Current RP</div>
              <div className="text-xs text-muted-foreground">Reputation Points</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <div className="text-lg font-bold">+{levelBonus.xpBonus}%</div>
              <div className="text-xs text-muted-foreground">XP Bonus</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <div className="text-lg font-bold">+{levelBonus.rpBonus}%</div>
              <div className="text-xs text-muted-foreground">RP Bonus</div>
            </div>
          </div>

          {/* Progress to Next Level */}
          {nextLevelData && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Progress to Level {nextLevelData.level}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress to {nextLevelData.title}</span>
                  <span className="font-medium">{Math.round(progressToNext)}%</span>
                </div>
                <Progress 
                  value={progressToNext} 
                  className="h-3"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">XP Requirement</span>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      Progressing to {nextLevelData.minXP}
                    </div>
                    {missingXP > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {missingXP} XP needed
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">RP Requirement</span>
                      <Zap className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      Progressing to {nextLevelData.minRP}
                    </div>
                    {missingRP > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {missingRP} RP needed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Levels Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Levels Overview</CardTitle>
          <CardDescription>
            View all levels, requirements, and rewards in our progression system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {LEVEL_REQUIREMENTS.map((level, index) => {
              const isCompleted = currentLevel > level.level;
              const isCurrent = currentLevel === level.level;
              const isNext = currentLevel + 1 === level.level;

              return (
                <div key={level.level}>
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent 
                      ? 'border-primary bg-primary/5' 
                      : isCompleted 
                        ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' 
                        : 'border-muted bg-muted/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {isCurrent && (
                          <Crown className="h-5 w-5" style={{ color: level.color }} />
                        )}
                        {!isCompleted && !isCurrent && (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                        
                        <div className="text-2xl">{level.badge}</div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Level {level.level} - {level.title}
                            </span>
                            {isCurrent && (
                              <Badge style={{ backgroundColor: level.color, color: 'white' }}>
                                Current
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Completed
                              </Badge>
                            )}
                            {isNext && (
                              <Badge variant="secondary">
                                Next
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {level.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Requirements</div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            {level.minXP} XP
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-green-500" />
                            {level.minRP} RP
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Level Perks */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Level Perks:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {level.perks.map((perk, perkIndex) => (
                          <div key={perkIndex} className="flex items-center gap-2 text-xs">
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            {perk}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {index < LEVEL_REQUIREMENTS.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Level System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current configuration of the level progression system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{LEVEL_CONFIG.MAX_LEVEL}</div>
              <div className="text-xs text-muted-foreground">Maximum Levels</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{LEVEL_CONFIG.XP_MULTIPLIER}x</div>
              <div className="text-xs text-muted-foreground">XP Multiplier</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{LEVEL_CONFIG.RP_MULTIPLIER}x</div>
              <div className="text-xs text-muted-foreground">RP Multiplier</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">
                {LEVEL_CONFIG.BONUS_XP_ENABLED && LEVEL_CONFIG.BONUS_RP_ENABLED ? '✅' : '❌'}
              </div>
              <div className="text-xs text-muted-foreground">Bonuses Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
