// Level System Constants - 10 Level Progression System
// This file defines the requirements for the 10-level progression system
// that combines both XP and RP to determine user levels

export interface LevelRequirement {
  level: number;
  title: string;
  description: string;
  minXP: number;
  minRP: number;
  badge: string;
  color: string;
  perks: string[];
  icon: string;
}

// Define the 10 levels with their requirements
export const LEVEL_REQUIREMENTS: LevelRequirement[] = [
  {
    level: 1,
    title: "Novice Explorer",
    description: "Welcome to the platform! Start your journey here.",
    minXP: 0,
    minRP: 0,
    badge: "🌱",
    color: "#22c55e", // green-500
    perks: ["Access to basic campaigns", "Standard support"],
    icon: "Sprout"
  },
  {
    level: 2,
    title: "Rising Streamer",
    description: "You're getting the hang of things!",
    minXP: 100,
    minRP: 50,
    badge: "🌿",
    color: "#16a34a", // green-600
    perks: ["Access to intermediate campaigns", "Profile badge", "5% bonus XP"],
    icon: "Leaf"
  },
  {
    level: 3,
    title: "Content Creator",
    description: "Creating engaging content and building reputation.",
    minXP: 300,
    minRP: 150,
    badge: "🎬",
    color: "#3b82f6", // blue-500
    perks: ["Premium campaign access", "Priority support", "10% bonus XP/RP"],
    icon: "Video"
  },
  {
    level: 4,
    title: "Community Builder",
    description: "Building a strong community around your content.",
    minXP: 600,
    minRP: 300,
    badge: "👥",
    color: "#8b5cf6", // violet-500
    perks: ["Featured profile placement", "Early campaign access", "15% bonus XP/RP"],
    icon: "Users"
  },
  {
    level: 5,
    title: "Brand Partner",
    description: "Trusted partner for brand collaborations.",
    minXP: 1000,
    minRP: 500,
    badge: "🤝",
    color: "#f59e0b", // amber-500
    perks: ["Exclusive brand partnerships", "Analytics dashboard", "20% bonus XP/RP"],
    icon: "Handshake"
  },
  {
    level: 6,
    title: "Influence Master",
    description: "Mastering the art of influence and engagement.",
    minXP: 1500,
    minRP: 750,
    badge: "🎯",
    color: "#ef4444", // red-500
    perks: ["Custom campaign negotiations", "Personal account manager", "25% bonus XP/RP"],
    icon: "Target"
  },
  {
    level: 7,
    title: "Platform Expert",
    description: "Expert level understanding of the platform.",
    minXP: 2200,
    minRP: 1100,
    badge: "⭐",
    color: "#dc2626", // red-600
    perks: ["Beta feature access", "Mentorship opportunities", "30% bonus XP/RP"],
    icon: "Star"
  },
  {
    level: 8,
    title: "Digital Champion",
    description: "Champion of digital content and community engagement.",
    minXP: 3000,
    minRP: 1500,
    badge: "🏆",
    color: "#7c3aed", // violet-600
    perks: ["Platform ambassador status", "Event invitations", "35% bonus XP/RP"],
    icon: "Trophy"
  },
  {
    level: 9,
    title: "Elite Influencer",
    description: "Elite tier with exceptional influence and reach.",
    minXP: 4000,
    minRP: 2000,
    badge: "💎",
    color: "#1d4ed8", // blue-700
    perks: ["Elite campaign access", "Revenue sharing program", "40% bonus XP/RP"],
    icon: "Diamond"
  },
  {
    level: 10,
    title: "Legendary Creator",
    description: "The pinnacle of content creation and influence.",
    minXP: 5500,
    minRP: 2750,
    badge: "👑",
    color: "#facc15", // yellow-400
    perks: ["Legendary status", "Maximum benefits", "50% bonus XP/RP", "Platform partnership"],
    icon: "Crown"
  }
];

// Configuration for level requirements (easily changeable)
export const LEVEL_CONFIG = {
  MAX_LEVEL: 10,
  XP_MULTIPLIER: 1.0, // Can be adjusted to make XP requirements easier/harder
  RP_MULTIPLIER: 1.0, // Can be adjusted to make RP requirements easier/harder
  BONUS_XP_ENABLED: true,
  BONUS_RP_ENABLED: true,
} as const;

