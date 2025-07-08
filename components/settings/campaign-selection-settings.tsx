"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Clock,
  TrendingUp,
  DollarSign,
  RotateCcw,
  Weight,
  Info,
  Plus,
  Trash2,
  Moon,
} from "lucide-react";

interface CampaignSelectionSettings {
  campaignSelectionStrategy: string;
  campaignRotationSettings: {
    preferredStrategy: string;
    rotationIntervalMinutes: number;
    priorityWeights: {
      paymentRate: number;
      performance: number;
      fairness: number;
    };
    blackoutPeriods?: Array<{
      startTime: string;
      endTime: string;
      days: string[];
    }>;
  };
}

interface CampaignSelectionSettingsProps {
  initialSettings?: CampaignSelectionSettings;
  onSave: (settings: CampaignSelectionSettings) => Promise<void>;
  loading?: boolean;
}

const STRATEGY_INFO = {
  "fair-rotation": {
    icon: RotateCcw,
    title: "Fair Rotation",
    description: "Equal exposure time for all campaigns with time-based rotation",
    color: "text-blue-500",
  },
  "weighted": {
    icon: Weight,
    title: "Weighted Selection",
    description: "Prioritize campaigns based on payment rate, performance, and fairness",
    color: "text-purple-500",
  },
  "time-rotation": {
    icon: Clock,
    title: "Time-Based Rotation",
    description: "Fixed time intervals for each campaign (e.g., 3 minutes each)",
    color: "text-green-500",
  },
  "performance": {
    icon: TrendingUp,
    title: "Performance-Based",
    description: "Prioritize campaigns with better click-through rates and engagement",
    color: "text-orange-500",
  },
  "revenue-optimized": {
    icon: DollarSign,
    title: "Revenue Optimized",
    description: "Maximize your earnings by showing highest-paying campaigns",
    color: "text-emerald-500",
  },
};

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function CampaignSelectionSettings({
  initialSettings,
  onSave,
  loading = false,
}: CampaignSelectionSettingsProps) {
  const [settings, setSettings] = useState<CampaignSelectionSettings>({
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
    ...initialSettings,
  });

  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings((prev) => ({ ...prev, ...initialSettings }));
      setIsModified(false);
    }
  }, [initialSettings]);

  const handleStrategyChange = (strategy: string) => {
    setSettings((prev) => ({
      ...prev,
      campaignSelectionStrategy: strategy,
      campaignRotationSettings: {
        ...prev.campaignRotationSettings,
        preferredStrategy: strategy,
      },
    }));
    setIsModified(true);
  };

  const handleIntervalChange = (interval: number) => {
    setSettings((prev) => ({
      ...prev,
      campaignRotationSettings: {
        ...prev.campaignRotationSettings,
        rotationIntervalMinutes: interval,
      },
    }));
    setIsModified(true);
  };

  const handleWeightChange = (type: keyof typeof settings.campaignRotationSettings.priorityWeights, value: number) => {
    setSettings((prev) => ({
      ...prev,
      campaignRotationSettings: {
        ...prev.campaignRotationSettings,
        priorityWeights: {
          ...prev.campaignRotationSettings.priorityWeights,
          [type]: value,
        },
      },
    }));
    setIsModified(true);
  };

  const addBlackoutPeriod = () => {
    setSettings((prev) => ({
      ...prev,
      campaignRotationSettings: {
        ...prev.campaignRotationSettings,
        blackoutPeriods: [
          ...(prev.campaignRotationSettings.blackoutPeriods || []),
          {
            startTime: "22:00",
            endTime: "06:00",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          },
        ],
      },
    }));
    setIsModified(true);
  };

  const removeBlackoutPeriod = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      campaignRotationSettings: {
        ...prev.campaignRotationSettings,
        blackoutPeriods: prev.campaignRotationSettings.blackoutPeriods?.filter((_, i) => i !== index) || [],
      },
    }));
    setIsModified(true);
  };

  const updateBlackoutPeriod = (index: number, field: string, value: string | string[]) => {
    setSettings((prev) => ({
      ...prev,
      campaignRotationSettings: {
        ...prev.campaignRotationSettings,
        blackoutPeriods: prev.campaignRotationSettings.blackoutPeriods?.map((period, i) =>
          i === index ? { ...period, [field]: value } : period
        ) || [],
      },
    }));
    setIsModified(true);
  };

  const handleSave = async () => {
    await onSave(settings);
    setIsModified(false);
  };

  const normalizeWeights = () => {
    const { paymentRate, performance, fairness } = settings.campaignRotationSettings.priorityWeights;
    const total = paymentRate + performance + fairness;
    
    if (total !== 1.0) {
      setSettings((prev) => ({
        ...prev,
        campaignRotationSettings: {
          ...prev.campaignRotationSettings,
          priorityWeights: {
            paymentRate: Number((paymentRate / total).toFixed(2)),
            performance: Number((performance / total).toFixed(2)),
            fairness: Number((fairness / total).toFixed(2)),
          },
        },
      }));
      setIsModified(true);
    }
  };

  const selectedStrategy = STRATEGY_INFO[settings.campaignSelectionStrategy as keyof typeof STRATEGY_INFO];
  const StrategyIcon = selectedStrategy?.icon || Target;

  return (
    <TooltipProvider>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            <h2 className="text-xl font-semibold">Campaign Selection Strategy</h2>
          </div>
          {isModified && (
            <Badge variant="secondary" className="text-xs">
              Unsaved changes
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {/* Strategy Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Selection Strategy
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="inline ml-1 h-3 w-3 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose how campaigns are selected when you have multiple active campaigns</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(STRATEGY_INFO).map(([key, info]) => {
                const Icon = info.icon;
                const isSelected = settings.campaignSelectionStrategy === key;
                
                return (
                  <Button
                    key={key}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleStrategyChange(key)}
                    className="p-4 h-auto justify-start"
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-white" : info.color}`} />
                      <div className="text-left">
                        <div className="font-medium">{info.title}</div>
                        <div className={`text-xs ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                          {info.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Current Strategy Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <StrategyIcon className={`h-5 w-5 mr-2 ${selectedStrategy?.color || "text-gray-500"}`} />
              <span className="font-medium">Current Strategy: {selectedStrategy?.title || "Unknown"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedStrategy?.description || "No description available"}
            </p>
          </div>

          {/* Rotation Interval */}
          <div>
            <Label htmlFor="rotation-interval" className="text-sm font-medium mb-2 block">
              Rotation Interval (minutes)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="inline ml-1 h-3 w-3 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How often campaigns rotate for time-based and fair rotation strategies</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="rotation-interval"
                type="number"
                min="1"
                max="60"
                value={settings.campaignRotationSettings.rotationIntervalMinutes}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 3)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          {/* Priority Weights (for weighted strategy) */}
          {settings.campaignSelectionStrategy === "weighted" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">
                  Priority Weights
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="inline ml-1 h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjust how much each factor influences campaign selection</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={normalizeWeights}
                  className="text-xs"
                >
                  Normalize (sum to 1.0)
                </Button>
              </div>
              
              <div className="space-y-3">
                {Object.entries(settings.campaignRotationSettings.priorityWeights).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Label className="w-24 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={value}
                      onChange={(e) => handleWeightChange(key as keyof typeof settings.campaignRotationSettings.priorityWeights, parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <div className="text-sm text-muted-foreground">
                      ({Math.round(value * 100)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Blackout Periods */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                <Moon className="inline mr-1 h-4 w-4" />
                Blackout Periods
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline ml-1 h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Times when no campaigns will be displayed (e.g., overnight)</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addBlackoutPeriod}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Period
              </Button>
            </div>

            {settings.campaignRotationSettings.blackoutPeriods?.map((period, index) => (
              <div key={index} className="border rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Blackout Period {index + 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBlackoutPeriod(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-xs mb-1 block">Start Time</Label>
                    <Input
                      type="time"
                      value={period.startTime}
                      onChange={(e) => updateBlackoutPeriod(index, "startTime", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Time</Label>
                    <Input
                      type="time"
                      value={period.endTime}
                      onChange={(e) => updateBlackoutPeriod(index, "endTime", e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs mb-2 block">Days</Label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const newDays = period.days.includes(day.value)
                            ? period.days.filter(d => d !== day.value)
                            : [...period.days, day.value];
                          updateBlackoutPeriod(index, "days", newDays);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          period.days.includes(day.value)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-sm text-muted-foreground text-center py-4">
                No blackout periods configured. Campaigns will display 24/7.
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={loading || !isModified}
              className="w-full"
            >
              {loading ? "Saving..." : isModified ? "Save Changes" : "Saved"}
            </Button>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
