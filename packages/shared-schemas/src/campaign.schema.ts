import { Schema, model, Model, models } from 'mongoose';
// Import directly from relative path for compatibility with both Next.js and NestJS
import { CampaignStatus, MediaType, ICampaignData } from '@/packages/shared-types';

// Re-export the enums for convenience
export { CampaignStatus, MediaType };

// Import IUserDocument from our new helpers
import { ICampaignDocument } from '@/packages/shared-types';

export interface ICampaign extends ICampaignDocument {}

const campaignSchema = new Schema<ICampaign>(
  {
    title: { type: String, required: true },
    description: { type: String },
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    budget: { type: Number, required: true },
    remainingBudget: { type: Number, required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { 
      type: String, 
      enum: Object.values(MediaType), 
      required: true 
    },
    status: { 
      type: String, 
      enum: Object.values(CampaignStatus), 
      default: CampaignStatus.DRAFT 
    },
    categories: [{ type: String }],
    languages: [{ type: String }],
    startDate: { type: Date },
    endDate: { type: Date },
    paymentRate: { type: Number, required: true },
    paymentType: { 
      type: String, 
      enum: ['cpm', 'fixed'], 
      required: true 
    },
    // Admin review fields
    submittedForReviewAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
campaignSchema.index({ status: 1 });
campaignSchema.index({ brandId: 1 });
campaignSchema.index({ categories: 1 });
campaignSchema.index({ languages: 1 });

// Export the schema so it can be imported properly with destructuring
export const CampaignSchema = campaignSchema;

// Use a function to safely get the Campaign model
export function getCampaignModel(): Model<ICampaign> {
  if (typeof window === 'undefined') {
    return models.Campaign || model<ICampaign>('Campaign', campaignSchema);
  }
  return null as any;
}

// Define a named export for backward compatibility
export const Campaign = getCampaignModel();

// No default export to avoid TypeScript issues