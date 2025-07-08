"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/schemas/user.schema";
import { CampaignSelectionSettings } from "@/components/settings/campaign-selection-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  MonitorPlay,
  Settings,
  LayoutPanelLeft,
  Eye,
  WifiOff,
  Wifi,
  ExternalLink,
  TestTube,
  PlayCircle
} from "lucide-react";
import { usersApi } from "@/lib/api-client";

// Define proper types for overlay settings and token response
interface OverlaySettings {
  position: string;
  size: string;
  opacity: number;
  backgroundColor: string;
  overlayToken: string;
}

interface TokenResponse {
  overlayToken: string;
}

interface OverlayStatus {
  active: boolean;
  lastSeen?: string;
}

export default function OverlaySettingsPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [overlayStatus, setOverlayStatus] = useState<OverlayStatus>({ active: false });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testAdActive, setTestAdActive] = useState(false);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const testAdTimer = useRef<NodeJS.Timeout | null>(null);

  // Overlay settings state
  const [position, setPosition] = useState("bottom-right");
  const [size, setSize] = useState("medium");
  const [opacity, setOpacity] = useState(100);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [overlayUrl, setOverlayUrl] = useState("");
  const [overlayToken, setOverlayToken] = useState("");

  // Campaign selection settings state
  const [campaignSelectionSettings, setCampaignSelectionSettings] = useState({
    campaignSelectionStrategy: "fair-rotation",
    campaignRotationSettings: {
      preferredStrategy: "fair-rotation",
      rotationIntervalMinutes: 3,
      priorityWeights: {
        paymentRate: 0.4,
        performance: 0.3,
        fairness: 0.3,
      },
      blackoutPeriods: [],
    },
  });
  const [isSavingCampaignSettings, setIsSavingCampaignSettings] = useState(false);

  // Sample campaign data for preview
  const previewCampaign = {
    title: "Preview Campaign",
    mediaUrl: "https://dspncdn.com/a1/media/692x/f0/a0/68/f0a0684953daf21d13fdf30288f96028.jpg",
    mediaType: "image"
  };
  
  // Test campaign data that appears when testing
  const testCampaign = {
    title: "Test Campaign",
    mediaUrl: "https://i.pinimg.com/736x/0e/11/10/0e11103dc124d99aba7fc41f8f76e2d7.jpg",
    mediaType: "image",
    link: "https://example.com"
  };

  // Function to construct overlay URL from token
  const constructOverlayUrl = (token: string) => {
    if (!token) return "";
    // Use the direct overlay path that will properly route through our API proxy
    return `${window.location.origin}/api/overlay/${token}`;
  };

  // Function to check overlay connection status
  const checkOverlayStatus = async () => {
    if (!overlayToken || isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      // Call the status check endpoint with the overlay token
      const status = await usersApi.checkOverlayStatus(
        overlayToken,
        session?.accessToken as string
      ) as OverlayStatus;
      
      setOverlayStatus(status);
    } catch (error) {
      console.error("Failed to check overlay status:", error);
      setOverlayStatus({ active: false });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Set up periodic status checking
  useEffect(() => {
    if (overlayToken) {
      // Check immediately when token is available
      checkOverlayStatus();
      
      // Set up interval for periodic checking (every 30 seconds)
      statusCheckInterval.current = setInterval(checkOverlayStatus, 30000);
    }
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [overlayToken]);

  // Listen for token refresh events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleTokenRefreshed = (event: Event) => {
        // Force update the session to get the new token
        update();
      };

      window.addEventListener("token-refreshed", handleTokenRefreshed);
      window.addEventListener("auth-error", () => {
        setError("Authentication error. Please sign in again.");
        router.push("/auth/signin");
      });

      return () => {
        window.removeEventListener("token-refreshed", handleTokenRefreshed);
        window.removeEventListener("auth-error", () => {});
      };
    }
  }, [update, router]);

  // Redirect non-streamers
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== UserRole.STREAMER) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch overlay settings from API
  useEffect(() => {
    const fetchOverlaySettings = async () => {
      if (status !== "authenticated" || session?.user?.role !== UserRole.STREAMER) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get overlay settings from API using both access token and refresh token
        const settings = await usersApi.getOverlaySettings(
          session.accessToken as string,
          session.refreshToken as string
        ) as OverlaySettings;

        // Update state with retrieved settings
        setPosition(settings.position || "bottom-right");
        setSize(settings.size || "medium");
        setOpacity(settings.opacity || 100);
        setBackgroundColor(settings.backgroundColor || "transparent");
        setOverlayToken(settings.overlayToken || "");
        
        // Construct overlay URL from the token
        setOverlayUrl(constructOverlayUrl(settings.overlayToken));

        // Get campaign selection settings if available via proxy route
        try {
          const campaignResponse = await fetch('/api/user/me/campaign-selection', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            if (campaignData.campaignSelectionStrategy || campaignData.campaignRotationSettings) {
              setCampaignSelectionSettings({
                campaignSelectionStrategy: campaignData.campaignSelectionStrategy || "fair-rotation",
                campaignRotationSettings: campaignData.campaignRotationSettings || {
                  preferredStrategy: "fair-rotation",
                  rotationIntervalMinutes: 3,
                  priorityWeights: {
                    paymentRate: 0.4,
                    performance: 0.3,
                    fairness: 0.3,
                  },
                  blackoutPeriods: [],
                },
              });
            }
          }
        } catch (campaignSettingsError) {
          console.warn("Failed to load campaign selection settings:", campaignSettingsError);
          // Continue with default settings - not a critical error
        }
        
      } catch (error: any) {
        console.error("Failed to fetch overlay settings:", error);
        setError(error.message || "Failed to load overlay settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverlaySettings();
  }, [status, session]);

  // Handle position change
  const handlePositionChange = (newPosition: string) => {
    setPosition(newPosition);
  };

  // Handle size change
  const handleSizeChange = (newSize: string) => {
    setSize(newSize);
  };

  // Handle copy overlay URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle regenerate token
  const handleRegenerateToken = async () => {
    try {
      setIsRegenerating(true);
      setError(null);

      // Regenerate overlay token
      const result = await usersApi.regenerateOverlayToken(
        session?.accessToken as string,
        session?.refreshToken as string
      ) as TokenResponse;

      setOverlayToken(result.overlayToken);
      
      // Construct overlay URL from the new token
      const newOverlayUrl = constructOverlayUrl(result.overlayToken);
      setOverlayUrl(newOverlayUrl);
      
      // Reset overlay status as it's a new token
      setOverlayStatus({ active: false });
      
      setSuccessMessage("Token regenerated successfully! Your overlay URL has been updated.");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Show success message longer to emphasize the change
    } catch (error: any) {
      console.error("Failed to regenerate token:", error);
      setError(error.message || "Failed to regenerate token");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle manual status check
  const handleManualStatusCheck = async () => {
    await checkOverlayStatus();
    if (overlayStatus.active) {
      setSuccessMessage("Overlay connection active!");
    } else {
      setError("Overlay not detected. Make sure it's added to your streaming software.");
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 3000);
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Update overlay settings
      await usersApi.updateOverlaySettings(
        {
          position,
          size,
          opacity,
          backgroundColor
        },
        session?.accessToken as string,
        session?.refreshToken as string
      );

      setSuccessMessage("Settings saved successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      setError(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save campaign selection settings
  const handleSaveCampaignSettings = async (settings: typeof campaignSelectionSettings) => {
    try {
      setIsSavingCampaignSettings(true);
      setError(null);

      // Update campaign selection settings via proxy route
      const response = await fetch('/api/user/me/campaign-selection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save campaign selection settings');
      }

      setCampaignSelectionSettings(settings);
      setSuccessMessage("Campaign selection settings saved successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: unknown) {
      console.error("Failed to save campaign settings:", error);
      setError(error instanceof Error ? error.message : "Failed to save campaign selection settings");
    } finally {
      setIsSavingCampaignSettings(false);
    }
  };

  // Handle test overlay - sends a test ad to the overlay
  const handleTestOverlay = async () => {
    if (!overlayToken || isTesting || !overlayStatus.active) return;
    
    try {
      setIsTesting(true);
      setError(null);
      
      // Set test ad active state - this will change preview to test campaign
      setTestAdActive(true);
      
      // Call API to trigger test ad in the actual overlay
      const response = await usersApi.triggerTestAd(
        overlayToken,
        session?.accessToken as string,
        session?.refreshToken as string,
        testCampaign
      );
      
      setSuccessMessage("Test ad displayed in your overlay!");
      
      // Automatically remove test ad after 10 seconds
      if (testAdTimer.current) {
        clearTimeout(testAdTimer.current);
      }
      
      testAdTimer.current = setTimeout(() => {
        setTestAdActive(false);
        setSuccessMessage(null);
      }, 10000);
      
    } catch (error: any) {
      console.error("Failed to display test ad:", error);
      setError(error.message || "Failed to display test ad");
      setTestAdActive(false);
    } finally {
      // Don't immediately set isTesting to false to prevent spam clicking
      setTimeout(() => setIsTesting(false), 3000);
    }
  };

  // Calculate style classes based on position
  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-0 left-0";
      case "top-right":
        return "top-0 right-0";
      case "bottom-left":
        return "bottom-0 left-0";
      case "bottom-right":
      default:
        return "bottom-0 right-0";
    }
  };

  // Calculate size classes
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-1/4 h-1/4";
      case "large":
        return "w-1/2 h-1/2";
      case "medium":
      default:
        return "w-1/3 h-1/3";
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Overlay Settings</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Connection Status */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {overlayStatus.active ? (
              <Wifi className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500 mr-2" />
            )}
            <div>
              <h3 className="font-medium">
                Overlay Connection: <span className={overlayStatus.active ? "text-green-500" : "text-red-500"}>
                  {overlayStatus.active ? "Active" : "Inactive"}
                </span>
              </h3>
              {overlayStatus.lastSeen && (
                <p className="text-xs text-gray-500">Last seen: {new Date(overlayStatus.lastSeen).toLocaleString()}</p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualStatusCheck}
            disabled={isCheckingStatus || !overlayToken}
          >
            {isCheckingStatus ? "Checking..." : "Check Status"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MonitorPlay className="mr-2 h-5 w-5" />
                Overlay URL
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Add this URL as a browser source in your streaming software (OBS, Streamlabs, etc.)
              </p>
              <div className="flex mb-4">
                <Input value={overlayUrl} readOnly className="rounded-r-none" />
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  className="rounded-l-none rounded-r-none px-2"
                  disabled={!overlayUrl}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  as="a"
                  href={overlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  className="rounded-l-none px-2"
                  disabled={!overlayUrl}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleRegenerateToken}
                variant="secondary"
                disabled={isRegenerating}
                className="w-full"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Token
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Important: Regenerating the token will change your overlay URL. You&apos;ll need to update the browser source URL in your streaming software (OBS/Streamlabs) with the new URL. Your existing campaign participations will continue to work normally.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Appearance Settings
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={position === "top-left" ? "default" : "outline"}
                    onClick={() => handlePositionChange("top-left")}
                    className="justify-start"
                  >
                    <LayoutPanelLeft className="h-4 w-4 mr-2" />
                    Top Left
                  </Button>
                  <Button
                    variant={position === "top-right" ? "default" : "outline"}
                    onClick={() => handlePositionChange("top-right")}
                    className="justify-start"
                  >
                    <LayoutPanelLeft className="h-4 w-4 mr-2" />
                    Top Right
                  </Button>
                  <Button
                    variant={position === "bottom-left" ? "default" : "outline"}
                    onClick={() => handlePositionChange("bottom-left")}
                    className="justify-start"
                  >
                    <LayoutPanelLeft className="h-4 w-4 mr-2" />
                    Bottom Left
                  </Button>
                  <Button
                    variant={position === "bottom-right" ? "default" : "outline"}
                    onClick={() => handlePositionChange("bottom-right")}
                    className="justify-start"
                  >
                    <LayoutPanelLeft className="h-4 w-4 mr-2" />
                    Bottom Right
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Size</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={size === "small" ? "default" : "outline"}
                    onClick={() => handleSizeChange("small")}
                  >
                    Small
                  </Button>
                  <Button
                    variant={size === "medium" ? "default" : "outline"}
                    onClick={() => handleSizeChange("medium")}
                  >
                    Medium
                  </Button>
                  <Button
                    variant={size === "large" ? "default" : "outline"}
                    onClick={() => handleSizeChange("large")}
                  >
                    Large
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Opacity: {opacity}%</label>
                <Input
                  type="range"
                  min="20"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Background Color</label>
                <div className="flex items-center">
                  <Input
                    type="color"
                    value={backgroundColor === "transparent" ? "#ffffff" : backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Button
                    variant={backgroundColor === "transparent" ? "default" : "outline"}
                    onClick={() => setBackgroundColor("transparent")}
                    className="ml-2"
                  >
                    Transparent
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </Card>
          </div>
        </div>
        
        {/* Preview Panel */}
        <Card className="p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Preview
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is how your overlay will appear in your stream
          </p>
          
          <div className="relative w-full aspect-video bg-gray-800 rounded-md overflow-hidden border border-gray-700">
            {/* Simulated stream content */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900"></div>
            
            {/* Overlay preview */}
            <div 
              className={`absolute ${getPositionClasses()} ${getSizeClasses()} p-2`}
              style={{
                opacity: opacity / 100,
                backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : 'transparent'
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <img 
                  src={testAdActive ? testCampaign.mediaUrl : previewCampaign.mediaUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-center text-muted-foreground">
            The actual campaign content will appear in place of this preview image
          </div>
          <Button 
            onClick={handleTestOverlay} 
            disabled={isTesting || !overlayStatus.active} 
            className="mt-4 w-full"
          >
            {isTesting ? "Testing..." : "Test Overlay"}
          </Button>
        </Card>
      </div>

      {/* Campaign Selection Settings */}
      <CampaignSelectionSettings
        initialSettings={campaignSelectionSettings}
        onSave={handleSaveCampaignSettings}
        loading={isSavingCampaignSettings}
      />
    </div>
  );
}