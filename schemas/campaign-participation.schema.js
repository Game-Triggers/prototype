"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignParticipation = exports.CampaignParticipationSchema = exports.ParticipationStatus = void 0;
exports.getCampaignParticipationModel = getCampaignParticipationModel;
const mongoose_1 = require("mongoose");
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
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    uniqueViewers: { type: Number, default: 0 },
    chatClicks: { type: Number, default: 0 },
    qrScans: { type: Number, default: 0 },
    linkClicks: { type: Number, default: 0 },
    lastStreamDate: { type: Date },
    totalStreamMinutes: { type: Number, default: 0 },
    avgViewerCount: { type: Number, default: 0 },
    peakViewerCount: { type: Number, default: 0 },
    estimatedEarnings: { type: Number, default: 0 },
    browserSourceUrl: { type: String, required: true },
    browserSourceToken: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
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
    trackingUrl: { type: String },
    qrCodeUrl: { type: String },
    chatCommand: { type: String },
}, { timestamps: true });
campaignParticipationSchema.index({ campaignId: 1 });
campaignParticipationSchema.index({ streamerId: 1 });
campaignParticipationSchema.index({ campaignId: 1, streamerId: 1 }, { unique: true });
campaignParticipationSchema.index({ browserSourceToken: 1 }, { unique: true });
exports.CampaignParticipationSchema = campaignParticipationSchema;
function getCampaignParticipationModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.CampaignParticipation ||
            (0, mongoose_1.model)('CampaignParticipation', campaignParticipationSchema);
    }
    return null;
}
exports.CampaignParticipation = getCampaignParticipationModel();
//# sourceMappingURL=campaign-participation.schema.js.map