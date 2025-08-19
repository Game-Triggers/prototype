"use client";

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    default:
      return 'Low';
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

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'campaign':
      return 'Campaign';
    case 'earnings':
      return 'Earnings';
    case 'withdrawal':
      return 'Withdrawal';
    case 'kyc':
      return 'KYC';
    case 'payment':
      return 'Payment';
    case 'dispute':
      return 'Dispute';
    case 'system':
      return 'System';
    default:
      return 'Other';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  selected, 
  onSelect 
}: NotificationItemProps) {
  return (
    <Card className={`transition-all duration-200 ${
      !notification.isRead 
        ? 'border-l-4 border-l-blue-500 bg-blue-50/30' 
        : 'border-slate-200 hover:border-slate-300 bg-white'
    } ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(notification._id, e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          
          <div className="flex-shrink-0 text-2xl">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${
                    !notification.isRead ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {notification.title}
                  </h3>
                  
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(notification.type)}
                  </Badge>
                  
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} 
                       title={`${getPriorityLabel(notification.priority)} Priority`} />
                </div>
                
                <p className={`text-sm mb-3 ${
                  !notification.isRead ? 'text-slate-700' : 'text-slate-600'
                }`}>
                  {notification.message}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{formatTimeAgo(notification.createdAt)}</span>
                  {notification.readAt && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Read {formatTimeAgo(notification.readAt)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMarkAsRead(notification._id)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Read
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(notification._id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {notification.actionUrl && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <a
                  href={notification.actionUrl}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => !notification.isRead && onMarkAsRead(notification._id)}
                >
                  View Details →
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    createTestNotification,
  } = useNotifications();

  // Load notifications on component mount and filter changes
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const isReadFilter = statusFilter === 'read' ? true : statusFilter === 'unread' ? false : undefined;
      const typeFilterValue = typeFilter === 'all' ? undefined : typeFilter;
      
      const result = await fetchNotifications(currentPage, 20, typeFilterValue, isReadFilter);
      if (result?.pagination) {
        setTotalPages(result.pagination.pages);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter, fetchNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleSelectNotification = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedNotifications);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(notifications.map(n => n._id));
      setSelectedNotifications(allIds);
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleBulkMarkAsRead = async () => {
    const unreadSelected = notifications
      .filter(n => selectedNotifications.has(n._id) && !n.isRead)
      .map(n => n._id);
    
    if (unreadSelected.length > 0) {
      await markMultipleAsRead(unreadSelected);
      setSelectedNotifications(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
    await loadNotifications(); // Refresh the list
  };

  const allSelected = notifications.length > 0 && selectedNotifications.size === notifications.length;
  const someSelected = selectedNotifications.size > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your latest activities and updates
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => createTestNotification()}
            className="hidden md:flex"
          >
            <Bell className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
          
          <Button
            variant="outline"
            onClick={loadNotifications}
            disabled={loading || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading || isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="earnings">Earnings</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="kyc">KYC</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="dispute">Dispute</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({selectedNotifications.size})
                </span>
              </div>
              
              {someSelected && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkMarkAsRead}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark Read
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  onClick={markAllAsRead}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {loading || isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                selected={selectedNotifications.has(notification._id)}
                onSelect={handleSelectNotification}
              />
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
              <p className="text-muted-foreground mb-4">
                {typeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to see more notifications.'
                  : "You're all caught up! No notifications to show."}
              </p>
              {typeFilter !== 'all' || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => createTestNotification()}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Create Test Notification
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
