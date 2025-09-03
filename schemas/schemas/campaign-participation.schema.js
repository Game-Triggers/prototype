"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignParticipation = exports.CampaignParticipationSchema = exports.ParticipationStatus = void 0;
exports.getCampaignParticipationModel = getCampaignParticipationModel;
const mongoose_1 = require("mongoose");
// Import directly from relative path for compatibility with both Next.js and NestJS
const schema_types_1 = require("../lib/schema-types");
Object.defineProperty(exports, "ParticipationStatus", { enumerable: true, get: function () { return schema_types_1.ParticipationStatus; } });
const campaignParticipationSchema = new mongoose_1.Schema({
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    streamerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: Object.values(schema_types_1.ParticipationStatus),
        default: schema_types_1.ParticipationStatus.ACTIVE
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
    removedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    removalReason: {
        type: String,
        enum: ['violation', 'fraud', 'admin_decision', 'brand_decision']
    },
    earningsForfeited: { type: Boolean, default: false },
    // Alternative engagement
    trackingUrl: { type: String },
    qrCodeUrl: { type: String },
    chatCommand: { type: String },
    // Completion tracking
    completedAt: { type: Date },
    completionReason: {
        type: String,
        enum: ['impressions_target_reached', 'manual_completion', 'campaign_ended', 'budget_exhausted']
    },
    finalEarnings: { type: Number, default: 0 },
    earningsTransferredAt: { type: Date },
    finalEarningsTransferred: { type: Boolean, default: false },
}, { timestamps: true });
// Create indexes for efficient queries
campaignParticipationSchema.index({ campaignId: 1 });
campaignParticipationSchema.index({ streamerId: 1 });
campaignParticipationSchema.index({ campaignId: 1, streamerId: 1 }, { unique: true });
campaignParticipationSchema.index({ browserSourceToken: 1 }, { unique: true });
// Explicitly export the schema for NestJS
exports.CampaignParticipationSchema = campaignParticipationSchema;
// Use a function to safely get the CampaignParticipation model
function getCampaignParticipationModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.CampaignParticipation ||
            (0, mongoose_1.model)('CampaignParticipation', campaignParticipationSchema);
    }
    return null;
}
// Define a named export for backward compatibility
exports.CampaignParticipation = getCampaignParticipationModel();
// No default export to avoid TypeScript issues
//# sourceMappingURL=campaign-participation.schema.js.map