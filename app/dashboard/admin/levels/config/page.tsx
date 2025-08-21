"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Crown, 
  AlertCircle,
  CheckCircle,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";
import { 
  LEVEL_REQUIREMENTS, 
  LEVEL_CONFIG, 
  type LevelRequirement 
} from "@/lib/level-constants";
import { toast } from "sonner";

interface ConfigurableLevelRequirement extends LevelRequirement {
  isModified?: boolean;
}

export default function LevelConfigPage() {
  const [levels, setLevels] = useState<ConfigurableLevelRequirement[]>(
    LEVEL_REQUIREMENTS.map(level => ({ ...level }))
  );
  const [config, setConfig] = useState(LEVEL_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLevelChange = (levelIndex: number, field: keyof LevelRequirement, value: string | number | string[]) => {
    const newLevels = [...levels];
    newLevels[levelIndex] = {
      ...newLevels[levelIndex],
      [field]: value,
      isModified: true
    };
    setLevels(newLevels);
    setHasChanges(true);
  };

  const handleConfigChange = (field: keyof typeof LEVEL_CONFIG, value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setLevels(LEVEL_REQUIREMENTS.map(level => ({ ...level })));
    setConfig({ ...LEVEL_CONFIG });
    setHasChanges(false);
    toast.success("Reset to default values");
  };

  const validateLevels = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check that XP and RP requirements are increasing
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].minXP <= levels[i - 1].minXP) {
        errors.push(`Level ${levels[i].level}: XP requirement must be higher than Level ${levels[i - 1].level}`);
      }
      if (levels[i].minRP <= levels[i - 1].minRP) {
        errors.push(`Level ${levels[i].level}: RP requirement must be higher than Level ${levels[i - 1].level}`);
      }
    }

    // Check for negative values
    levels.forEach(level => {
      if (level.minXP < 0 || level.minRP < 0) {
        errors.push(`Level ${level.level}: XP and RP requirements cannot be negative`);
      }
      if (!level.title.trim()) {
        errors.push(`Level ${level.level}: Title cannot be empty`);
      }
    });

    // Check config values
    if (config.XP_MULTIPLIER <= 0 || config.RP_MULTIPLIER <= 0) {
      errors.push("Multipliers must be greater than 0");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const saveConfiguration = async () => {
    const validation = validateLevels();
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // In a real implementation, this would save to a backend API
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Level configuration saved successfully!");
      setHasChanges(false);
      
      // Mark levels as no longer modified
      setLevels(levels.map(level => ({ ...level, isModified: false })));
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const validation = validateLevels();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Level Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure the 10-level progression system requirements and rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveConfiguration}
            disabled={!hasChanges || !validation.isValid || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following issues before saving:
            <ul className="mt-2 list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Changes Alert */}
      {hasChanges && validation.isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Global Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Global Configuration
          </CardTitle>
          <CardDescription>
            System-wide settings that affect all level calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-level">Maximum Level</Label>
              <Input
                id="max-level"
                type="number"
                value={config.MAX_LEVEL}
                onChange={(e) => handleConfigChange('MAX_LEVEL', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="xp-multiplier">XP Multiplier</Label>
              <Input
                id="xp-multiplier"
                type="number"
                step="0.1"
                value={config.XP_MULTIPLIER}
                onChange={(e) => handleConfigChange('XP_MULTIPLIER', parseFloat(e.target.value))}
                min="0.1"
                max="5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rp-multiplier">RP Multiplier</Label>
              <Input
                id="rp-multiplier"
                type="number"
                step="0.1"
                value={config.RP_MULTIPLIER}
                onChange={(e) => handleConfigChange('RP_MULTIPLIER', parseFloat(e.target.value))}
                min="0.1"
                max="5"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bonus-xp"
                  checked={config.BONUS_XP_ENABLED}
                  onCheckedChange={(checked) => handleConfigChange('BONUS_XP_ENABLED', checked)}
                />
                <Label htmlFor="bonus-xp">Enable XP Bonus</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="bonus-rp"
                  checked={config.BONUS_RP_ENABLED}
                  onCheckedChange={(checked) => handleConfigChange('BONUS_RP_ENABLED', checked)}
                />
                <Label htmlFor="bonus-rp">Enable RP Bonus</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Level Requirements
          </CardTitle>
          <CardDescription>
            Configure individual level requirements, titles, and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {levels.map((level, index) => (
              <div key={level.level}>
                <div className={`p-4 rounded-lg border ${
                  level.isModified ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' : 'border-muted'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="h-5 w-5" style={{ color: level.color }} />
                    <h3 className="font-semibold">Level {level.level} Configuration</h3>
                    {level.isModified && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Modified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${level.level}`}>Title</Label>
                        <Input
                          id={`title-${level.level}`}
                          value={level.title}
                          onChange={(e) => handleLevelChange(index, 'title', e.target.value)}
                          placeholder="Level title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`badge-${level.level}`}>Badge (Emoji)</Label>
                        <Input
                          id={`badge-${level.level}`}
                          value={level.badge}
                          onChange={(e) => handleLevelChange(index, 'badge', e.target.value)}
                          placeholder="🏆"
                          maxLength={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`color-${level.level}`}>Color</Label>
                        <Input
                          id={`color-${level.level}`}
                          type="color"
                          value={level.color}
                          onChange={(e) => handleLevelChange(index, 'color', e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`xp-${level.level}`} className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          Minimum XP
                        </Label>
                        <Input
                          id={`xp-${level.level}`}
                          type="number"
                          value={level.minXP}
                          onChange={(e) => handleLevelChange(index, 'minXP', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`rp-${level.level}`} className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-green-500" />
                          Minimum RP
                        </Label>
                        <Input
                          id={`rp-${level.level}`}
                          type="number"
                          value={level.minRP}
                          onChange={(e) => handleLevelChange(index, 'minRP', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor={`description-${level.level}`}>Description</Label>
                      <Textarea
                        id={`description-${level.level}`}
                        value={level.description}
                        onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                        placeholder="Level description"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Perks */}
                  <div className="mt-4">
                    <Label>Level Perks</Label>
                    <div className="mt-2 space-y-2">
                      {level.perks.map((perk, perkIndex) => (
                        <div key={perkIndex} className="flex items-center gap-2">
                          <Input
                            value={perk}
                            onChange={(e) => {
                              const newPerks = [...level.perks];
                              newPerks[perkIndex] = e.target.value;
                              handleLevelChange(index, 'perks', newPerks);
                            }}
                            placeholder="Enter a perk"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPerks = level.perks.filter((_, i) => i !== perkIndex);
                              handleLevelChange(index, 'perks', newPerks);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPerks = [...level.perks, "New perk"];
                          handleLevelChange(index, 'perks', newPerks);
                        }}
                      >
                        Add Perk
                      </Button>
                    </div>
                  </div>
                </div>
                
                {index < levels.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
