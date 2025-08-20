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

// Activity type definitions
export type RPActivityType = keyof typeof RP_REWARDS;
