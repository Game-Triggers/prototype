"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const { data: session } = useSession();
  
  return (
    <header className="fixed top-0 w-full flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm z-10 border-b">
      <div className="flex items-center space-x-2">
        <h1 className="font-bold text-xl">GT</h1>
      </div>
      <div className="flex items-center space-x-4">
        {session ? (
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/auth/signin?callbackUrl=/dashboard" className="hover:underline">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
