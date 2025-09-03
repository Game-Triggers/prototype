export declare enum KeyStatus {
    AVAILABLE = "available",
    LOCKED = "locked",
    COOLOFF = "cooloff"
}
export interface IKey {
    id: string;
    category: string;
    status: KeyStatus;
    lastUsed?: Date;
    cooloffEndsAt?: Date;
    usageCount: number;
    description?: string;
}
export interface KeyCategoryInfo {
    category: string;
    displayName: string;
    description: string;
    icon: string;
    color: string;
    defaultCooloffHours: number;
    maxUsagePerDay: number;
}
export declare const KEY_CATEGORIES: KeyCategoryInfo[];
export declare const KEY_CONFIG: {
    readonly COOLOFF_CHECK_INTERVAL_MINUTES: 15;
    readonly MAX_KEYS_PER_CATEGORY: 1;
    readonly AUTO_UNLOCK_ENABLED: true;
    readonly USAGE_RESET_HOUR: 0;
};
export declare function calculateKeyStatus(key: IKey, categoryInfo: KeyCategoryInfo): {
    status: KeyStatus;
    cooloffRemaining?: number;
    dailyUsageRemaining: number;
    canUse: boolean;
    nextAvailableAt?: Date;
};
export declare function generateMockKeys(userId: string): IKey[];
export declare function getCategoryInfo(category: string): KeyCategoryInfo | undefined;
export declare function formatCooloffTime(minutes: number): string;
export type KeySystemActivity = 'KEY_USED' | 'KEY_UNLOCKED' | 'COOLOFF_STARTED' | 'COOLOFF_ENDED';
