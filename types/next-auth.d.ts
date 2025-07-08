import { UserRole } from "@/schemas/user.schema";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extending the built-in session types
   */
  interface Session {
    user?: {
      id?: string;
      role?: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    error?: string;
  }

  /**
   * Extending the built-in user types
   */
  interface User {
    id: string;
    role?: UserRole;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  }
}

declare module "next-auth/jwt" {
  /** Extending the JWT type */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    user?: {
      id: string;
      role: UserRole;
      [key: string]: any;
    };
    error?: string;
    provider?: string;
  }
}