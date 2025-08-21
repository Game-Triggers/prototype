"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictViolation = exports.ConflictRule = exports.ConflictViolationSchema = exports.ConflictRuleSchema = exports.ConflictSeverity = exports.ConflictType = void 0;
exports.getConflictRuleModel = getConflictRuleModel;
exports.getConflictViolationModel = getConflictViolationModel;
const mongoose_1 = require("mongoose");
var ConflictType;
(function (ConflictType) {
    ConflictType["CATEGORY_EXCLUSIVITY"] = "category_exclusivity";
    ConflictType["BRAND_EXCLUSIVITY"] = "brand_exclusivity";
    ConflictType["COOLDOWN_PERIOD"] = "cooldown_period";
    ConflictType["SIMULTANEOUS_LIMIT"] = "simultaneous_limit";
})(ConflictType || (exports.ConflictType = ConflictType = {}));
var ConflictSeverity;
(function (ConflictSeverity) {
    ConflictSeverity["BLOCKING"] = "blocking";
    ConflictSeverity["WARNING"] = "warning";
    ConflictSeverity["ADVISORY"] = "advisory"; // Just logs for analytics
})(ConflictSeverity || (exports.ConflictSeverity = ConflictSeverity = {}));
// Schema definitions
const conflictRuleSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
const conflictViolationSchema = new mongoose_1.Schema({
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
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
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
exports.ConflictRuleSchema = conflictRuleSchema;
exports.ConflictViolationSchema = conflictViolationSchema;
// Model functions
function getConflictRuleModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.ConflictRule || (0, mongoose_1.model)('ConflictRule', conflictRuleSchema);
    }
    return null;
}
function getConflictViolationModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.ConflictViolation || (0, mongoose_1.model)('ConflictViolation', conflictViolationSchema);
    }
    return null;
}
// Named exports
exports.ConflictRule = getConflictRuleModel();
exports.ConflictViolation = getConflictViolationModel();
//# sourceMappingURL=conflict-rules.schema.js.map