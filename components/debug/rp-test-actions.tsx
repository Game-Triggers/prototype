"use client";

import { useRP } from "@/lib/contexts/rp-context";
import { Button } from "@/components/ui/button";
import { RP_REWARDS } from "@/lib/rp-constants";

export function RPTestActions() {
  const { addRP } = useRP();

  const handleAddRP = async (activityType: keyof typeof RP_REWARDS, amount: number) => {
    try {
      await addRP(activityType, amount);
      console.log(`Added ${amount} RP for ${activityType}`);
    } catch (error) {
      console.error('Failed to add RP:', error);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Test RP Actions</h3>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAddRP('SIGNUP', RP_REWARDS.SIGNUP)}
        >
          +{RP_REWARDS.SIGNUP} RP (Signup)
        </Button>
        
        {/* Example of future activities that can be added */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAddRP('SIGNUP' as any, 15)} // Using SIGNUP as placeholder for demo
          disabled
          title="This will be available when CAMPAIGN_COMPLETE is added to RP_REWARDS"
        >
          +15 RP (Campaign Complete) - Coming Soon
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAddRP('SIGNUP' as any, 2)} // Using SIGNUP as placeholder for demo
          disabled
          title="This will be available when DAILY_LOGIN is added to RP_REWARDS"
        >
          +2 RP (Daily Login) - Coming Soon
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Note: To add more activities, uncomment them in lib/rp-constants.ts and backend/src/constants/rp-constants.ts
      </p>
    </div>
  );
}
