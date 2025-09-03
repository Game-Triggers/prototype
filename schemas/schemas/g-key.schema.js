"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GKeySchema = void 0;
const mongoose_1 = require("mongoose");
exports.GKeySchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    status: {
        type: String,
        enum: ['available', 'locked', 'cooloff'],
        default: 'available'
    },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date },
    cooloffEndsAt: { type: Date },
    lockedWith: { type: String }, // Campaign ID
    lockedAt: { type: Date },
    lastBrandId: { type: String }, // Brand ID from last completed campaign
    lastBrandCooloffHours: { type: Number }, // Highest cooloff period for same brand
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Create compound index for efficient queries
exports.GKeySchema.index({ userId: 1, category: 1 }, { unique: true });
exports.GKeySchema.index({ status: 1 });
exports.GKeySchema.index({ cooloffEndsAt: 1 });
// Update the updatedAt field on save
exports.GKeySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
exports.default = exports.GKeySchema;
//# sourceMappingURL=g-key.schema.js.map