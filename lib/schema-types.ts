/**
 * This file contains types and enums to be used across both client and server.
 * It should NOT include any server-only code like Mongoose models.
 */

// User types with Eureka role system
export enum UserRole {
  // Legacy roles for backward compatibility
  STREAMER = 'streamer',
  BRAND = 'brand', 
  ADMIN = 'admin',

  // E1: Brand Portal Roles
  MARKETING_HEAD = 'marketing_head',
  CAMPAIGN_MANAGER = 'campaign_manager',
  ADMIN_BRAND = 'admin_brand',
  FINANCE_MANAGER = 'finance_manager',
  VALIDATOR_APPROVER = 'validator_approver',
  CAMPAIGN_CONSULTANT = 'campaign_consultant',
  SALES_REPRESENTATIVE = 'sales_representative',
  SUPPORT_2_BRAND = 'support_2_brand',
  SUPPORT_1_BRAND = 'support_1_brand',

  // E2: Admin Portal Roles (Internal Exchange)
  SUPER_ADMIN = 'super_admin',
  ADMIN_EXCHANGE = 'admin_exchange',
  PLATFORM_SUCCESS_MANAGER = 'platform_success_manager',
  CUSTOMER_SUCCESS_MANAGER = 'customer_success_manager',
  CAMPAIGN_SUCCESS_MANAGER = 'campaign_success_manager',
  SUPPORT_2_ADMIN = 'support_2_admin',
  SUPPORT_1_ADMIN = 'support_1_admin',

  // E3: Publisher Portal Roles
  INDEPENDENT_PUBLISHER = 'independent_publisher',
  ARTISTE_MANAGER = 'artiste_manager',
  STREAMER_INDIVIDUAL = 'streamer_individual',
  LIAISON_MANAGER = 'liaison_manager',
  SUPPORT_2_PUBLISHER = 'support_2_publisher',
  SUPPORT_1_PUBLISHER = 'support_1_publisher'
}

export enum AuthProvider {
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
  EMAIL = 'email',
}

// Campaign types
export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

// Campaign participation types
export enum ParticipationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  LEFT_EARLY = 'left_early',
  REMOVED = 'removed',
  PARTICIPATION_PAUSED = 'participation_paused',
}

// Interface definitions without Document inheritance
export interface IUserData {
  _id?: string; // MongoDB id
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  authProvider: AuthProvider;
  authProviderId?: string;
  channelUrl?: string;
  category?: string[];
  language?: string[];
  description?: string;
  // Account status
  isActive?: boolean;
  // Overlay settings for streamers
  overlaySettings?: {
    position?: string;
    size?: string;
    opacity?: number;
    backgroundColor?: string;
  };
  overlayToken?: string;
  overlayLastSeen?: Date; // Track when overlay was last active
  overlayActive?: boolean; // Track if overlay is currently active
  campaignSelectionStrategy?: string; // Enhanced: Campaign selection strategy
  campaignRotationSettings?: {
    preferredStrategy: 'fair-rotation' | 'weighted' | 'time-rotation' | 'performance' | 'revenue-optimized';
    rotationIntervalMinutes: number;
    priorityWeights: {
      paymentRate: number;
      performance: number;
      fairness: number;
    };
    blackoutPeriods?: Array<{
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      days: string[];    // ['monday', 'tuesday', etc.]
    }>;
  };
  testCampaign?: {
    title: string;
    mediaUrl: string;
    mediaType: string;
    testMode: boolean;
    expiresAt: Date;
  };
  // Streak tracking fields
  streakCurrent?: number;
  streakLongest?: number;
  streakLastDate?: Date | null;
  streakHistory?: Date[]; // store unique UTC dates of activity (last ~60 days)
  
  // Energy Pack system for campaign joins
  energyPacks?: {
    current: number; // Current available energy packs
    maximum: number; // Maximum energy packs (default 10)
    lastReset: Date; // Last time energy packs were reset (24 hours)
    dailyUsed: number; // How many used today
  };
  
  // XP (Experience Points) system
  xp?: {
    total: number; // Total XP accumulated
    level: number; // Current level based on XP
    earnedToday: number; // XP earned today
    lastEarned: Date | null; // Last time XP was earned
    activities: Array<{
      type: string; // Activity type (e.g., 'signup', 'campaign_complete')
      amount: number; // XP amount earned
      earnedAt: Date; // When it was earned
    }>; // Last 50 XP activities for history
  };
  
  // RP (Reputation Points) system
  rp?: {
    total: number; // Total RP accumulated
    earnedToday: number; // RP earned today
    lastEarned: Date | null; // Last time RP was earned
    activities: Array<{
      type: string; // Activity type (e.g., 'signup', 'campaign_complete')
      amount: number; // RP amount earned
      earnedAt: Date; // When it was earned
    }>; // Last 50 RP activities for history
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICampaignData {
  _id?: string; // MongoDB id
  title: string;
  description?: string;
  brandId: string;
  budget: number;
  remainingBudget: number;
  mediaUrl: string;
  mediaType: MediaType;
  status: CampaignStatus;
  categories?: string[];
  languages?: string[];
  startDate?: Date;
  endDate?: Date;
  paymentRate: number;
  paymentType: 'cpm' | 'fixed';
  // Admin review fields
  submittedForReviewAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  gKeyCooloffHours?: number; // Hours for G-Key cooloff period, defaults to 720 (30 days)
  // Campaign completion fields
  completedAt?: Date;
  completionReason?: 'impressions_target_reached' | 'manual_completion' | 'campaign_ended' | 'budget_exhausted';
  finalEarningsTransferred?: boolean;
  // Analytics properties (computed from participations)
  activeStreamers?: number;
  impressions?: number;
  viewerImpressions?: number;
  clicks?: number;
  chatClicks?: number;
  qrScans?: number;
  linkClicks?: number;
  totalClicks?: number;
  uniqueViewers?: number;
  totalStreamMinutes?: number;
  avgViewerCount?: number;
  peakViewerCount?: number;
  estimatedEarnings?: number;
  engagementRate?: number;
  ctr?: number; // For backward compatibility
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICampaignParticipationData {
  _id?: string; // MongoDB id
  campaignId: string;
  streamerId: string;
  status: ParticipationStatus;
  // Impression tracking (viewer-based)
  impressions: number; // Now represents actual viewer impressions (migrated from viewerImpressions)
  clicks: number;
  // Advanced tracking metrics
  uniqueViewers: number;
  // Alternative interaction tracking
  chatClicks: number;
  qrScans: number;
  linkClicks: number;
  // Stream activity metrics
  lastStreamDate?: Date;
  totalStreamMinutes: number;
  avgViewerCount: number;
  peakViewerCount: number;
  // Financial data
  estimatedEarnings: number;
  // Original fields
  browserSourceUrl: string;
  browserSourceToken: string;
  joinedAt: Date;
  // Participation state tracking
  leftAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  removedAt?: Date;
  removedBy?: string;
  // Campaign completion fields
  completedAt?: Date;
  completionReason?: 'impressions_target_reached' | 'manual_completion' | 'campaign_ended' | 'budget_exhausted';
  finalEarnings?: number;
  earningsTransferredAt?: Date;
  finalEarningsTransferred?: boolean;
  removalReason?: 'violation' | 'fraud' | 'admin_decision' | 'brand_decision';
  earningsForfeited?: boolean;
  // Alternative engagement
  trackingUrl?: string;
  qrCodeUrl?: string;
  chatCommand?: string;
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}