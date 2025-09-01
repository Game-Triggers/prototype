import { Schema, model, Model, models } from 'mongoose';
// Import directly from relative path for compatibility with both Next.js and NestJS
import { ParticipationStatus, ICampaignParticipationData } from '@/packages/shared-types';
import { ICampaignParticipationDocument } from '@/packages/shared-types';

// Re-export the enum for convenience
export { ParticipationStatus };

// Use the updated interface
export interface ICampaignParticipation extends ICampaignParticipationDocument {}

const campaignParticipationSchema = new Schema<ICampaignParticipation>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    streamerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: Object.values(ParticipationStatus), 
      default: ParticipationStatus.ACTIVE 
    },
    // Impression tracking (viewer-based)
    impressions: { type: Number, default: 0 }, // Now represents actual viewer impressions
    clicks: { type: Number, default: 0 },
    // Advanced tracking metrics
    uniqueViewers: { type: Number, default: 0 },
    // Alternative interaction tracking
    chatClicks: { type: Number, default: 0 },
    qrScans: { type: Number, default: 0 },
    linkClicks: { type: Number, default: 0 },
    // Stream activity metrics
    lastStreamDate: { type: Date },
    totalStreamMinutes: { type: Number, default: 0 },
    avgViewerCount: { type: Number, default: 0 },
    peakViewerCount: { type: Number, default: 0 },
    // Financial data
    estimatedEarnings: { type: Number, default: 0 },
    // Original fields
    browserSourceUrl: { type: String, required: true },
    browserSourceToken: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    // Participation state tracking
    leftAt: { type: Date },
    pausedAt: { type: Date },
    resumedAt: { type: Date },
    removedAt: { type: Date },
    removedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    removalReason: { 
      type: String, 
      enum: ['violation', 'fraud', 'admin_decision', 'brand_decision']
    },
    earningsForfeited: { type: Boolean, default: false },
    // Alternative engagement
    trackingUrl: { type: String },
    qrCodeUrl: { type: String },
    chatCommand: { type: String },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
campaignParticipationSchema.index({ campaignId: 1 });
campaignParticipationSchema.index({ streamerId: 1 });
campaignParticipationSchema.index({ campaignId: 1, streamerId: 1 }, { unique: true });
campaignParticipationSchema.index({ browserSourceToken: 1 }, { unique: true });

// Explicitly export the schema for NestJS
export const CampaignParticipationSchema = campaignParticipationSchema;

// Use a function to safely get the CampaignParticipation model
export function getCampaignParticipationModel(): Model<ICampaignParticipation> {
  if (typeof window === 'undefined') {
    return models.CampaignParticipation || 
      model<ICampaignParticipation>('CampaignParticipation', campaignParticipationSchema);
  }
  return null as any;
}

// Define a named export for backward compatibility
export const CampaignParticipation = getCampaignParticipationModel();

// No default export to avoid TypeScript issues