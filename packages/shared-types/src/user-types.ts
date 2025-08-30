import { AuthProvider, UserRole } from "./auth-types";


export interface IUserData {
    _id?: string;
    email: string;
    name: string;
    image?: string;
    role: UserRole;
    authProvider: AuthProvider;
    authProviderId?: string;
    channelUrl?: string;
    category?: string[];
    langauage?: string[];
    description?: string;
    isActive?: boolean;
    
    // Gamification fields
    streakCurrent?: number;
    streakLongest?: number;
    streakLastDate?: Date | null;
    energyPacks?: {
        current: number;
        maximum: number;
        lastReset: Date;
        dailyUsed: number;
    };
    xp?: {
        total: number;
        earnedToday: number;
        lastEarned: Date | null;
    };
    rp?: {
        total: number;
        earnedToday: number;
        lastEarned: Date | null;
    };

    createdAt?: Date;
    updatedAt?: Date;
}