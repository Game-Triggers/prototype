"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserSchema = exports.AuthProvider = exports.UserRole = void 0;
exports.getUserModel = getUserModel;
const mongoose_1 = require("mongoose");
// Import directly from relative path for compatibility with both Next.js and NestJS
const schema_types_1 = require("../lib/schema-types");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return schema_types_1.UserRole; } });
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return schema_types_1.AuthProvider; } });
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    // Add password field to the schema (not required as it's only for email auth)
    password: { type: String, select: false }, // Exclude from queries by default
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
    // Account status
    isActive: { type: Boolean, default: true },
    // Overlay settings for streamers
    overlaySettings: {
        position: { type: String, default: 'bottom-right' }, // top-left, top-right, bottom-left, bottom-right
        size: { type: String, default: 'medium' }, // small, medium, large
        opacity: { type: Number, default: 80 }, // 0-100
        backgroundColor: { type: String, default: 'transparent' },
    },
    // Unique token for overlay access
    overlayToken: { type: String },
    // Overlay activity tracking fields
    overlayLastSeen: { type: Date },
    overlayActive: { type: Boolean, default: false },
    // Enhanced: Campaign selection strategy
    campaignSelectionStrategy: {
        type: String,
        enum: ['fair-rotation', 'weighted', 'time-rotation', 'performance', 'revenue-optimized'],
        default: 'fair-rotation'
    },
    // Enhanced: Campaign rotation settings
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
                startTime: { type: String }, // HH:MM format
                endTime: { type: String }, // HH:MM format
                days: [{ type: String }] // ['monday', 'tuesday', etc.]
            }]
    },
    // Streak tracking data
    streakCurrent: { type: Number, default: 0 },
    streakLongest: { type: Number, default: 0 },
    streakLastDate: { type: Date, default: null },
    streakHistory: [{ type: Date }],
    // Energy Pack system for campaign joins
    energyPacks: {
        current: { type: Number, default: 10 }, // Start with full energy
        maximum: { type: Number, default: 10 }, // Default maximum of 10
        lastReset: { type: Date, default: Date.now }, // Initialize to current time
        dailyUsed: { type: Number, default: 0 } // Track daily usage
    },
    // XP (Experience Points) system
    xp: {
        total: { type: Number, default: 0 }, // Total XP accumulated
        level: { type: Number, default: 1 }, // Start at level 1
        earnedToday: { type: Number, default: 0 }, // XP earned today
        lastEarned: { type: Date, default: null }, // Last time XP was earned
        activities: [{
                type: { type: String }, // Activity type
                amount: { type: Number }, // XP amount earned
                earnedAt: { type: Date } // When it was earned
            }] // XP activity history (keep last 50)
    },
<<<<<<< HEAD
    // RP (Reputation Points) system
    rp: {
        total: { type: Number, default: 0 }, // Total RP accumulated
        earnedToday: { type: Number, default: 0 }, // RP earned today
        lastEarned: { type: Date, default: null }, // Last time RP was earned
        activities: [{
                type: { type: String }, // Activity type
                amount: { type: Number }, // RP amount earned
                earnedAt: { type: Date } // When it was earned
            }] // RP activity history (keep last 50)
    },
    // Level tracking system - stores historical level progression
    levelHistory: [{
            level: { type: Number }, // Level achieved
            achievedAt: { type: Date }, // When this level was reached
            totalXP: { type: Number }, // Total XP at the time of level up
            totalRP: { type: Number } // Total RP at the time of level up
        }], // Historical record of level achievements
    // Current level information (calculated from XP/RP)
    currentLevel: {
        level: { type: Number, default: 1 }, // Current calculated level (start at level 1)
        lastUpdated: { type: Date, default: Date.now }, // Last time level was calculated
        totalXP: { type: Number, default: 0 }, // XP at last calculation
        totalRP: { type: Number, default: 0 } // RP at last calculation
    },

    // Test campaign data for overlay testing
    testCampaign: {
        title: { type: String },
        mediaUrl: { type: String },
        mediaType: { type: String },
        testMode: { type: Boolean },
        expiresAt: { type: Date }
    },
}, { timestamps: true });
// Index for streak queries by updatedAt if needed later
userSchema.index({ updatedAt: 1 });
// Index for streak leaderboard queries (for future leaderboard features)
userSchema.index({ streakLongest: -1 });
userSchema.index({ streakCurrent: -1 });
// Index for level-related queries
userSchema.index({ 'currentLevel.level': -1 }); // For level leaderboards
userSchema.index({ 'levelHistory.achievedAt': -1 }); // For level progression history
userSchema.index({ 'xp.total': -1 }); // For XP leaderboards
userSchema.index({ 'rp.total': -1 }); // For RP leaderboards
// Explicitly export the schema for NestJS
exports.UserSchema = userSchema;
// Use a function to safely get the User model
function getUserModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
    }
    return null;
}
// Define a named export for backward compatibility
exports.User = getUserModel();
// No default export to avoid TypeScript issues
//# sourceMappingURL=user.schema.js.map