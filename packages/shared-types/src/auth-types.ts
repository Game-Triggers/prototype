// Extract from lib/schema-types.ts
export enum UserRole {
  STREAMER = 'streamer',
  BRAND = 'brand',
  ADMIN = 'admin',	
}

export enum AuthProvider {
 TWITCH = 'twitch',
 YOUTUBE = 'youtube',
 EMAIL = 'email',
}

// Add nextAuth type extensions 
export interface SessionUser {
 id: string;
 email: string;
 name: string;
 image?: string;
 role: UserRole;
 accessToken?: string;
 refreshToken?: string;
}
