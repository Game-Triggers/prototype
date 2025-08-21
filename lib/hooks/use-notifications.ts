import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'campaign' | 'earnings' | 'withdrawal' | 'kyc' | 'system' | 'payment' | 'dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export interface LatestNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const API_BASE = '/api/notifications';

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(async (
    page = 1,
    limit = 20,
    type?: string,
    isRead?: boolean
  ): Promise<NotificationResponse | null> => {
    if (!session) return null;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type) params.append('type', type);
      if (isRead !== undefined) params.append('isRead', isRead.toString());

      const response = await fetch(`${API_BASE}?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
        return data.data;
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch latest notifications for preview
  const fetchLatestNotifications = useCallback(async (): Promise<LatestNotificationsResponse | null> => {
    if (!session) return null;

    try {
      const response = await fetch(`${API_BASE}/latest`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch latest notifications: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
        return data.data;
      } else {
        throw new Error('Failed to fetch latest notifications');
      }
    } catch (err) {
      console.error('Error fetching latest notifications:', err);
      return null;
    }
  }, [session]);

  // Get unread count
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (!session) return 0;

    try {
      const response = await fetch(`${API_BASE}/count/unread`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
        return data.data.unreadCount;
      } else {
        throw new Error('Failed to fetch unread count');
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  }, [session]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch(`${API_BASE}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [session]);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (notificationIds: string[]): Promise<boolean> => {
    if (!session || notificationIds.length === 0) return false;

    try {
      const response = await fetch(`${API_BASE}/read/batch`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif._id)
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        
        // Refresh unread count
        await fetchUnreadCount();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error marking multiple notifications as read:', err);
      return false;
    }
  }, [session, fetchUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch(`${API_BASE}/read/all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [session]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch(`${API_BASE}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        const wasUnread = notifications.find(n => n._id === notificationId)?.isRead === false;
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [session, notifications]);

  // Create test notification (for development)
  const createTestNotification = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const response = await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create test notification: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh notifications
        await fetchNotifications();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating test notification:', err);
      return false;
    }
  }, [session, fetchNotifications]);
  const createTestNotification =
    process.env.NODE_ENV === 'development'
      ? useCallback(async (): Promise<boolean> => {
          if (!session) return false;

          try {
            const response = await fetch(`${API_BASE}/test`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to create test notification: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
              // Refresh notifications
              await fetchNotifications();
              return true;
            }
            return false;
          } catch (err) {
            console.error('Error creating test notification:', err);
            return false;
          }
        }, [session, fetchNotifications])
      : undefined;
  // Auto-fetch unread count on session change
  useEffect(() => {
    if (session) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [session, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchLatestNotifications,
    fetchUnreadCount,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    createTestNotification,
  };
}
