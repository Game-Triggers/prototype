"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationSchema = void 0;
const mongoose_1 = require("mongoose");
exports.NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        maxlength: 100,
    },
    message: {
        type: String,
        required: true,
        maxlength: 500,
    },
    type: {
        type: String,
        required: true,
        enum: ['campaign', 'earnings', 'withdrawal', 'kyc', 'system', 'payment', 'dispute'],
        index: true,
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    isRead: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    actionUrl: {
        type: String,
        required: false,
    },
    expiresAt: {
        type: Date,
        required: false,
    },
    readAt: {
        type: Date,
        required: false,
    },
}, {
    timestamps: true,
    collection: 'notifications',
});
exports.NotificationSchema.index({ userId: 1, createdAt: -1 });
exports.NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
exports.NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
exports.NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Notification = mongoose_1.models.Notification || (0, mongoose_1.model)('Notification', exports.NotificationSchema);
exports.default = exports.Notification;
//# sourceMappingURL=notification.schema.js.map