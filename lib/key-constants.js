"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_CONFIG = exports.KEY_CATEGORIES = exports.KeyStatus = void 0;
exports.calculateKeyStatus = calculateKeyStatus;
exports.generateMockKeys = generateMockKeys;
exports.getCategoryInfo = getCategoryInfo;
exports.formatCooloffTime = formatCooloffTime;
var KeyStatus;
(function (KeyStatus) {
    KeyStatus["AVAILABLE"] = "available";
    KeyStatus["LOCKED"] = "locked";
    KeyStatus["COOLOFF"] = "cooloff";
})(KeyStatus || (exports.KeyStatus = KeyStatus = {}));
exports.KEY_CATEGORIES = [
    {
        category: "gaming",
        displayName: "Gaming",
        description: "Keys for gaming campaigns and content",
        icon: "🎮",
        color: "#3b82f6",
        defaultCooloffHours: 2,
        maxUsagePerDay: 5
    },
    {
        category: "music",
        displayName: "Music",
        description: "Keys for music and audio content campaigns",
        icon: "🎵",
        color: "#8b5cf6",
        defaultCooloffHours: 1,
        maxUsagePerDay: 8
    },
    {
        category: "tech",
        displayName: "Technology",
        description: "Keys for tech and gadget campaigns",
        icon: "💻",
        color: "#06b6d4",
        defaultCooloffHours: 3,
        maxUsagePerDay: 4
    },
    {
        category: "beauty",
        displayName: "Beauty",
        description: "Keys for beauty and cosmetics campaigns",
        icon: "💄",
        color: "#ec4899",
        defaultCooloffHours: 4,
        maxUsagePerDay: 3
    },
    {
        category: "fashion",
        displayName: "Fashion",
        description: "Keys for fashion and apparel campaigns",
        icon: "👗",
        color: "#f59e0b",
        defaultCooloffHours: 6,
        maxUsagePerDay: 3
    },
    {
        category: "food",
        displayName: "Food & Beverage",
        description: "Keys for food and beverage campaigns",
        icon: "🍔",
        color: "#ef4444",
        defaultCooloffHours: 2,
        maxUsagePerDay: 6
    },
    {
        category: "lifestyle",
        displayName: "Lifestyle",
        description: "Keys for lifestyle and personal brand campaigns",
        icon: "🌟",
        color: "#10b981",
        defaultCooloffHours: 3,
        maxUsagePerDay: 4
    },
    {
        category: "travel",
        displayName: "Travel",
        description: "Keys for travel and tourism campaigns",
        icon: "✈️",
        color: "#6366f1",
        defaultCooloffHours: 8,
        maxUsagePerDay: 2
    },
    {
        category: "education",
        displayName: "Education",
        description: "Keys for educational content campaigns",
        icon: "📚",
        color: "#8b5cf6",
        defaultCooloffHours: 4,
        maxUsagePerDay: 4
    },
    {
        category: "fitness",
        displayName: "Fitness",
        description: "Keys for fitness and health campaigns",
        icon: "💪",
        color: "#059669",
        defaultCooloffHours: 3,
        maxUsagePerDay: 5
    },
    {
        category: "business",
        displayName: "Business",
        description: "Keys for business and professional campaigns",
        icon: "💼",
        color: "#374151",
        defaultCooloffHours: 6,
        maxUsagePerDay: 3
    },
    {
        category: "entertainment",
        displayName: "Entertainment",
        description: "Keys for entertainment and media campaigns",
        icon: "🎬",
        color: "#7c3aed",
        defaultCooloffHours: 2,
        maxUsagePerDay: 6
    },
    {
        category: "sports",
        displayName: "Sports",
        description: "Keys for sports and athletics campaigns",
        icon: "⚽",
        color: "#dc2626",
        defaultCooloffHours: 4,
        maxUsagePerDay: 4
    },
    {
        category: "art",
        displayName: "Art & Creative",
        description: "Keys for art and creative content campaigns",
        icon: "🎨",
        color: "#db2777",
        defaultCooloffHours: 5,
        maxUsagePerDay: 3
    },
    {
        category: "health",
        displayName: "Health & Wellness",
        description: "Keys for health and wellness campaigns",
        icon: "🏥",
        color: "#059669",
        defaultCooloffHours: 6,
        maxUsagePerDay: 3
    }
];
exports.KEY_CONFIG = {
    COOLOFF_CHECK_INTERVAL_MINUTES: 15,
    MAX_KEYS_PER_CATEGORY: 1,
    AUTO_UNLOCK_ENABLED: true,
    USAGE_RESET_HOUR: 0,
};
function calculateKeyStatus(key, categoryInfo) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (key.cooloffEndsAt && key.cooloffEndsAt > now) {
        const cooloffRemaining = Math.ceil((key.cooloffEndsAt.getTime() - now.getTime()) / (1000 * 60));
        return {
            status: KeyStatus.COOLOFF,
            cooloffRemaining,
            dailyUsageRemaining: Math.max(0, categoryInfo.maxUsagePerDay - key.usageCount),
            canUse: false,
            nextAvailableAt: key.cooloffEndsAt
        };
    }
    const resetUsageCount = (key.lastUsed && key.lastUsed < todayStart) ? 0 : key.usageCount;
    if (resetUsageCount >= categoryInfo.maxUsagePerDay) {
        const nextReset = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        return {
            status: KeyStatus.LOCKED,
            dailyUsageRemaining: 0,
            canUse: false,
            nextAvailableAt: nextReset
        };
    }
    return {
        status: KeyStatus.AVAILABLE,
        dailyUsageRemaining: categoryInfo.maxUsagePerDay - resetUsageCount,
        canUse: true
    };
}
function generateMockKeys(userId) {
    return exports.KEY_CATEGORIES.map((category) => {
        return {
            id: `key_${category.category}_${userId}`,
            category: category.category,
            status: KeyStatus.AVAILABLE,
            lastUsed: undefined,
            cooloffEndsAt: undefined,
            usageCount: 1,
            description: `${category.displayName} key for user campaigns`
        };
    });
}
function getCategoryInfo(category) {
    return exports.KEY_CATEGORIES.find(cat => cat.category === category);
}
function formatCooloffTime(minutes) {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
//# sourceMappingURL=key-constants.js.map