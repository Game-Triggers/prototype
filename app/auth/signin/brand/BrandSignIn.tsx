"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export default function BrandSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setErrorMessage("Invalid email or password");
        setIsLoading(false);
        return;
      }
      
      if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">Brand Sign In</h1>
          <p className="mt-2 text-muted-foreground">
            Continue to Gametriggers
          </p>
        </div>

        {/* User Type Navigation */}
        <div className="text-center">
          <span className="text-muted-foreground">Are you a streamer?</span>{" "}
          <Link href="/auth/signin/streamer" className="text-primary hover:underline">
            Sign in as streamer
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
                    ? "Invalid email or password"
                    : "An error occurred. Please try again.")}
              </p>
            </div>
          </div>
        )}

        {/* Brand Email Login */}
        <Card className="p-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Sign in to your brand account
            </p>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Create one
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
