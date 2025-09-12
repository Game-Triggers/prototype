export declare enum UserRole {
    STREAMER = "streamer",
    BRAND = "brand",
    ADMIN = "admin",
    MARKETING_HEAD = "marketing_head",
    CAMPAIGN_MANAGER = "campaign_manager",
    ADMIN_BRAND = "admin_brand",
    FINANCE_MANAGER = "finance_manager",
    VALIDATOR_APPROVER = "validator_approver",
    CAMPAIGN_CONSULTANT = "campaign_consultant",
    SALES_REPRESENTATIVE = "sales_representative",
    SUPPORT_2_BRAND = "support_2_brand",
    SUPPORT_1_BRAND = "support_1_brand",
    SUPER_ADMIN = "super_admin",
    ADMIN_EXCHANGE = "admin_exchange",
    PLATFORM_SUCCESS_MANAGER = "platform_success_manager",
    CUSTOMER_SUCCESS_MANAGER = "customer_success_manager",
    CAMPAIGN_SUCCESS_MANAGER = "campaign_success_manager",
    SUPPORT_2_ADMIN = "support_2_admin",
    SUPPORT_1_ADMIN = "support_1_admin",
    INDEPENDENT_PUBLISHER = "independent_publisher",
    ARTISTE_MANAGER = "artiste_manager",
    STREAMER_INDIVIDUAL = "streamer_individual",
    LIAISON_MANAGER = "liaison_manager",
    SUPPORT_2_PUBLISHER = "support_2_publisher",
    SUPPORT_1_PUBLISHER = "support_1_publisher"
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
    submittedForReviewAt?: Date;
    approvedAt?: Date;
    approvedBy?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionReason?: string;
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
