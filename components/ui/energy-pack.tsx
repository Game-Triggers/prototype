"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEnergyPack } from "@/lib/contexts/energy-pack-context";

export function EnergyPack() {
  const { data: session } = useSession();
  const { energyData, loading } = useEnergyPack();
  const [isHovering, setIsHovering] = useState(false);

  // Only show for streamers
  if (session?.user?.role !== 'streamer') {
    return null;
  }

  if (loading || !energyData) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">--</span>
      </div>
    );
  }

  const renderThunderIcons = () => {
    const icons = [];
    for (let i = 0; i < energyData.maximum; i++) {
      const isActive = i < energyData.current;
      icons.push(
        <Zap
          key={i}
          className={`h-3 w-3 ${
            isActive 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      );
    }
    return icons;
  };

  const getResetTimeText = () => {
    if (energyData.hoursUntilReset > 0) {
      return `${energyData.hoursUntilReset}h ${energyData.minutesUntilReset}m`;
    }
    return `${energyData.minutesUntilReset}m`;
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">{energyData.current}</span>
      </div>

      {isHovering && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-card border rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="text-sm font-medium mb-2">Energy Packs</div>
          
          {/* Thunder icons grid */}
          <div className="grid grid-cols-5 gap-1 mb-3">
            {renderThunderIcons()}
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Available: {energyData.current}/{energyData.maximum}</div>
            <div>Used today: {energyData.dailyUsed}</div>
            <div>Resets in: {getResetTimeText()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
