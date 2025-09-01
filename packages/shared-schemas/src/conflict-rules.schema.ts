import { Schema, model, Model, models } from 'mongoose';

export enum ConflictType {
  CATEGORY_EXCLUSIVITY = 'category_exclusivity',
  BRAND_EXCLUSIVITY = 'brand_exclusivity',
  COOLDOWN_PERIOD = 'cooldown_period',
  SIMULTANEOUS_LIMIT = 'simultaneous_limit'
}

export enum ConflictSeverity {
  BLOCKING = 'blocking',      // Prevents joining
  WARNING = 'warning',        // Shows warning but allows
  ADVISORY = 'advisory'       // Just logs for analytics
}

export interface IConflictRule {
  _id?: string;
  name: string;
  description: string;
  type: ConflictType;
  severity: ConflictSeverity;
  
  // Rule configuration
  config: {
    // Category exclusivity
    categories?: string[];
    excludedCategories?: string[];
    
    // Brand exclusivity
    brands?: string[];
    excludedBrands?: string[];
    
    // Cooldown configuration
    cooldownPeriodHours?: number;
    cooldownPeriodDays?: number;
    
    // Simultaneous limits
    maxSimultaneousCampaigns?: number;
    maxCampaignsPerCategory?: number;
    
    // Time-based rules
    startTime?: string;  // HH:MM format
    endTime?: string;    // HH:MM format
    days?: string[];     // ['monday', 'tuesday', etc.]
    
    // Geographic restrictions
    regions?: string[];
    excludedRegions?: string[];
  };
  
  // Scope and applicability
  scope: {
    // Apply to specific user roles
    userRoles?: string[];
    // Apply to specific streamers
    streamerIds?: string[];
    // Apply to specific brands
    brandIds?: string[];
    // Apply to campaigns with specific criteria
    campaignCriteria?: {
      minBudget?: number;
      maxBudget?: number;
      paymentTypes?: string[];
      categories?: string[];
    };
  };
  
  // Rule status
  isActive: boolean;
  priority: number;  // Higher number = higher priority
  
  // Metadata
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastApplied?: Date;
  
  // Analytics
  timesTriggered?: number;
  conflictsBlocked?: number;
  conflictsWarned?: number;
}

export interface IConflictViolation {
  _id?: string;
  
  // Violation details
  streamerId: string;
  campaignId: string;
  ruleId: string;
  
  // Conflict information
  conflictType: ConflictType;
  severity: ConflictSeverity;
  message: string;
  
  // Conflicting entities
  conflictingCampaigns?: string[];
  conflictingCategories?: string[];
  conflictingBrands?: string[];
  
  // Resolution
  status: 'pending' | 'resolved' | 'overridden' | 'expired';
  resolvedAt?: Date;
  resolvedBy?: string;
  overrideReason?: string;
  
  // Metadata
  detectedAt: Date;
  metadata?: Record<string, any>;
}

// Schema definitions
const conflictRuleSchema = new Schema<IConflictRule>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: Object.values(ConflictType), 
      required: true 
    },
    severity: { 
      type: String, 
      enum: Object.values(ConflictSeverity), 
      required: true 
    },
    
    config: {
      categories: [{ type: String }],
      excludedCategories: [{ type: String }],
      brands: [{ type: String }],
      excludedBrands: [{ type: String }],
      cooldownPeriodHours: { type: Number },
      cooldownPeriodDays: { type: Number },
      maxSimultaneousCampaigns: { type: Number },
      maxCampaignsPerCategory: { type: Number },
      startTime: { type: String },
      endTime: { type: String },
      days: [{ type: String }],
      regions: [{ type: String }],
      excludedRegions: [{ type: String }]
    },
    
    scope: {
      userRoles: [{ type: String }],
      streamerIds: [{ type: String }],
      brandIds: [{ type: String }],
      campaignCriteria: {
        minBudget: { type: Number },
        maxBudget: { type: Number },
        paymentTypes: [{ type: String }],
        categories: [{ type: String }]
      }
    },
    
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    
    createdBy: { type: String, required: true },
    lastApplied: { type: Date },
    timesTriggered: { type: Number, default: 0 },
    conflictsBlocked: { type: Number, default: 0 },
    conflictsWarned: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const conflictViolationSchema = new Schema<IConflictViolation>(
  {
    streamerId: { type: String, required: true },
    campaignId: { type: String, required: true },
    ruleId: { type: String, required: true },
    
    conflictType: { 
      type: String, 
      enum: Object.values(ConflictType), 
      required: true 
    },
    severity: { 
      type: String, 
      enum: Object.values(ConflictSeverity), 
      required: true 
    },
    message: { type: String, required: true },
    
    conflictingCampaigns: [{ type: String }],
    conflictingCategories: [{ type: String }],
    conflictingBrands: [{ type: String }],
    
    status: { 
      type: String, 
      enum: ['pending', 'resolved', 'overridden', 'expired'],
      default: 'pending'
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
    overrideReason: { type: String },
    
    detectedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Create indexes
conflictRuleSchema.index({ type: 1, isActive: 1 });
conflictRuleSchema.index({ priority: -1 });
conflictRuleSchema.index({ 'scope.userRoles': 1 });
conflictRuleSchema.index({ 'scope.streamerIds': 1 });
conflictRuleSchema.index({ 'scope.brandIds': 1 });

conflictViolationSchema.index({ streamerId: 1, campaignId: 1 });
conflictViolationSchema.index({ ruleId: 1 });
conflictViolationSchema.index({ status: 1 });
conflictViolationSchema.index({ detectedAt: -1 });

// Export schemas
export const ConflictRuleSchema = conflictRuleSchema;
export const ConflictViolationSchema = conflictViolationSchema;

// Model functions
export function getConflictRuleModel(): Model<IConflictRule> {
  if (typeof window === 'undefined') {
    return models.ConflictRule || model<IConflictRule>('ConflictRule', conflictRuleSchema);
  }
  return null as any;
}

export function getConflictViolationModel(): Model<IConflictViolation> {
  if (typeof window === 'undefined') {
    return models.ConflictViolation || model<IConflictViolation>('ConflictViolation', conflictViolationSchema);
  }
  return null as any;
}

// Named exports
export const ConflictRule = getConflictRuleModel();
export const ConflictViolation = getConflictViolationModel();
