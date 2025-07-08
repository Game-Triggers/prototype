"use client";

import { SessionProvider as NextAuthSessionProvider, signOut, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Session error handler component that watches for session errors
 * and redirects to sign-in when authentication fails
 */
function SessionErrorHandler() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Handle authentication errors from the session
    if (session?.error === "SessionExpired" || session?.error === "RefreshAccessTokenError") {
      console.log("Session expired, redirecting to sign-in");
      signOut({ redirect: false }).then(() => {
        router.push("/auth/signin?error=session-expired");
      });
    }

    // Also listen for auth-error events from the API client
    const handleAuthError = () => {
      console.log("Authentication error event received, redirecting to sign-in");
      signOut({ redirect: false }).then(() => {
        router.push("/auth/signin?error=auth-error");
      });
    };

    window.addEventListener("auth-error", handleAuthError);
    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [session, router]);

  return null;
}

/**
 * Enhanced SessionProvider with debugging capabilities
 * This wrapper adds debugging for session state in development environments
 */
export function SessionProvider({ children }: SessionProviderProps) {
  // Add development logging for session-related issues
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Session Provider mounted - Client Component');
    }
  }, []);

  return (
    <NextAuthSessionProvider
      // Refresh session every 5 minutes to prevent token expiration issues
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      <SessionErrorHandler />
      {children}
    </NextAuthSessionProvider>
  );
}