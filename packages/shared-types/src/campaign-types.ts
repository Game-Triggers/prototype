// Extract from lib/schema-types.ts
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
    IMGAGE = 'image',
    VIDEO = 'video',
}

export enum ParticipationStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
    LEFT_EARLY = 'left_early',
    REMOVED = 'removed',
    PARTICIPATION_PAUSED = 'participation_paused',
}

export interface ICampaignData {
    _id?: string;
    title: string;
    description?: string;
    brandId: string;
    budget: number;
    remainingBudget?: number;
    mediaUrl: string;
    mediaType: MediaType;
    status: CampaignStatus;
    categories?: string[];
    languages?: string[];
    startDate?: Date;
    endDate?: Date;
    paymentRate: number; // e.g., amount per stream or per engagement
    paymentType: 'cpm' | 'fixed';
    createdAt?: Date;
    updatedAt?: Date;
}