// React Hook for Real-time Notifications
// Provides notification management with WebSocket integration

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import WebSocketService from '@/lib/services/websocket-service';
import NotificationService from '@/lib/services/notification-service';
import { NotificationPayload } from '@/lib/services/websocket-service';

interface UseNotificationsOptions {
  autoConnect?: boolean;
  filters?: {
    type?: string;
    priority?: string;
    category?: string;
    isRead?: boolean;
    limit?: number;
  };
}

interface NotificationState {
  notifications: NotificationPayload[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    autoConnect = true,
    filters = {}
  } = options;

  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: true,
    error: null,
    isConnected: false
  });

  const wsRef = useRef<any | null>(null);
  const isInitialized = useRef(false);

  // Initialize WebSocket connection
  const initializeConnection = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      wsRef.current = WebSocketService;
      
      // Set up event listeners
      wsRef.current.on('connection:established', () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        wsRef.current?.subscribeToNotifications();
      });

      wsRef.current.on('connection:error', (error: any) => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          error: 'Connection failed',
          isLoading: false 
        }));
      });

      wsRef.current.on('connection:lost', () => {
        setState(prev => ({ ...prev, isConnected: false }));
      });

      wsRef.current.on('connection:reestablished', () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        wsRef.current?.subscribeToNotifications();
      });

      wsRef.current.on('notification:received', (notification: NotificationPayload) => {
        setState(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications],
          unreadCount: prev.unreadCount + (notification.isRead ? 0 : 1)
        }));
      });

      wsRef.current.on('notification:update', (update: any) => {
        setState(prev => {
          switch (update.type) {
            case 'notification_read':
              return {
                ...prev,
                notifications: prev.notifications.map(n =>
                  n.id === update.notificationId ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, prev.unreadCount - 1)
              };
            
            case 'all_notifications_read':
              return {
                ...prev,
                notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
              };
            
            case 'notification_deleted':
              const deletedNotification = prev.notifications.find(n => n.id === update.notificationId);
              return {
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== update.notificationId),
                unreadCount: Math.max(0, prev.unreadCount - (deletedNotification?.isRead ? 0 : 1))
              };
            
            default:
              return prev;
          }
        });
      });

      // Connect if autoConnect is enabled
      if (autoConnect) {
        await wsRef.current.connect();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize notifications',
        isLoading: false
      }));
    }
  }, [autoConnect]);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // For now, we'll use mock data since NotificationService needs server-side implementation
      const mockNotifications: NotificationPayload[] = [
        {
          id: '1',
          type: 'info',
          title: 'Welcome to BN-Aura',
          message: 'Your account has been successfully set up',
          timestamp: new Date().toISOString(),
          priority: 'medium',
          isRead: false,
          category: 'system'
        }
      ];

      setState(prev => ({
        ...prev,
        notifications: mockNotifications,
        unreadCount: mockNotifications.filter(n => !n.isRead).length,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load notifications',
        isLoading: false
      }));
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));

      // Send to server
      await NotificationService.markAsRead(notificationId, 'current-user'); // This would get actual user ID
    } catch (error) {
      // Revert on error
      setState(prev => {
        const notification = prev.notifications.find(n => n.id === notificationId);
        return {
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === notificationId ? { ...n, isRead: false } : n
          ),
          unreadCount: prev.unreadCount + (notification?.isRead ? 0 : 1)
        };
      });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));

      // Send to server
      await NotificationService.markAllAsRead('current-user'); // This would get actual user ID
    } catch (error) {
      // Revert on error
      loadNotifications();
    }
  }, [loadNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notificationToDelete = state.notifications.find(n => n.id === notificationId);
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        unreadCount: Math.max(0, prev.unreadCount - (notificationToDelete?.isRead ? 0 : 1))
      }));

      // Send to server
      await NotificationService.deleteNotification(notificationId, 'current-user');
    } catch (error) {
      // Revert on error
      loadNotifications();
    }
  }, [state.notifications, loadNotifications]);

  // Send analytics event
  const trackEvent = useCallback((event: {
    type: 'user_action' | 'system_event' | 'performance_metric';
    category: string;
    action: string;
    data: any;
  }) => {
    wsRef.current?.sendAnalyticsEvent(event);
  }, []);

  // Update presence
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy', metadata?: any) => {
    wsRef.current?.updatePresence(status, metadata);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeConnection();
    loadNotifications();

    return () => {
      // Cleanup
      wsRef.current?.disconnect();
    };
  }, [initializeConnection, loadNotifications]);

  return {
    // State
    ...state,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    trackEvent,
    updatePresence,
    loadNotifications,
    
    // WebSocket service
    websocket: wsRef.current
  };
}

export default useNotifications;
