"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    // Redirect to the streamer sign-in page by default
    router.replace(`/auth/signin/streamer${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
  }, [router, callbackUrl]);

  // This is just a fallback, we should never see this
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting to sign in...</p>
    </div>
  );
}