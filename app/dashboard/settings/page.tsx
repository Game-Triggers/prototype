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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationChange = (key: string) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key as keyof typeof notifications],
    });
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and how it appears on your
                profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                />
              </div>
              <Button className="mt-4">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive email updates about your account
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange("email")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={() => handleNotificationChange("push")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Campaign Updates</p>
                  <p className="text-sm text-gray-500">
                    Get notified about campaign status changes
                  </p>
                </div>
                <Switch
                  checked={notifications.campaigns}
                  onCheckedChange={() => handleNotificationChange("campaigns")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Notifications</p>
                  <p className="text-sm text-gray-500">
                    Get notified about payment events
                  </p>
                </div>
                <Switch
                  checked={notifications.payments}
                  onCheckedChange={() => handleNotificationChange("payments")}
                />
              </div>
              <Button className="mt-4">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Integrations</CardTitle>
              <CardDescription>
                Connect your streaming platforms and tools for in-stream
                sponsorships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Twitch</p>
                  <p className="text-sm text-gray-500">
                    Connect your Twitch account
                  </p>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">YouTube</p>
                  <p className="text-sm text-gray-500">
                    Connect your YouTube account
                  </p>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">OBS/Streamlabs</p>
                  <p className="text-sm text-gray-500">
                    Get your browser source URL
                  </p>
                </div>
                <Button variant="outline">Generate URL</Button>
              </div>
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
