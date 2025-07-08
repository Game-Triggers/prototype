"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  campaigns: boolean;
  payments: boolean;
}

interface NotificationSettingsProps {
  initialSettings: NotificationSettings;
  onSave?: (settings: NotificationSettings) => void;
}

export function NotificationSettings({ 
  initialSettings, 
  onSave = () => {} 
}: NotificationSettingsProps) {
  const [notifications, setNotifications] = 
    useState<NotificationSettings>(initialSettings);

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(notifications);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-gray-500">
              Receive email updates about your account activity
            </p>
          </div>
          <Switch
            checked={notifications.email}
            onCheckedChange={() => handleNotificationChange("email")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-gray-500">
              Receive push notifications on your devices
            </p>
          </div>
          <Switch
            checked={notifications.push}
            onCheckedChange={() => handleNotificationChange("push")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Campaign Updates</p>
            <p className="text-sm text-gray-500">
              Get notified about new campaigns and updates
            </p>
          </div>
          <Switch
            checked={notifications.campaigns}
            onCheckedChange={() => handleNotificationChange("campaigns")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Payment Notifications</p>
            <p className="text-sm text-gray-500">
              Get notified about payments and earnings
            </p>
          </div>
          <Switch
            checked={notifications.payments}
            onCheckedChange={() => handleNotificationChange("payments")}
          />
        </div>
      </div>
      <Button type="submit">Save Preferences</Button>
    </form>
  );
}
