/**
 * This file contains types and enums to be used across both client and server.
 * It should NOT include any server-only code like Mongoose models.
 */

// User types
export enum UserRole {
  STREAMER = 'streamer',
  BRAND = 'brand',
  ADMIN = 'admin',
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
<<<<<<< HEAD
  // Admin review fields
  submittedForReviewAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
=======
  gKeyCooloffHours?: number; // Hours for G-Key cooloff period, defaults to 720 (30 days)
  // Campaign completion fields
  completedAt?: Date;
  completionReason?: 'impressions_target_reached' | 'manual_completion' | 'campaign_ended' | 'budget_exhausted';
  finalEarningsTransferred?: boolean;
>>>>>>> adcedc4 (Resolve all merge conflicts - keep energy pack system implementation)
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