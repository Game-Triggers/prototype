import { Schema, Model } from 'mongoose';
export declare enum ConflictType {
    CATEGORY_EXCLUSIVITY = "category_exclusivity",
    BRAND_EXCLUSIVITY = "brand_exclusivity",
    COOLDOWN_PERIOD = "cooldown_period",
    SIMULTANEOUS_LIMIT = "simultaneous_limit"
}
export declare enum ConflictSeverity {
    BLOCKING = "blocking",// Prevents joining
    WARNING = "warning",// Shows warning but allows
    ADVISORY = "advisory"
}
export interface IConflictRule {
    _id?: string;
    name: string;
    description: string;
    type: ConflictType;
    severity: ConflictSeverity;
    config: {
        categories?: string[];
        excludedCategories?: string[];
        brands?: string[];
        excludedBrands?: string[];
        cooldownPeriodHours?: number;
        cooldownPeriodDays?: number;
        maxSimultaneousCampaigns?: number;
        maxCampaignsPerCategory?: number;
        startTime?: string;
        endTime?: string;
        days?: string[];
        regions?: string[];
        excludedRegions?: string[];
    };
    scope: {
        userRoles?: string[];
        streamerIds?: string[];
        brandIds?: string[];
        campaignCriteria?: {
            minBudget?: number;
            maxBudget?: number;
            paymentTypes?: string[];
            categories?: string[];
        };
    };
    isActive: boolean;
    priority: number;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastApplied?: Date;
    timesTriggered?: number;
    conflictsBlocked?: number;
    conflictsWarned?: number;
}
export interface IConflictViolation {
    _id?: string;
    streamerId: string;
    campaignId: string;
    ruleId: string;
    conflictType: ConflictType;
    severity: ConflictSeverity;
    message: string;
    conflictingCampaigns?: string[];
    conflictingCategories?: string[];
    conflictingBrands?: string[];
    status: 'pending' | 'resolved' | 'overridden' | 'expired';
    resolvedAt?: Date;
    resolvedBy?: string;
    overrideReason?: string;
    detectedAt: Date;
    metadata?: Record<string, any>;
}
export declare const ConflictRuleSchema: Schema<IConflictRule, Model<IConflictRule, any, any, any, import("mongoose").Document<unknown, any, IConflictRule> & IConflictRule & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IConflictRule, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IConflictRule>> & import("mongoose").FlatRecord<IConflictRule> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare const ConflictViolationSchema: Schema<IConflictViolation, Model<IConflictViolation, any, any, any, import("mongoose").Document<unknown, any, IConflictViolation> & IConflictViolation & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IConflictViolation, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IConflictViolation>> & import("mongoose").FlatRecord<IConflictViolation> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
export declare function getConflictRuleModel(): Model<IConflictRule>;
export declare function getConflictViolationModel(): Model<IConflictViolation>;
export declare const ConflictRule: Model<IConflictRule, {}, {}, {}, import("mongoose").Document<unknown, {}, IConflictRule> & IConflictRule & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare const ConflictViolation: Model<IConflictViolation, {}, {}, {}, import("mongoose").Document<unknown, {}, IConflictViolation> & IConflictViolation & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=conflict-rules.schema.d.ts.map