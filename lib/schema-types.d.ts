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
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video"
}
export declare enum ParticipationStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    REJECTED = "rejected",
    COMPLETED = "completed"
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
    trackingUrl?: string;
    qrCodeUrl?: string;
    chatCommand?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
