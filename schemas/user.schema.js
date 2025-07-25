"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserSchema = exports.AuthProvider = exports.UserRole = void 0;
exports.getUserModel = getUserModel;
const mongoose_1 = require("mongoose");
const schema_types_1 = require("../lib/schema-types");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return schema_types_1.UserRole; } });
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return schema_types_1.AuthProvider; } });
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    password: { type: String, select: false },
    role: {
        type: String,
        enum: Object.values(schema_types_1.UserRole),
        required: true,
    },
    authProvider: {
        type: String,
        enum: Object.values(schema_types_1.AuthProvider),
        required: true,
    },
    authProviderId: { type: String },
    channelUrl: { type: String },
    category: [{ type: String }],
    language: [{ type: String }],
    description: { type: String },
    overlaySettings: {
        position: { type: String, default: 'bottom-right' },
        size: { type: String, default: 'medium' },
        opacity: { type: Number, default: 80 },
        backgroundColor: { type: String, default: 'transparent' },
    },
    overlayToken: { type: String },
    overlayLastSeen: { type: Date },
    overlayActive: { type: Boolean, default: false },
    campaignSelectionStrategy: {
        type: String,
        enum: ['fair-rotation', 'weighted', 'time-rotation', 'performance', 'revenue-optimized'],
        default: 'fair-rotation'
    },
    campaignRotationSettings: {
        preferredStrategy: {
            type: String,
            enum: ['fair-rotation', 'weighted', 'time-rotation', 'performance', 'revenue-optimized'],
            default: 'fair-rotation'
        },
        rotationIntervalMinutes: { type: Number, default: 3 },
        priorityWeights: {
            paymentRate: { type: Number, default: 0.4 },
            performance: { type: Number, default: 0.3 },
            fairness: { type: Number, default: 0.3 }
        },
        blackoutPeriods: [{
                startTime: { type: String },
                endTime: { type: String },
                days: [{ type: String }]
            }]
    },
    testCampaign: {
        title: { type: String },
        mediaUrl: { type: String },
        mediaType: { type: String },
        testMode: { type: Boolean },
        expiresAt: { type: Date }
    },
}, { timestamps: true });
exports.UserSchema = userSchema;
function getUserModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
    }
    return null;
}
exports.User = getUserModel();
//# sourceMappingURL=user.schema.js.map