"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileData {
  name: string;
  email: string;
  username: string;
}

interface ProfileSettingsProps {
  initialData: ProfileData;
  onSave?: (data: ProfileData) => void;
}

export function ProfileSettings({ initialData, onSave = () => {} }: ProfileSettingsProps) {
  const [profileData, setProfileData] = useState<ProfileData>(initialData);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profileData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            value={profileData.name}
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={profileData.email}
            onChange={handleProfileChange}
          />
        </div>
      </div>
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
