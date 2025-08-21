// RP Constants for different activities
export const RP_REWARDS = {
  // User registration and onboarding
  SIGNUP: 5,

  // Future activities (can be added later)
  // CAMPAIGN_COMPLETE: 15,
  // DAILY_LOGIN: 2,
  // PROFILE_COMPLETE: 8,
  // FIRST_CAMPAIGN_JOIN: 12,
  // STREAK_MILESTONE: 25,
  // REFERRAL_COMPLETE: 30,
  // QUALITY_ENGAGEMENT: 10,
} as const;

// RP level calculation constants
export const RP_LEVELS = {
  BASE_RP_PER_LEVEL: 50, // Base RP needed for level 2
  LEVEL_MULTIPLIER: 1.3, // Each level requires 1.3x more RP than previous
  MAX_LEVEL: 100, // Maximum level
} as const;

// Calculate RP needed for a specific level
export function getRPForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalRP = 0;
  for (let i = 2; i <= level; i++) {
    totalRP += Math.floor(
      RP_LEVELS.BASE_RP_PER_LEVEL * Math.pow(RP_LEVELS.LEVEL_MULTIPLIER, i - 2),
    );
  }
  return totalRP;
}

// Calculate level from total RP
export function getLevelFromRP(rp: number): number {
  if (rp < RP_LEVELS.BASE_RP_PER_LEVEL) return 1;

  let level = 1;
  let rpRequired = 0;

  while (level < RP_LEVELS.MAX_LEVEL && rp >= rpRequired) {
    level++;
    rpRequired = getRPForLevel(level);
  }

  return level - 1;
}

// Get RP progress for current level
export function getRPProgress(totalRP: number): {
  currentLevel: number;
  currentLevelRP: number;
  nextLevelRP: number;
  progressPercentage: number;
} {
  const currentLevel = getLevelFromRP(totalRP);
  const currentLevelRP = getRPForLevel(currentLevel);
  const nextLevelRP = getRPForLevel(currentLevel + 1);
  const progressRP = totalRP - currentLevelRP;
  const levelDifference = nextLevelRP - currentLevelRP;

  return {
    currentLevel,
    currentLevelRP: progressRP,
    nextLevelRP: levelDifference,
    progressPercentage:
      levelDifference > 0 ? (progressRP / levelDifference) * 100 : 0,
  };
}

// Activity type definitions
export type RPActivityType = keyof typeof RP_REWARDS;
