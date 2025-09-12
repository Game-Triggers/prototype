"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationStatus = exports.MediaType = exports.CampaignStatus = exports.AuthProvider = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STREAMER"] = "streamer";
    UserRole["BRAND"] = "brand";
    UserRole["ADMIN"] = "admin";
    UserRole["MARKETING_HEAD"] = "marketing_head";
    UserRole["CAMPAIGN_MANAGER"] = "campaign_manager";
    UserRole["ADMIN_BRAND"] = "admin_brand";
    UserRole["FINANCE_MANAGER"] = "finance_manager";
    UserRole["VALIDATOR_APPROVER"] = "validator_approver";
    UserRole["CAMPAIGN_CONSULTANT"] = "campaign_consultant";
    UserRole["SALES_REPRESENTATIVE"] = "sales_representative";
    UserRole["SUPPORT_2_BRAND"] = "support_2_brand";
    UserRole["SUPPORT_1_BRAND"] = "support_1_brand";
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN_EXCHANGE"] = "admin_exchange";
    UserRole["PLATFORM_SUCCESS_MANAGER"] = "platform_success_manager";
    UserRole["CUSTOMER_SUCCESS_MANAGER"] = "customer_success_manager";
    UserRole["CAMPAIGN_SUCCESS_MANAGER"] = "campaign_success_manager";
    UserRole["SUPPORT_2_ADMIN"] = "support_2_admin";
    UserRole["SUPPORT_1_ADMIN"] = "support_1_admin";
    UserRole["INDEPENDENT_PUBLISHER"] = "independent_publisher";
    UserRole["ARTISTE_MANAGER"] = "artiste_manager";
    UserRole["STREAMER_INDIVIDUAL"] = "streamer_individual";
    UserRole["LIAISON_MANAGER"] = "liaison_manager";
    UserRole["SUPPORT_2_PUBLISHER"] = "support_2_publisher";
    UserRole["SUPPORT_1_PUBLISHER"] = "support_1_publisher";
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
    CampaignStatus["PENDING"] = "pending";
    CampaignStatus["ACTIVE"] = "active";
    CampaignStatus["PAUSED"] = "paused";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["CANCELLED"] = "cancelled";
    CampaignStatus["REJECTED"] = "rejected";
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
    ParticipationStatus["LEFT_EARLY"] = "left_early";
    ParticipationStatus["REMOVED"] = "removed";
    ParticipationStatus["PARTICIPATION_PAUSED"] = "participation_paused";
})(ParticipationStatus || (exports.ParticipationStatus = ParticipationStatus = {}));
//# sourceMappingURL=schema-types.js.map