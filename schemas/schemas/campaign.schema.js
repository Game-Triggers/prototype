"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Campaign = exports.CampaignSchema = exports.MediaType = exports.CampaignStatus = void 0;
exports.getCampaignModel = getCampaignModel;
const mongoose_1 = require("mongoose");
// Import directly from relative path for compatibility with both Next.js and NestJS
const schema_types_1 = require("../lib/schema-types");
Object.defineProperty(exports, "CampaignStatus", { enumerable: true, get: function () { return schema_types_1.CampaignStatus; } });
Object.defineProperty(exports, "MediaType", { enumerable: true, get: function () { return schema_types_1.MediaType; } });
const campaignSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    brandId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    budget: { type: Number, required: true },
    remainingBudget: { type: Number, required: true },
    mediaUrl: { type: String, required: true },
    mediaType: {
        type: String,
        enum: Object.values(schema_types_1.MediaType),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(schema_types_1.CampaignStatus),
        default: schema_types_1.CampaignStatus.DRAFT
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
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    gKeyCooloffHours: {
        type: Number,
        default: 720, // Default 30 days (720 hours) if not specified
        min: 1, // Minimum 1 hour
        max: 8760 // Maximum 1 year (365 * 24 hours)
    },
    // Campaign completion fields
    completedAt: { type: Date },
    completionReason: { type: String },
    finalEarningsTransferred: { type: Number, default: 0 },
}, { timestamps: true });
// Create indexes for efficient queries
campaignSchema.index({ status: 1 });
campaignSchema.index({ brandId: 1 });
campaignSchema.index({ categories: 1 });
campaignSchema.index({ languages: 1 });
// Export the schema so it can be imported properly with destructuring
exports.CampaignSchema = campaignSchema;
// Use a function to safely get the Campaign model
function getCampaignModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.Campaign || (0, mongoose_1.model)('Campaign', campaignSchema);
    }
    return null;
}
// Define a named export for backward compatibility
exports.Campaign = getCampaignModel();
// No default export to avoid TypeScript issues
//# sourceMappingURL=campaign.schema.js.map