// Notification Service for BN-Aura
// Handles real-time notifications with WebSocket integration and Redis caching

import { createAdminClient } from '@/lib/supabase/admin';
import { cache } from '@/lib/cache/redis';
import { ErrorHandler } from '@/lib/monitoring/sentry';
import WebSocketService from '@/lib/services/websocket-service';

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'message' | 'analytics' | 'system' | 'appointment' | 'security';
  data?: any;
  actionUrl?: string;
  expiresAt?: string;
  timestamp: string;
  isRead: boolean;
  userId: string;
  clinicId?: string;
}

export interface NotificationFilters {
  type?: NotificationData['type'];
  priority?: NotificationData['priority'];
  category?: NotificationData['category'];
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

class NotificationService {
  private static instance: NotificationService;
  private adminClient = createAdminClient();
  private websocketService = WebSocketService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a notification for multiple users
   */
  async createNotification(notificationData: {
    type?: NotificationData['type'];
    title: string;
    message: string;
    priority?: NotificationData['priority'];
    category?: 'message' | 'analytics' | 'system' | 'appointment' | 'security';
    targetUsers?: string[];
    userIds?: string[];
    data?: any;
    actionUrl?: string;
    expiresAt?: string;
  }): Promise<NotificationData[]> {
    try {
      const {
        type = 'info',
        title,
        message,
        priority = 'medium',
        category = 'message',
        targetUsers,
        userIds: providedUserIds,
        data,
        actionUrl,
        expiresAt
      } = notificationData;

      // Determine target users
      const usersToNotify = targetUsers || providedUserIds || [];
      
      if (usersToNotify.length === 0) {
        throw new Error('No target users specified for notification');
      }

      // Get user IDs if targetUsers provided (might be emails, roles, etc.)
      let userIds: string[] = [];
      if (targetUsers) {
        userIds = await this.resolveTargetUsers(targetUsers);
      } else {
        userIds = providedUserIds || [];
      }

      if (userIds.length === 0) {
        throw new Error('No target users found for notification');
      }

      // Create notifications for each user
      const notifications: NotificationData[] = [];
      const timestamp = new Date().toISOString();

      for (const userId of userIds) {
        const notificationPayload = {
          id: crypto.randomUUID(),
          type,
          title,
          message,
          priority,
          category,
          data,
          actionUrl,
          expiresAt,
          timestamp,
          isRead: false,
          userId,
          clinicId: await this.getUserClinicId(userId)
        };

        // Store in database
        const { error } = await this.adminClient
          .from('notifications')
          .insert(notificationPayload);

        if (error) {
          console.error('Failed to create notification:', error);
          continue;
        }

        notifications.push(notificationPayload);

        // Send real-time notification
        await this.sendRealTimeNotification(notificationPayload);
      }

      return notifications;
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<{
    notifications: NotificationData[];
    total: number;
    unreadCount: number;
  }> {
    try {
      // Check cache first
      const cacheKey = `notifications:${userId}:${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      let query = this.adminClient
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: notifications, error, count } = await query;

      if (error) {
        throw error;
      }

      // Get unread count
      const { count: unreadCount } = await this.adminClient
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      const result = {
        notifications: notifications || [],
        total: count || 0,
        unreadCount: unreadCount || 0
      };

      // Cache for 2 minutes
      await cache.setex(cacheKey, 120, JSON.stringify(result));

      return result;
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      return {
        notifications: [],
        total: 0,
        unreadCount: 0
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Clear cache
      await this.clearUserNotificationCache(userId);

      // Send real-time update
      await this.sendRealTimeUpdate(userId, { 
        type: 'notification_read',
        notificationId 
      });
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      // Clear cache
      await this.clearUserNotificationCache(userId);

      // Send real-time update
      await this.sendRealTimeUpdate(userId, { 
        type: 'all_notifications_read' 
      });
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Clear cache
      await this.clearUserNotificationCache(userId);

      // Send real-time update
      await this.sendRealTimeUpdate(userId, { 
        type: 'notification_deleted',
        notificationId 
      });
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send system notification to multiple users
   */
  async sendSystemNotification(
    data: {
      title: string;
      message: string;
      type?: NotificationData['type'];
      priority?: NotificationData['priority'];
      category?: NotificationData['category'];
      data?: any;
      actionUrl?: string;
    },
    targetUsers: string[]
  ): Promise<NotificationData[]> {
    return this.createNotification({
      ...data,
      targetUsers
    });
  }

  /**
   * Send real-time notification via WebSocket
   */
  private async sendRealTimeNotification(notification: NotificationData): Promise<void> {
    try {
      this.websocketService.sendToUser(notification.userId, {
        type: 'notification',
        data: notification
      });
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }
  }

  /**
   * Send real-time update via WebSocket
   */
  private async sendRealTimeUpdate(userId: string, update: any): Promise<void> {
    try {
      this.websocketService.sendToUser(userId, {
        type: 'notification_update',
        data: update
      });
    } catch (error) {
      console.error('Failed to send real-time update:', error);
    }
  }

  /**
   * Get user's clinic ID
   */
  private async getUserClinicId(userId: string): Promise<string | undefined> {
    try {
      const { data: user } = await this.adminClient
        .from('users')
        .select('clinic_id')
        .eq('id', userId)
        .single();

      return user?.clinic_id || undefined;
    } catch (error) {
      console.error('Failed to get user clinic ID:', error);
      return undefined;
    }
  }

  /**
   * Resolve target users (emails, roles, etc.) to user IDs
   */
  private async resolveTargetUsers(targetUsers: string[]): Promise<string[]> {
    const userIds: string[] = [];

    for (const target of targetUsers) {
      // If it's a UUID, treat as user ID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)) {
        userIds.push(target);
        continue;
      }

      // If it's an email, find user by email
      if (target.includes('@')) {
        const { data: users } = await this.adminClient
          .from('users')
          .select('id')
          .eq('email', target);

        if (users) {
          userIds.push(...users.map((u: any) => u.id));
        }
      }

      // If it's a role, find all users with that role
      const { data: users } = await this.adminClient
        .from('users')
        .select('id')
        .eq('role', target);

      if (users) {
        userIds.push(...users.map((u: any) => u.id));
      }
    }

    return [...new Set(userIds)]; // Remove duplicates
  }

  /**
   * Clear notification cache for a user
   */
  private async clearUserNotificationCache(userId: string): Promise<void> {
    try {
      // This is a simplified cache clearing
      // In production, you'd want to track cache keys more carefully
      const pattern = `notifications:${userId}:*`;
      // Note: Redis cache implementation would need pattern matching support
    } catch (error) {
      console.error('Failed to clear notification cache:', error);
    }
  }

  /**
   * Cleanup expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .not('expires_at', 'is', null);

      if (error) {
        throw error;
      }

      console.log('Cleaned up expired notifications');
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      console.error('Failed to cleanup expired notifications:', error);
    }
  }
}

export default NotificationService.getInstance();
