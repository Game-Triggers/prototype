"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInContent() {
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

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}