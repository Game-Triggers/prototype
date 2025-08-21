import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'campaign' | 'earnings' | 'streak' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    campaignId?: string;
    amount?: number;
    currency?: string;
    streakDay?: number;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    expiresAt?: string;
    category?: string;
  };
}

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  priority?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats;
  loading: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useNotifications(
  autoFetch: boolean = true,
  filters?: NotificationFilters
): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from notifications - ensure notifications is always an array
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const stats: NotificationStats = {
    total: notificationsArray.length,
    unread: notificationsArray.filter(n => !n.isRead).length,
    byType: notificationsArray.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriority: notificationsArray.reduce((acc, n) => {
      const priority = n.data?.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const unreadCount = stats.unread;

  const fetchNotifications = useCallback(async (fetchFilters?: NotificationFilters) => {
    if (!session) {
      setNotifications([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      const filtersToUse = fetchFilters || filters;
      
      if (filtersToUse) {
        Object.entries(filtersToUse).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `/api/v1/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      const notificationsData = data.notifications || data;
      // Ensure we always set an array
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [session, filters]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      return false;
    }
  }, [session]);

  const markMultipleAsRead = useCallback(async (notificationIds: string[]): Promise<boolean> => {
    if (!session || notificationIds.length === 0) return false;

    try {
      const response = await fetch('/api/v1/notifications/read/batch', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );

      return true;
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notifications as read');
      return false;
    }
  }, [session]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch('/api/v1/notifications/read/all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      return false;
    }
  }, [session]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));

      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      return false;
    }
  }, [session]);

  const refetch = useCallback(async () => {
    await fetchNotifications(filters);
  }, [fetchNotifications, filters]);

  // Auto-fetch on mount and when session changes
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [
    autoFetch,
    fetchNotifications
  ]);

  return {
    notifications: notificationsArray,
    unreadCount,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}

// Hook for getting just the unread count (useful for notification badges)
export function useUnreadNotificationCount(): {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!session) {
      setUnreadCount(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/notifications/count/unread', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }

      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch unread count');
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    refetch: fetchUnreadCount,
  };
}

// Hook for real-time notification updates
export function useNotificationRealtime(
  onNewNotification?: (notification: Notification) => void,
  onNotificationUpdate?: (notification: Notification) => void
) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    // In a real implementation, you would set up WebSocket or SSE connection here
    // For now, we'll use polling as a fallback
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/v1/notifications/latest', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.notification && onNewNotification) {
            onNewNotification(data.notification);
          }
        }
      } catch (err) {
        console.error('Error polling for new notifications:', err);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [session, onNewNotification, onNotificationUpdate]);
}
