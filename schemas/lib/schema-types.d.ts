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
<<<<<<< HEAD
    submittedForReviewAt?: Date;
    approvedAt?: Date;
    approvedBy?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionReason?: string;
=======
    gKeyCooloffHours?: number;
>>>>>>> adcedc4 (Resolve all merge conflicts - keep energy pack system implementation)
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
    removalReason?: 'violation' | 'fraud' | 'admin_decision' | 'brand_decision';
    earningsForfeited?: boolean;
    trackingUrl?: string;
    qrCodeUrl?: string;
    chatCommand?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=schema-types.d.ts.map