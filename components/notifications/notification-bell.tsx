"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, X, Check, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/lib/hooks/use-notifications';
import type { Notification } from '@/lib/hooks/use-notifications';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'campaign':
      return '🎯';
    case 'earnings':
      return '💰';
    case 'withdrawal':
      return '💳';
    case 'kyc':
      return '🆔';
    case 'payment':
      return '💸';
    case 'dispute':
      return '⚠️';
    default:
      return '📢';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-blue-500';
    default:
      return 'bg-indigo-500';
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  compact = false,
  showActions = true 
}: NotificationItemProps) {
  const handleAction = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  const content = (
    <div 
      className={`flex items-start gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
        !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex-shrink-0 text-lg">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={`text-sm font-medium truncate ${
              !notification.isRead ? 'text-slate-900' : 'text-slate-600'
            }`}>
              {notification.title}
            </h4>
            <p className={`text-xs mt-1 ${
              compact ? 'line-clamp-1' : 'line-clamp-2'
            } ${!notification.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
              {notification.message}
            </p>
          </div>
          
          {!notification.isRead && (
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)} flex-shrink-0 mt-1`} />
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">
            {formatTimeAgo(notification.createdAt)}
          </span>
          
          {showActions && (
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMarkAsRead(notification._id);
                  }}
                  className="h-6 w-6 p-0 hover:bg-green-100"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(notification._id);
                  }}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link 
        href={notification.actionUrl} 
        onClick={handleAction}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return <div onClick={handleAction}>{content}</div>;
}

export function NotificationBell() {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const { 
    unreadCount, 
    fetchLatestNotifications, 
    markAsRead,
    loading 
  } = useNotifications();

  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);

  // Handle hover with delay
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(async () => {
      if (isHovered) {
        const result = await fetchLatestNotifications();
        if (result) {
          setLatestNotifications(result.notifications);
          setShowPreview(true);
        }
      }
    }, 300); // 300ms delay
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Hide preview after a short delay
    setTimeout(() => {
      if (!isHovered) {
        setShowPreview(false);
      }
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 10 ? '10+' : unreadCount.toString();

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href="/dashboard/notifications">
        <Button
          variant="ghost"
          size="icon"
          className="relative p-2 rounded-md hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold min-w-[20px]"
            >
              {displayCount}
            </Badge>
          )}
        </Button>
      </Link>

      {/* Hover Preview */}
      {showPreview && (
        <div
          ref={previewRef}
          className="absolute right-0 mt-2 w-80 z-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          <Card className="shadow-lg border border-slate-200 bg-white">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-sm">Recent Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} unread
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPreview(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Loading notifications...
                  </div>
                ) : latestNotifications.length > 0 ? (
                  <>
                    {latestNotifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        compact={true}
                        showActions={false}
                      />
                    ))}
                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                      <Link 
                        href="/dashboard/notifications"
                        className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all notifications
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
