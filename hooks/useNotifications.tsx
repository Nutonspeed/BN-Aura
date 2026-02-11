import { useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { NotificationType } from '@/lib/notifications/notificationEngine';

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

/**
 * Hook for handling in-app notifications with toast display
 */
export function useNotifications() {
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to notification channel
    const channel = supabase
      .channel('notifications')
      .on('broadcast', { event: 'notification' }, (payload) => {
        const notification = payload.payload as NotificationData;
        showToastNotification(notification);
      })
      .subscribe();

    // Also listen for database changes
    const dbChannel = supabase
      .channel('db_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const notification = payload.new as NotificationData;
          showToastNotification(notification);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [supabase]);

  const showToastNotification = (notification: NotificationData) => {
    const { title, message, priority, type } = notification;

    // Choose toast type based on priority and notification type
    switch (priority) {
      case 'critical':
        toast.error(title, {
          description: message,
          duration: 10000, // 10 seconds for critical notifications
          action: {
            label: 'View',
            onClick: () => handleNotificationAction(notification)
          }
        });
        break;

      case 'high':
        toast.warning(title, {
          description: message,
          duration: 7000,
          action: {
            label: 'View',
            onClick: () => handleNotificationAction(notification)
          }
        });
        break;

      case 'medium':
        toast.info(title, {
          description: message,
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => handleNotificationAction(notification)
          }
        });
        break;

      case 'low':
      default:
        toast.success(title, {
          description: message,
          duration: 3000,
          action: {
            label: 'View',
            onClick: () => handleNotificationAction(notification)
          }
        });
        break;
    }
  };

  const handleNotificationAction = (notification: NotificationData) => {
    // Mark as read and navigate based on notification type
    markAsRead(notification.id);

    switch (notification.type) {
      case NotificationType.HOT_LEAD_ASSIGNED:
        // Navigate to sales dashboard
        window.location.href = '/th/sales';
        break;

      case NotificationType.QUOTA_WARNING:
        // Navigate to settings/quotas
        window.location.href = '/th/clinic/settings';
        break;

      case NotificationType.SLA_BREACH:
        // Navigate to analytics
        window.location.href = '/th/clinic/analytics/advanced';
        break;

      case NotificationType.PAYMENT_FAILED:
        // Navigate to revenue page
        window.location.href = '/th/clinic/revenue';
        break;

      default:
        // Stay on current page
        break;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return {
    showToastNotification,
    markAsRead
  };
}

/**
 * Utility function to show toast from anywhere in the app
 */
export const showNotification = {
  success: (title: string, message?: string) => {
    toast.success(title, { description: message });
  },

  error: (title: string, message?: string) => {
    toast.error(title, { description: message });
  },

  warning: (title: string, message?: string) => {
    toast.warning(title, { description: message });
  },

  info: (title: string, message?: string) => {
    toast.info(title, { description: message });
  }
};
