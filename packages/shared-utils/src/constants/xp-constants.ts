// XP Constants for different activities
export const XP_REWARDS = {
  // User registration and onboarding
  SIGNUP: 10,
  
  // Future activities (can be added later)
  // CAMPAIGN_COMPLETE: 25,
  // DAILY_LOGIN: 5,
  // PROFILE_COMPLETE: 15,
  // FIRST_CAMPAIGN_JOIN: 20,
  // STREAK_MILESTONE: 50,
} as const;

// XP level calculation constants
export const XP_LEVELS = {
  BASE_XP_PER_LEVEL: 100, // Base XP needed for level 2
  LEVEL_MULTIPLIER: 1.5, // Each level requires 1.5x more XP than previous
  MAX_LEVEL: 100, // Maximum level
} as const;

// Calculate XP needed for a specific level
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(XP_LEVELS.BASE_XP_PER_LEVEL * Math.pow(XP_LEVELS.LEVEL_MULTIPLIER, i - 2));
  }
  return totalXP;
}

// Calculate level from total XP
export function getLevelFromXP(xp: number): number {
  if (xp < XP_LEVELS.BASE_XP_PER_LEVEL) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  while (level < XP_LEVELS.MAX_LEVEL && xp >= xpRequired) {
    level++;
    xpRequired = getXPForLevel(level);
  }
  
  return level - 1;
}

// Get XP progress for current level
export function getXPProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercentage: number;
} {
  const currentLevel = getLevelFromXP(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const progressXP = totalXP - currentLevelXP;
  const levelDifference = nextLevelXP - currentLevelXP;
  
  return {
    currentLevel,
    currentLevelXP: progressXP,
    nextLevelXP: levelDifference,
    progressPercentage: levelDifference > 0 ? (progressXP / levelDifference) * 100 : 0,
  };
}

// Activity type definitions
export type XPActivityType = keyof typeof XP_REWARDS;
