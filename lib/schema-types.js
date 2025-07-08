"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationStatus = exports.MediaType = exports.CampaignStatus = exports.AuthProvider = exports.UserRole = void 0;
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
var ParticipationStatus;
(function (ParticipationStatus) {
    ParticipationStatus["ACTIVE"] = "active";
    ParticipationStatus["PAUSED"] = "paused";
    ParticipationStatus["REJECTED"] = "rejected";
    ParticipationStatus["COMPLETED"] = "completed";
})(ParticipationStatus || (exports.ParticipationStatus = ParticipationStatus = {}));
//# sourceMappingURL=schema-types.js.map