"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StreamStatus } from "@/components/ui/stream-status";

export default function OverlayHelp() {
  const { status, data: sessionData } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [overlayUrl, setOverlayUrl] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  // Default demo token - in production this should be generated server-side
  const [demoToken] = useState('demo-' + Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // If still loading session, wait
    if (status === "loading") {
      return;
    }

    // Once authenticated, fetch the overlay token
    const fetchOverlayToken = async () => {
      try {
        setIsLoading(true);
        
        // Get user role from session if possible
        const userRole = sessionData?.user?.role;
        
        // Attempt to fetch the user's overlay token using the new proxy to NestJS
        let overlayToken = null;
        try {
          console.log("Attempting to fetch overlay settings from NestJS backend...");
          const response = await fetch("/api/user/overlay", { 
            // Add a reasonable timeout
            signal: AbortSignal.timeout(5000) 
          });
          
          if (response.ok) {
            const data = await response.json();
            overlayToken = data.overlayToken;
            console.log("Successfully retrieved overlay token from NestJS backend");
            
            // If API tells us user is not a streamer, redirect
            if (data.role !== "streamer") {
              router.push("/dashboard");
              return;
            }
          } else {
            console.warn("Overlay settings API returned error:", response.status, 
              "- Using demo token instead");
          }
        } catch (fetchError) {
          console.warn("Could not fetch overlay settings:", 
            fetchError instanceof Error ? fetchError.message : fetchError,
            "- Using demo token instead");
        }
        
        // If we don't have a role from API but we do from session
        if (userRole && userRole !== "streamer") {
          router.push("/dashboard");
          return;
        }
        
        // Use real token if available, otherwise use demo token
        const token = overlayToken || demoToken;
        const isDemo = !overlayToken;
        console.log("Using overlay token:", isDemo ? "Demo token (MongoDB connection issue)" : "Real token");
        
        setOverlayUrl(`${window.location.origin}/api/overlay/${token}`);
        setIsDemoMode(isDemo);
        
        // If we're using a demo token due to database issues, set a warning flag
        if (isDemo) {
          console.warn("NOTICE: Using demo overlay in test mode due to database connection issues. " +
                      "This URL will work for testing but may not show real campaign data.");
        }
      } catch (error) {
        console.error("Error in overlay setup:", error);
        // Still set a URL even if there's an error
        setOverlayUrl(`${window.location.origin}/api/overlay/${demoToken}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverlayToken();
  }, [status, router, sessionData, demoToken]);
  
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-6">Campaign Browser Source Setup Guide</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Your Browser Source URL</h2>
            
            {isDemoMode && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                <p className="font-bold">⚠️ Demo Mode</p>
                <p>Database connection issues detected. Using demo overlay URL that will work for testing, but may not show real campaign data.</p>
              </div>
            )}
          
            <p className="mb-4">
              Add this URL as a browser source in your streaming software (OBS, Streamlabs, etc.) 
              to display your joined campaigns:
            </p>
            
            {isLoading ? (
              <div className="bg-neutral-900 p-4 rounded text-white font-mono text-sm mb-4 overflow-x-auto animate-pulse">
                Loading your overlay URL...
              </div>
            ) : (
              <div className="bg-neutral-900 p-4 rounded text-white font-mono text-sm mb-4 overflow-x-auto">
                {overlayUrl}
              </div>
            )}
            
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => {
                navigator.clipboard.writeText(overlayUrl);
                alert("URL copied to clipboard!");
              }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Copy URL to Clipboard"}
            </button>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Important Notes:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>This URL will automatically show ads from your joined campaigns</li>
                <li>You don&apos;t need a separate browser source for each campaign</li>
                <li>If you join multiple campaigns, the system will rotate between them</li>
                <li>Make sure your browser source is active while streaming</li>
              </ul>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <StreamStatus autoRefresh={true} />
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Setting Up in OBS Studio</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Step 1: Add a Browser Source</h3>
              <p>In OBS Studio, go to the Sources panel and click the + button. Select &quot;Browser&quot; from the list.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Step 2: Configure the Browser Source</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Enter a name for your source (e.g. &quot;Campaign Overlay&quot;)</li>
                <li>Paste your Browser Source URL in the URL field</li>
                <li>Set width to 1920 and height to 1080 (or match your stream resolution)</li>
                <li>Enable &quot;Refresh browser when scene becomes active&quot;</li>
                <li>Click &quot;OK&quot; to save</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Step 3: Position Your Overlay</h3>
              <p>Position the browser source in your scene. You can resize and move it as needed.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Customizing Your Overlay</h2>
          
          <p className="mb-4">
            You can customize how overlays appear on your stream through your settings:
          </p>
          
          <Link 
            href="/dashboard/settings/overlay"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition inline-block"
          >
            Go to Overlay Settings
          </Link>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Available Customizations:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Position (top-left, top-right, bottom-left, bottom-right)</li>
              <li>Size (small, medium, large)</li>
              <li>Opacity (transparency level)</li>
              <li>Background color</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">View Joined Campaigns</h2>
          
          <p className="mb-4">
            To see all campaigns you&apos;ve joined and monitor their performance:
          </p>
          
          <Link 
            href="/dashboard/campaigns/my-campaigns"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition inline-block"
          >
            Go to My Campaigns
          </Link>
        </Card>
      </div>
    </div>
  );
}
