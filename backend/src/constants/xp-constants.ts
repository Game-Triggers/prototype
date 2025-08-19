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

// Activity type definitions
export type XPActivityType = keyof typeof XP_REWARDS;