// Calculate user's current level based on XP and RP
export function calculateUserLevel(totalXP: number, totalRP: number): {
  currentLevel: number;
  currentLevelData: LevelRequirement;
  nextLevelData: LevelRequirement | null;
  progressToNext: number;
  canAdvance: boolean;
  missingXP: number;
  missingRP: number;
} {
  // Apply multipliers to requirements
  const adjustedLevels = LEVEL_REQUIREMENTS.map(level => ({
    ...level,
    minXP: Math.floor(level.minXP * LEVEL_CONFIG.XP_MULTIPLIER),
    minRP: Math.floor(level.minRP * LEVEL_CONFIG.RP_MULTIPLIER)
  }));

  let currentLevel = 1;
  
  // Find the highest level the user qualifies for
  for (let i = adjustedLevels.length - 1; i >= 0; i--) {
    const level = adjustedLevels[i];
    if (totalXP >= level.minXP && totalRP >= level.minRP) {
      currentLevel = level.level;
      break;
    }
  }

  const currentLevelData = adjustedLevels[currentLevel - 1];
  const nextLevelData = currentLevel < LEVEL_CONFIG.MAX_LEVEL ? adjustedLevels[currentLevel] : null;

  let progressToNext = 0;
  let canAdvance = false;
  let missingXP = 0;
  let missingRP = 0;

  if (nextLevelData) {
    const xpProgress = Math.min(totalXP / nextLevelData.minXP, 1);
    const rpProgress = Math.min(totalRP / nextLevelData.minRP, 1);
    
    // Progress is based on the minimum of XP and RP progress (both requirements must be met)
    progressToNext = Math.min(xpProgress, rpProgress) * 100;
    
    canAdvance = totalXP >= nextLevelData.minXP && totalRP >= nextLevelData.minRP;
    missingXP = Math.max(0, nextLevelData.minXP - totalXP);
    missingRP = Math.max(0, nextLevelData.minRP - totalRP);
  }

  return {
    currentLevel,
    currentLevelData,
    nextLevelData,
    progressToNext,
    canAdvance,
    missingXP,
    missingRP
  };
}

// Get level progress including historical data
export function getLevelProgress(totalXP: number, totalRP: number): {
  currentLevel: number;
  completedLevels: LevelRequirement[];
  currentLevelData: LevelRequirement;
  upcomingLevels: LevelRequirement[];
  totalProgress: number;
} {
  const levelInfo = calculateUserLevel(totalXP, totalRP);
  
  const completedLevels = LEVEL_REQUIREMENTS.slice(0, levelInfo.currentLevel - 1);
  const upcomingLevels = LEVEL_REQUIREMENTS.slice(levelInfo.currentLevel);
  const totalProgress = (levelInfo.currentLevel / LEVEL_CONFIG.MAX_LEVEL) * 100;

  return {
    currentLevel: levelInfo.currentLevel,
    completedLevels,
    currentLevelData: levelInfo.currentLevelData,
    upcomingLevels,
    totalProgress
  };
}

// Get bonus percentage based on current level
export function getLevelBonus(currentLevel: number): {
  xpBonus: number;
  rpBonus: number;
} {
  const levelData = LEVEL_REQUIREMENTS.find(l => l.level === currentLevel);
  if (!levelData) return { xpBonus: 0, rpBonus: 0 };

  // Extract bonus percentage from perks
  const bonusText = levelData.perks.find(perk => perk.includes('bonus XP'));
  if (!bonusText) return { xpBonus: 0, rpBonus: 0 };

  const match = bonusText.match(/(\d+)%/);
  const bonus = match ? parseInt(match[1]) : 0;

  return {
    xpBonus: LEVEL_CONFIG.BONUS_XP_ENABLED ? bonus : 0,
    rpBonus: LEVEL_CONFIG.BONUS_RP_ENABLED ? bonus : 0
  };
}

// Utility function to get level color by level number
export function getLevelColor(level: number): string {
  const levelData = LEVEL_REQUIREMENTS.find(l => l.level === level);
  return levelData?.color || "#6b7280"; // gray-500 as fallback
}

// Utility function to get level badge by level number
export function getLevelBadge(level: number): string {
  const levelData = LEVEL_REQUIREMENTS.find(l => l.level === level);
  return levelData?.badge || "🔰"; // beginner badge as fallback
}

// Activity type definitions for type safety
export type LevelSystemActivity = 'LEVEL_UP' | 'LEVEL_MILESTONE';
