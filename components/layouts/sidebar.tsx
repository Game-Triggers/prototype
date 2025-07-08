"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/schemas/user.schema";
import { 
  LayoutDashboard, 
  PieChart, 
  DollarSign, 
  Users, 
  Settings, 
  Menu, 
  X,
  Video,
  Target,
  Wallet,
  MonitorPlay
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole?: string;
}

export function Sidebar({ isOpen, toggleSidebar, userRole }: SidebarProps) {
  const pathname = usePathname();

  // Define navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics/advanced",
        icon: <PieChart className="h-5 w-5" />,
      },
      {
        name: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ];   
    const streamerItems = [
      {
        name: "Browse Campaigns",
        href: "/dashboard/campaigns",
        icon: <Target className="h-5 w-5" />,
      },
      {
        name: "My Campaigns",
        href: "/dashboard/campaigns/my-campaigns",
        icon: <Video className="h-5 w-5" />,
      },      {
        name: "Overlay Setup",
        href: "/dashboard/settings/overlay/overlay-help",
        icon: <MonitorPlay className="h-5 w-5" />,
      },
      {
        name: "Wallet & Earnings",
        href: "/dashboard/wallet",
        icon: <Wallet className="h-5 w-5" />,
      },
    ];

    const brandItems = [
      {
        name: "My Campaigns",
        href: "/dashboard/campaigns",
        icon: <Target className="h-5 w-5" />,
      },
      {
        name: "Create Campaign",
        href: "/dashboard/campaigns/create",
        icon: <Video className="h-5 w-5" />,
      },
      {
        name: "Streamers",
        href: "/dashboard/streamers",
        icon: <Users className="h-5 w-5" />,
      },
      {
        name: "Wallet & Payments",
        href: "/dashboard/wallet",
        icon: <Wallet className="h-5 w-5" />,
      },
    ];

    const adminItems = [
      {
        name: "All Campaigns",
        href: "/dashboard/admin/campaigns",
        icon: <Target className="h-5 w-5" />,
      },
      {
        name: "Users",
        href: "/dashboard/admin/users",
        icon: <Users className="h-5 w-5" />,
      },
      {
        name: "Finance",
        href: "/dashboard/admin/finance",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        name: "Reports",
        href: "/dashboard/admin/reports",
        icon: <PieChart className="h-5 w-5" />,
      },
    ];

    // Return navigation items based on user role
    if (userRole === UserRole.STREAMER) {
      return [...streamerItems, ...commonItems];
    } else if (userRole === UserRole.BRAND) {
      return [...brandItems, ...commonItems];
    } else if (userRole === UserRole.ADMIN) {
      return [...adminItems, ...commonItems];
    }

    // Default to common items
    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">Game Triggers</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              // More precise active route matching to prevent parent/child conflicts
              const isActive = (() => {
                // Exact match
                if (pathname === item.href) return true;
                
                // For non-exact matches, check if current path starts with item href
                // but ensure it's not a shorter parent route of the current path
                if (pathname?.startsWith(`${item.href}/`)) {
                  // Find any other nav item that's a more specific match
                  const moreSpecificMatch = navItems.find(navItem => 
                    navItem.href !== item.href && 
                    navItem.href.startsWith(item.href) && 
                    (pathname === navItem.href || pathname?.startsWith(`${navItem.href}/`))
                  );
                  
                  // Only highlight this item if there's no more specific match
                  return !moreSpecificMatch;
                }
                
                return false;
              })();
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>          <div className="mt-auto px-3 py-4">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Gametriggers
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        className="fixed bottom-4 right-4 md:hidden z-50 p-3 bg-primary rounded-full shadow-lg text-primary-foreground"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}