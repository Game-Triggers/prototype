"use strict";
/**
 * This file contains types and enums to be used across both client and server.
 * It should NOT include any server-only code like Mongoose models.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationStatus = exports.MediaType = exports.CampaignStatus = exports.AuthProvider = exports.UserRole = void 0;
// User types
var UserRole;
(function (UserRole) {
    UserRole["STREAMER"] = "streamer";
    UserRole["BRAND"] = "brand";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["TWITCH"] = "twitch";
    AuthProvider["YOUTUBE"] = "youtube";
    AuthProvider["EMAIL"] = "email";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
// Campaign types
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "draft";
    CampaignStatus["ACTIVE"] = "active";
    CampaignStatus["PAUSED"] = "paused";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["CANCELLED"] = "cancelled";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
})(MediaType || (exports.MediaType = MediaType = {}));
// Campaign participation types
var ParticipationStatus;
(function (ParticipationStatus) {
    ParticipationStatus["ACTIVE"] = "active";
    ParticipationStatus["PAUSED"] = "paused";
    ParticipationStatus["REJECTED"] = "rejected";
    ParticipationStatus["COMPLETED"] = "completed";
    ParticipationStatus["LEFT_EARLY"] = "left_early";
    ParticipationStatus["REMOVED"] = "removed";
    ParticipationStatus["PARTICIPATION_PAUSED"] = "participation_paused";
})(ParticipationStatus || (exports.ParticipationStatus = ParticipationStatus = {}));
