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

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriority: notifications.reduce((acc, n) => {
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

      const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed to mark notification as read: ${response.status}`);

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
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
      const response = await fetch('/api/notifications/read/batch', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });
      if (!response.ok) throw new Error(`Failed to mark notifications as read: ${response.status}`);

      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id) ? { ...notification, isRead: true } : notification
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
      const response = await fetch('/api/notifications/read/all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed to mark all notifications as read: ${response.status}`);

      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
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
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed to delete notification: ${response.status}`);

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

  useEffect(() => {
    if (autoFetch) fetchNotifications();
  }, [autoFetch, fetchNotifications]);

  return {
    notifications,
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

// --- Unread count hook ---
export function useUnreadNotificationCount() {
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
    try {
      const response = await fetch('/api/notifications/count/unread', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch unread count: ${response.status}`);
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

  return { unreadCount, loading, error, refetch: fetchUnreadCount };
}

// --- Real-time hook (polling fallback) ---
export function useNotificationRealtime(
  onNewNotification?: (notification: Notification) => void
) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/notifications/latest', {
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
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [session, onNewNotification]);
}
