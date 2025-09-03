// Key System Constants - Category-based Key Management
// This file defines the key categories and their status management

export enum KeyStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  COOLOFF = 'cooloff'
}

export interface IKey {
  id: string;
  category: string;
  status: KeyStatus;
  lastUsed?: Date;
  cooloffEndsAt?: Date;
  usageCount: number;
  description?: string;
}

export interface KeyCategoryInfo {
  category: string;
  displayName: string;
  description: string;
  color: string;
  defaultCooloffHours: number;
  maxUsagePerDay: number;
}

// Define key categories based on campaign categories - ALIGNED WITH BACKEND
export const KEY_CATEGORIES: KeyCategoryInfo[] = [
  {
    category: "gaming",
    displayName: "Gaming",
    description: "Video games, gaming hardware, and esports",
    color: "#ec4899", // pink-500
    defaultCooloffHours: 360, // 15 days
    maxUsagePerDay: 1
  },
  {
    category: "technology",
    displayName: "Tech",
    description: "Software, hardware, and tech services",
    color: "#8b5cf6", // violet-500
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "lifestyle",
    displayName: "Lifestyle",
    description: "Lifestyle products and services",
    color: "#14b8a6", // teal-500
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "entertainment",
    displayName: "Entertainment",
    description: "Movies, music, books, and entertainment services",
    color: "#a855f7", // purple-500
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "sports",
    displayName: "Sports",
    description: "Sports equipment, events, and athletic services",
    color: "#dc2626", // red-600
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "music",
    displayName: "Music",
    description: "Music instruments, streaming, and audio equipment",
    color: "#7c3aed", // violet-600
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "romance",
    displayName: "Romance",
    description: "Dating services, romantic gifts, and relationship products",
    color: "#e11d48", // rose-600
    defaultCooloffHours: 1440, // 60 days
    maxUsagePerDay: 1
  },
  {
    category: "beauty",
    displayName: "Beauty",
    description: "Cosmetics, skincare, and beauty services",
    color: "#ec4899", // pink-500
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "fashion",
    displayName: "Fashion",
    description: "Clothing, accessories, and fashion brands",
    color: "#f97316", // orange-500
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "food",
    displayName: "Food",
    description: "Food products, restaurants, and culinary services",
    color: "#22c55e", // green-500
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "travel",
    displayName: "Travel",
    description: "Travel services, hotels, and tourism",
    color: "#10b981", // emerald-500
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "education",
    displayName: "Education",
    description: "Educational institutions and learning platforms",
    color: "#0ea5e9", // sky-500
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "fitness",
    displayName: "Fitness",
    description: "Fitness equipment, gyms, and wellness services",
    color: "#06b6d4", // cyan-500
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "business",
    displayName: "Business",
    description: "Business services, B2B products, and professional tools",
    color: "#059669", // emerald-600
    defaultCooloffHours: 1440, // 60 days
    maxUsagePerDay: 1
  },
  {
    category: "art",
    displayName: "Art",
    description: "Art supplies, galleries, and creative services",
    color: "#9333ea", // violet-600
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  // Legacy categories for backward compatibility
  {
    category: "retail",
    displayName: "Retail",
    description: "General retail and consumer goods",
    color: "#3b82f6", // blue-500
    defaultCooloffHours: 720, // 30 days
    maxUsagePerDay: 1
  },
  {
    category: "watches-timepieces",
    displayName: "Watches & Timepieces",
    description: "Watches, clocks, and time-related accessories",
    color: "#f59e0b", // amber-500
    defaultCooloffHours: 2160, // 90 days
    maxUsagePerDay: 1
  },
  {
    category: "automotive",
    displayName: "Automotive",
    description: "Cars, motorcycles, and automotive accessories",
    color: "#ef4444", // red-500
    defaultCooloffHours: 1440, // 60 days
    maxUsagePerDay: 1
  },
  {
    category: "food-beverage",
    displayName: "Food & Beverage",
    description: "Food products, restaurants, and beverages",
    color: "#84cc16", // lime-500
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "fashion-beauty",
    displayName: "Fashion & Beauty",
    description: "Clothing, cosmetics, and personal care",
    color: "#f43f5e", // rose-500
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "health-fitness",
    displayName: "Health & Fitness",
    description: "Healthcare, fitness equipment, and wellness",
    color: "#0891b2", // cyan-600
    defaultCooloffHours: 1440, // 60 days
    maxUsagePerDay: 1
  },
  {
    category: "travel-tourism",
    displayName: "Travel & Tourism",
    description: "Travel services, hotels, and tourism",
    color: "#059669", // emerald-600
    defaultCooloffHours: 1080, // 45 days
    maxUsagePerDay: 1
  },
  {
    category: "finance-insurance",
    displayName: "Finance & Insurance",
    description: "Banking, insurance, and financial services",
    color: "#15803d", // green-700
    defaultCooloffHours: 2160, // 90 days
    maxUsagePerDay: 1
  }
];

// Configuration for key system - ALIGNED WITH BACKEND BUSINESS LOGIC
export const KEY_CONFIG = {
  COOLOFF_CHECK_INTERVAL_MINUTES: 15, // Check for expired cooloffs every 15 minutes
  MAX_KEYS_PER_CATEGORY: 1, // Only one key per category (business requirement)
  AUTO_UNLOCK_ENABLED: true,
  USAGE_RESET_HOUR: 0, // Reset daily usage at midnight
} as const;

// Calculate key status based on usage and cooloff
export function calculateKeyStatus(key: IKey, categoryInfo: KeyCategoryInfo): {
  status: KeyStatus;
  cooloffRemaining?: number; // minutes
  dailyUsageRemaining: number;
  canUse: boolean;
  nextAvailableAt?: Date;
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if key is in cooloff
  if (key.cooloffEndsAt && key.cooloffEndsAt > now) {
    const cooloffRemaining = Math.ceil((key.cooloffEndsAt.getTime() - now.getTime()) / (1000 * 60));
    return {
      status: KeyStatus.COOLOFF,
      cooloffRemaining,
      dailyUsageRemaining: Math.max(0, categoryInfo.maxUsagePerDay - key.usageCount),
      canUse: false,
      nextAvailableAt: key.cooloffEndsAt
    };
  }

  // Reset daily usage if needed (simplified - in real app this would be handled by a cron job)
  const resetUsageCount = (key.lastUsed && key.lastUsed < todayStart) ? 0 : key.usageCount;
  
  // Check daily usage limit
  if (resetUsageCount >= categoryInfo.maxUsagePerDay) {
    const nextReset = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000); // Next day
    return {
      status: KeyStatus.LOCKED,
      dailyUsageRemaining: 0,
      canUse: false,
      nextAvailableAt: nextReset
    };
  }

  return {
    status: KeyStatus.AVAILABLE,
    dailyUsageRemaining: categoryInfo.maxUsagePerDay - resetUsageCount,
    canUse: true
  };
}

// Generate a mock key for each category - ALIGNED WITH BACKEND
export function generateMockKeys(userId: string): IKey[] {
  return KEY_CATEGORIES.map((category) => {
    return {
      id: `key_${category.category}_${userId}`,
      category: category.category,
      status: KeyStatus.AVAILABLE, // All keys start as available
      lastUsed: undefined, // No previous usage
      cooloffEndsAt: undefined, // No cooloff period
      usageCount: 0, // Start with 0 usage (backend starts with 0)
      description: `${category.displayName} key for campaign participation`
    };
  });
}

// Utility function to get category info by category name
export function getCategoryInfo(category: string): KeyCategoryInfo | undefined {
  return KEY_CATEGORIES.find(cat => cat.category === category);
}

// Utility function to format cooloff time
export function formatCooloffTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Activity type definitions for type safety
export type KeySystemActivity = 'KEY_USED' | 'KEY_UNLOCKED' | 'COOLOFF_STARTED' | 'COOLOFF_ENDED';
