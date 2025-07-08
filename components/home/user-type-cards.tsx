"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UserTypeCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      <div className="flex flex-col items-center p-6 border rounded-lg bg-card">
        <h2 className="text-2xl font-bold mb-4">For Streamers</h2>
        <p className="mb-4 text-muted-foreground">Join campaigns you love and earn money while streaming with automated overlays.</p>
        <Link href="/auth/signin?type=streamer" className="mt-auto">
          <Button className="w-full">
            Sign Up as a Streamer
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col items-center p-6 border rounded-lg bg-card">
        <h2 className="text-2xl font-bold mb-4">For Brands</h2>
        <p className="mb-4 text-muted-foreground">Create campaigns and connect with streamers to promote your products or services.</p>
        <Link href="/auth/signin/brand" className="mt-auto">
          <Button className="w-full">
            Sign Up as a Brand
          </Button>
        </Link>
      </div>
    </div>
  );
}
