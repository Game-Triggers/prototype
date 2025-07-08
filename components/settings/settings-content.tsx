"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileSettings } from "./profile-settings";
import { NotificationSettings } from "./notification-settings";
import { AccountSettings } from "./account-settings";
import { OverlaySettings } from "./overlay-settings";

export function SettingsContent() {
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john@example.com",
    username: "johndoe",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    campaigns: true,
    payments: true,
  });

  const handleProfileSave = (data: any) => {
    setProfileData(data);
    // In a real app, you would send this to your API
    console.log("Profile updated:", data);
  };

  const handleNotificationSave = (settings: any) => {
    setNotifications(settings);
    // In a real app, you would send this to your API
    console.log("Notification settings updated:", settings);
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="overlay">Overlay</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings 
                initialData={profileData}
                onSave={handleProfileSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings 
                initialSettings={notifications}
                onSave={handleNotificationSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account security and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlay">
          <Card>
            <CardHeader>
              <CardTitle>Overlay Settings</CardTitle>
              <CardDescription>
                Manage your streaming overlay configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverlaySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Manage your payment methods and payout preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Payment Methods</h3>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                  <div>
                    <p className="font-medium">No payment methods added</p>
                    <p className="text-sm text-gray-500">
                      Add a payment method to get started
                    </p>
                  </div>
                  <Button>Add Method</Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">Payout Settings</h3>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                  <div>
                    <p className="font-medium">No payout method added</p>
                    <p className="text-sm text-gray-500">
                      Set up how you want to receive payments
                    </p>
                  </div>
                  <Button>Set Up</Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">Tax Information</h3>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                  <div>
                    <p className="font-medium">Tax information required</p>
                    <p className="text-sm text-gray-500">
                      Complete your tax profile
                    </p>
                  </div>
                  <Button variant="outline">Complete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
