// Key System Constants - Category-based Key Management
// Backend version of key constants

export enum KeyStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  COOLOFF = 'cooloff'
}

export interface KeyCategoryInfo {
  category: string;
  displayName: string;
  description: string;
  color: string;
  defaultCooloffHours: number;
  maxUsagePerDay: number;
}

// Define key categories - aligned with frontend G-Key system
// Each user gets exactly ONE key per category (since they can only join one campaign per category)
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

// Helper functions
export function getCategoryInfo(category: string): KeyCategoryInfo | undefined {
  return KEY_CATEGORIES.find(cat => cat.category === category);
}

export function getAllCategories(): string[] {
  return KEY_CATEGORIES.map(cat => cat.category);
}

export function getDefaultCooloffHours(category: string): number {
  const categoryInfo = getCategoryInfo(category);
  return categoryInfo ? categoryInfo.defaultCooloffHours : 24; // Default to 24 hours if not found
}

export function getMaxUsagePerDay(category: string): number {
  const categoryInfo = getCategoryInfo(category);
  return categoryInfo ? categoryInfo.maxUsagePerDay : 1; // Default to 1 if not found
}
