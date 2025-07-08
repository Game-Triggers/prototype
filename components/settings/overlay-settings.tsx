"use client";

import { Button } from "@/components/ui/button";

export function OverlaySettings() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="mb-4">
          <h3 className="font-medium">Overlay Instructions</h3>
          <p className="text-sm text-gray-500">
            Add this browser source to OBS or other streaming software to display ads.
          </p>
        </div>
        <div className="bg-black/10 p-3 rounded text-sm font-mono mb-4">
          https://overlay.instreamly.com/user/YOUR_USER_ID
        </div>
        <Button variant="outline">Copy URL</Button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="mb-4">
          <h3 className="font-medium">Overlay Settings</h3>
          <p className="text-sm text-gray-500">
            Customize the appearance of your overlay.
          </p>
        </div>
        <Button>Customize Overlay</Button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="mb-4">
          <h3 className="font-medium">Reset Overlay URL</h3>
          <p className="text-sm text-gray-500">
            Get your browser source URL
          </p>
        </div>
        <Button variant="outline">Generate URL</Button>
      </div>
    </div>
  );
}
