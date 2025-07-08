"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Change Password</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Update Password</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enhance your account security by enabling two-factor authentication.
        </p>
        <Button variant="outline">Enable 2FA</Button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Delete Account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all data associated with it.
        </p>
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
}
