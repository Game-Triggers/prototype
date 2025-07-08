"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, TwitchIcon, Youtube } from "lucide-react";

export default function StreamerSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl });
    // No need to set loading to false as we're redirecting
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">Streamer Sign In</h1>
          <p className="mt-2 text-muted-foreground">
            Continue to Gametriggers
          </p>
        </div>

        {/* User Type Navigation */}
        <div className="text-center">
          <span className="text-muted-foreground">Are you a brand?</span>{" "}
          <Link href="/auth/signin/brand" className="text-primary hover:underline">
            Sign in as brand
          </Link>
        </div>

        {/* Error Messages */}
        {(error || errorMessage) && (
          <div className="rounded-md bg-destructive/10 p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-destructive mr-2" />
              <p className="text-sm text-destructive">
                {errorMessage ||
                  (error === "CredentialsSignin"
                    ? "Invalid authentication"
                    : "An error occurred. Please try again.")}
              </p>
            </div>
          </div>
        )}

        {/* Streamer OAuth Options */}
        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Sign in with your streaming platform account
            </p>
            
            <Button
              type="button"
              className="w-full bg-[#9146FF] hover:bg-[#7a3dd1] text-white"
              onClick={() => handleOAuthSignIn("twitch")}
              disabled={isLoading}
            >
              <TwitchIcon className="mr-2 h-4 w-4" />
              Continue with Twitch
            </Button>
            
            <Button
              type="button"
              className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
            >
              <Youtube className="mr-2 h-4 w-4" />
              Continue with YouTube
            </Button>

            <div className="pt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
            
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Create one
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
