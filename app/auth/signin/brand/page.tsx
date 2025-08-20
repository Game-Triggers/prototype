// app/auth/signin/streamer/page.tsx
import { Suspense } from "react";
import BrandSignIn from "./BrandSignIn";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading sign-in page...</span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BrandSignIn />
    </Suspense>
  );
}
