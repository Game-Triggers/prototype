"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import StreakBadge from "@/components/ui/streak";
import { EnergyPack } from "@/components/ui/energy-pack";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface UserType {
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}
 
interface TopNavProps {
  toggleSidebar: () => void;
  user?: UserType;
}

export function TopNav({ toggleSidebar, user }: TopNavProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md md:hidden hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:flex items-center text-sm">
            <div className="ml-2 font-medium">
              {user?.role === 'streamer' ? 'Streamer Dashboard' : 
               user?.role === 'brand' ? 'Brand Dashboard' : 'Admin Dashboard'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <EnergyPack />

          <StreakBadge />

          <ThemeToggle />

          {user && (
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <div className="overflow-hidden rounded-full bg-muted">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground">
                      <span className="text-sm font-medium">
                        {user.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User'}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-md border bg-card shadow-lg">
                  <div className="p-2 border-b md:hidden">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-accent text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}