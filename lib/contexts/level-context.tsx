"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usersApi } from "@/lib/api-client";
import { calculateUserLevel } from "@/lib/level-constants";
import { useXP } from "@/lib/contexts/xp-context";
import { useRP } from "@/lib/contexts/rp-context";

export interface LevelContextData {
  currentLevel: number;
  currentLevelData: {
    level: number;
    title: string;
    description: string;
    badge: string;
    color: string;
    perks: string[];
  } | null;
  nextLevelData: {
    level: number;
    title: string;
    minXP: number;
    minRP: number;
  } | null;
  progressToNext: number;
  canAdvance: boolean;
  missingXP: number;
  missingRP: number;
  loading: boolean;
  checkForLevelUp: () => Promise<void>;
}

const LevelContext = createContext<LevelContextData | undefined>(undefined);

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { xpData } = useXP();
  const { rpData } = useRP();
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState<Omit<LevelContextData, 'loading' | 'checkForLevelUp'> | null>(null);

  const calculateLevel = useCallback(() => {
    if (!xpData || !rpData) return null;

    const totalXP = xpData.total || 0;
    const totalRP = rpData.total || 0;
    
    const levelInfo = calculateUserLevel(totalXP, totalRP);
    
    return {
      currentLevel: levelInfo.currentLevel,
      currentLevelData: levelInfo.currentLevelData,
      nextLevelData: levelInfo.nextLevelData,
      progressToNext: levelInfo.progressToNext,
      canAdvance: levelInfo.canAdvance,
      missingXP: levelInfo.missingXP,
      missingRP: levelInfo.missingRP,
    };
  }, [xpData, rpData]);

  const checkForLevelUp = useCallback(async () => {
    if (!session?.user) return;

    try {
      const result = await usersApi.checkLevelUp() as {
        leveledUp: boolean;
        oldLevel: number;
        newLevel: number;
      };
      
      if (result.leveledUp) {
        // Refresh the level data
        const newLevelInfo = calculateLevel();
        if (newLevelInfo) {
          setLevelData(newLevelInfo);
        }
        
        // Show level up notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levelUp', {
            detail: {
              oldLevel: result.oldLevel,
              newLevel: result.newLevel
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to check for level up:', error);
      // Don't throw the error - just log it and continue
      // This prevents authentication errors from breaking the UI
    }
  }, [session?.user, calculateLevel]);

  useEffect(() => {
    if (!session?.user || !xpData || !rpData) {
      setLoading(false);
      return;
    }

    try {
      const newLevelInfo = calculateLevel();
      if (newLevelInfo) {
        setLevelData(newLevelInfo);
      }
    } catch (error) {
      console.error('Error calculating level data:', error);
    } finally {
      setLoading(false);
    }
  }, [session, xpData, rpData, calculateLevel, checkForLevelUp]);

  // Auto-check for level up when XP or RP changes significantly
  useEffect(() => {
    if (!session?.user || !xpData || !rpData || loading) return;
    
    // Only check if we have meaningful XP/RP values
    const totalXP = xpData.total || 0;
    const totalRP = rpData.total || 0;
    
    if (totalXP === 0 && totalRP === 0) return;
    
    // Small delay to ensure data is updated and avoid rapid successive calls
    const timeoutId = setTimeout(() => {
      // Don't call the API if we're already at max level
      if (levelData?.currentLevel && levelData.currentLevel >= 10) return;
      
      checkForLevelUp();
    }, 2000); // Increased delay to 2 seconds

    return () => clearTimeout(timeoutId);
  }, [xpData?.total, rpData?.total, session?.user, loading, checkForLevelUp, xpData, rpData, levelData?.currentLevel]);

  const contextValue: LevelContextData = {
    currentLevel: levelData?.currentLevel || 1,
    currentLevelData: levelData?.currentLevelData || null,
    nextLevelData: levelData?.nextLevelData || null,
    progressToNext: levelData?.progressToNext || 0,
    canAdvance: levelData?.canAdvance || false,
    missingXP: levelData?.missingXP || 0,
    missingRP: levelData?.missingRP || 0,
    loading,
    checkForLevelUp
  };

  return (
    <LevelContext.Provider value={contextValue}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  const context = useContext(LevelContext);
  if (context === undefined) {
    throw new Error("useLevel must be used within a LevelProvider");
  }
  return context;
}
