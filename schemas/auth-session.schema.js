"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSession = exports.AuthSessionSchema = void 0;
exports.getAuthSessionModel = getAuthSessionModel;
const mongoose_1 = require("mongoose");
const schema_types_1 = require("../lib/schema-types");
const authSessionSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    provider: {
        type: String,
        enum: Object.values(schema_types_1.AuthProvider),
        required: true,
    },
    token: {
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: false },
        expiresAt: { type: Date, required: true },
    },
}, { timestamps: true });
authSessionSchema.index({ userId: 1, provider: 1 }, { unique: true });
exports.AuthSessionSchema = authSessionSchema;
function getAuthSessionModel() {
    if (typeof window === 'undefined') {
        return mongoose_1.models.AuthSession || (0, mongoose_1.model)('AuthSession', authSessionSchema);
    }
    return null;
}
exports.AuthSession = getAuthSessionModel();
//# sourceMappingURL=auth-session.schema.js.map