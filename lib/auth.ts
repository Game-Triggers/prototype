import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import TwitchProvider from "next-auth/providers/twitch";

// import TwitchProviderWithDebugging from "./twitch-provider-debug";

// Define our API URL - Use Next.js API routes instead of direct backend calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Use this URL for credential login (via Next.js API routes)
const NEXT_API_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Debug helper for OAuth processes
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NextAuth] ${message}`, data ? data : "");
  }
};

/**
 * NextAuth configuration options
 * This is the primary authentication system for the application
 */
export const authOptions: NextAuthOptions = {
  debug: true, // Enable detailed debug output
  logger: {
    error: (code, metadata) => {
      console.error(`[NextAuth][ERROR] ${code}`, metadata);
    },
    warn: (code) => {
      console.warn(`[NextAuth][WARN] ${code}`);
    },
    debug: (code, metadata) => {
      console.debug(`[NextAuth][DEBUG] ${code}`, metadata);
    }
  },
  providers: [    // Twitch provider for streamer authentication with enhanced debugging
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID || "",
      clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid user:read:email user:read:broadcast analytics:read:games moderator:read:followers",
        }
      }
    }),
    // Google provider for YouTube streamer authentication
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          prompt: "consent",
          access_type: "offline", // This is required to get a refresh token
        },
      },
      profile(profile) {
        debugLog("Google profile received:", {
          id: profile.sub,
          email: profile.email,
        });
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: "streamer", // Default role for Google/YouTube users
        };
      },
    }),
    // Credentials provider for brand/email authentication
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          debugLog("Missing credentials in authorize function");
          return null;
        }

        try {
          // Use our custom login API route to communicate with the NestJS backend
          const loginUrl = `${NEXT_API_URL}/api/login`;
          debugLog(
            `Attempting login at: ${loginUrl} for email: ${credentials.email}`
          );

          const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            debugLog(`Login failed with status ${response.status}:`, data);
            return null;
          }

          // Validate the response contains the expected data
          if (!data.user || !data.accessToken) {
            debugLog("Invalid response data structure:", data);
            return null;
          }

          debugLog("Login successful, user role:", data.user.role);

          // Return the expected user object for NextAuth
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            image: data.user.image || null,
            role: data.user.role,
            // Save tokens in the JWT but not directly in the user object
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
          };
        } catch (error) {
          console.error("Error during NextAuth login:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - store user information in the token
      if (account && user) {
        debugLog("Processing authentication for provider:", account.provider);

        // For OAuth providers, exchange tokens with backend
        if (account.provider === "twitch" || account.provider === "google") {
          try {
            // Map provider name for consistency
            const providerName =
              account.provider === "google" ? "youtube" : account.provider;

            // Ensure we have tokens to exchange
            if (!account.access_token) {
              console.error(`Missing access_token for ${providerName} OAuth`);
              return token;
            }

            // Exchange OAuth token with backend using the correct DTO structure
            // that matches what the backend expects (no providerUserId field)
            const tokenExchangeUrl = `${API_URL}/auth/${providerName}/token-exchange`;
            
            // Debug token info (redacted for security)
            debugLog(
              `OAuth tokens for ${providerName}:`,
              {
                accessTokenStart: account.access_token?.substring(0, 10) + "...",
                hasRefreshToken: !!account.refresh_token,
                refreshTokenStart: account.refresh_token ? account.refresh_token.substring(0, 10) + "..." : "none",
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : "unknown"
              }
            );
            
            debugLog(
              `Exchanging ${providerName} token at: ${tokenExchangeUrl}`
            );

            const response = await fetch(tokenExchangeUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: account.access_token,
                refreshToken: account.refresh_token || account.access_token, // Fall back to access token if no refresh token
                profile: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  image: user.image,
                },
              }),
            });

            if (response.ok) {
              const data = await response.json();
              debugLog(`${providerName} token exchange successful`);

              // Store backend token and user info
              token.accessToken = data.accessToken;
              token.refreshToken = data.refreshToken;
              token.expiresAt = Date.now() + data.expiresIn * 1000;
              token.user = data.user;
            } else {
              const errorText = await response.text();
              console.error(
                `OAuth token exchange failed (${response.status}):`,
                errorText
              );
            }
          } catch (error) {
            console.error("Error during OAuth token exchange:", error);
          }
        } else {
          // Credentials provider - user already contains tokens from authorize callback
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
          token.expiresAt = user.expiresIn
            ? Date.now() + user.expiresIn * 1000
            : undefined;

          // Remove tokens from user object in the token
          const { accessToken, refreshToken, expiresIn, ...userWithoutTokens } =
            user;
          token.user = userWithoutTokens;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Add user info and tokens to the session
      if (token.user) {
        // Use full user object from token
        session.user = { ...token.user };
      } else if (token) {
        // Fallback to constructing user from token data
        session.user = {
          ...(session.user || {}),
          id: token.sub || "",
          email: token.email || "",
          name: token.name || "",
          image: token.picture || "",
          role: token.role || "streamer", // Default to streamer for OAuth users if no role specified
        };
      }

      // Add necessary tokens to the session
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt;

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      // If the URL starts with the base URL, allow it
      if (url.startsWith(baseUrl)) return url;
      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      // Otherwise, return to the base URL
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Debug already set above
  secret: process.env.NEXTAUTH_SECRET,
};
