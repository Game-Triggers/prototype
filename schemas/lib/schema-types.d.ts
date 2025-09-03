/**
 * This file contains types and enums to be used across both client and server.
 * It should NOT include any server-only code like Mongoose models.
 */
export declare enum UserRole {
    STREAMER = "streamer",
    BRAND = "brand",
    ADMIN = "admin"
}
export declare enum AuthProvider {
    TWITCH = "twitch",
    YOUTUBE = "youtube",
    EMAIL = "email"
}
export declare enum CampaignStatus {
    DRAFT = "draft",
    PENDING = "pending",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REJECTED = "rejected"
}
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video"
}
export declare enum ParticipationStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    REJECTED = "rejected",
    COMPLETED = "completed",
    LEFT_EARLY = "left_early",
    REMOVED = "removed",
    PARTICIPATION_PAUSED = "participation_paused"
}
export interface IUserData {
    _id?: string;
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
    isActive?: boolean;
    overlaySettings?: {
        position?: string;
        size?: string;
        opacity?: number;
        backgroundColor?: string;
    };
    overlayToken?: string;
    overlayLastSeen?: Date;
    overlayActive?: boolean;
    campaignSelectionStrategy?: string;
    campaignRotationSettings?: {
        preferredStrategy: 'fair-rotation' | 'weighted' | 'time-rotation' | 'performance' | 'revenue-optimized';
        rotationIntervalMinutes: number;
        priorityWeights: {
            paymentRate: number;
            performance: number;
            fairness: number;
        };
        blackoutPeriods?: Array<{
            startTime: string;
            endTime: string;
            days: string[];
        }>;
    };
    testCampaign?: {
        title: string;
        mediaUrl: string;
        mediaType: string;
        testMode: boolean;
        expiresAt: Date;
    };
    streakCurrent?: number;
    streakLongest?: number;
    streakLastDate?: Date | null;
    streakHistory?: Date[];
    energyPacks?: {
        current: number;
        maximum: number;
        lastReset: Date;
        dailyUsed: number;
    };
    xp?: {
        total: number;
        level: number;
        earnedToday: number;
        lastEarned: Date | null;
        activities: Array<{
            type: string;
            amount: number;
            earnedAt: Date;
        }>;
    };
    rp?: {
        total: number;
        earnedToday: number;
        lastEarned: Date | null;
        activities: Array<{
            type: string;
            amount: number;
            earnedAt: Date;
        }>;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ICampaignData {
    _id?: string;
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
    submittedForReviewAt?: Date;
    approvedAt?: Date;
    approvedBy?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionReason?: string;
    gKeyCooloffHours?: number;
    completedAt?: Date;
    completionReason?: 'impressions_target_reached' | 'manual_completion' | 'campaign_ended' | 'budget_exhausted';
    finalEarningsTransferred?: boolean;
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
    ctr?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ICampaignParticipationData {
    _id?: string;
    campaignId: string;
    streamerId: string;
    status: ParticipationStatus;
    impressions: number;
    clicks: number;
    uniqueViewers: number;
    chatClicks: number;
    qrScans: number;
    linkClicks: number;
    lastStreamDate?: Date;
    totalStreamMinutes: number;
    avgViewerCount: number;
    peakViewerCount: number;
    estimatedEarnings: number;
    browserSourceUrl: string;
    browserSourceToken: string;
    joinedAt: Date;
    leftAt?: Date;
    pausedAt?: Date;
    resumedAt?: Date;
    removedAt?: Date;
    removedBy?: string;
    completedAt?: Date;
    completionReason?: 'impressions_target_reached' | 'manual_completion' | 'campaign_ended' | 'budget_exhausted';
    finalEarnings?: number;
    earningsTransferredAt?: Date;
    finalEarningsTransferred?: boolean;
    removalReason?: 'violation' | 'fraud' | 'admin_decision' | 'brand_decision';
    earningsForfeited?: boolean;
    trackingUrl?: string;
    qrCodeUrl?: string;
    chatCommand?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=schema-types.d.ts.map