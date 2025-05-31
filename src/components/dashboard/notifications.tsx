'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Bell, Check, ExternalLink, Filter } from 'lucide-react';

interface Notification {
  id: string;
  userPrivyId: string;
  type: 'sale_completed' | 'volume_surge' | 'offer_received' | 'user_activity';
  title: string;
  message: string;
  data: string;
  inAppSent: boolean;
  smsSent: boolean;
  telegramSent: boolean;
  createdAt: number;
  readAt?: number | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export default function Notifications() {
  const { ready, authenticated, user } = usePrivy();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchNotifications = async () => {
    if (!ready || !authenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        privyId: user.id,
        limit: '50',
        ...(filter === 'unread' && { unread: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data: NotificationsResponse = await response.json();
      
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notificationId, 
          markAsRead: true,
          privyId: user.id
        })
      });

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, readAt: Date.now() / 1000 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyId: user.id })
      });

      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: Date.now() / 1000 }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, user?.id, filter]);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale_completed': return '💰';
      case 'volume_surge': return '📈';
      case 'offer_received': return '🎯';
      case 'user_activity': return '👤';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'sale_completed': return 'bg-green-100 border-green-300';
      case 'volume_surge': return 'bg-blue-100 border-blue-300';
      case 'offer_received': return 'bg-purple-100 border-purple-300';
      case 'user_activity': return 'bg-orange-100 border-orange-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedType === 'all') return true;
    return n.type === selectedType;
  });

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Please log in to view notifications</p>
          <p className="text-sm text-gray-400">Connect your wallet or sign in to get started</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="sale_completed">Sales</option>
            <option value="offer_received">Offers</option>
            <option value="volume_surge">Volume Alerts</option>
            <option value="user_activity">User Activity</option>
          </select>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications found</p>
            <p className="text-sm text-gray-400 mt-1">
              When you start using the platform, notifications will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const isUnread = !notification.readAt;
              const parsedData = JSON.parse(notification.data);

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isUnread ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${isUnread ? 'text-gray-800' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          
                          {parsedData.collection && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">Collection:</span>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {parsedData.collection.slice(0, 8)}...{parsedData.collection.slice(-6)}
                              </code>
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-1">
                              {notification.inAppSent && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">App</span>
                              )}
                              {notification.smsSent && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">SMS</span>
                              )}
                              {notification.telegramSent && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Telegram</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          {isUnread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <div className={`w-2 h-2 rounded-full ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 