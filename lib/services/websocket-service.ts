// WebSocket Client Service
// Client-side WebSocket management for real-time features

import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  category: 'system' | 'appointment' | 'message' | 'analytics' | 'security';
  actionUrl?: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  metadata?: any;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  type?: string;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'cursor_update' | 'selection_change';
  userId: string;
  channelId: string;
  data?: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners = new Map<string, ((...args: any[]) => void)[]>();

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get current session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const socketUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.bnaura.com' 
        : 'http://localhost:3000';

      this.socket = io(socketUrl, {
        path: '/api/socket/io',
        auth: {
          token: session.access_token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Socket not initialized'));

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connection:established');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnecting = false;
          this.emit('connection:error', error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection:lost', { reason });
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.handleReconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reestablished', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.emit('connection:reconnect_error', error);
    });

    // Notification events
    this.socket.on('notification', (data: { data: NotificationPayload }) => {
      this.emit('notification:received', data.data);
    });

    this.socket.on('notification_update', (data: { data: any }) => {
      this.emit('notification:update', data.data);
    });

    // Presence events
    this.socket.on('presence:update', (data: PresenceUpdate) => {
      this.emit('presence:update', data);
    });

    // Typing indicators
    this.socket.on('typing:indicator', (data: TypingIndicator) => {
      this.emit('typing:indicator', data);
    });

    // Collaboration events
    this.socket.on('collaboration:joined', (data: { channelId: string }) => {
      this.emit('collaboration:joined', data);
    });

    this.socket.on('collaboration:user_joined', (data: CollaborationEvent) => {
      this.emit('collaboration:user_joined', data);
    });

    this.socket.on('collaboration:user_left', (data: CollaborationEvent) => {
      this.emit('collaboration:user_left', data);
    });

    // Analytics events
    this.socket.on('analytics:update', (data: any) => {
      this.emit('analytics:update', data);
    });

    // Subscription events
    this.socket.on('subscription:success', (data: { rooms: string[] }) => {
      this.emit('subscription:success', data);
    });

    this.socket.on('subscription:error', (data: { message: string }) => {
      this.emit('subscription:error', data);
    });
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection:failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleReconnect();
      }
    }, delay);
  }

  /**
   * Subscribe to notifications with filters
   */
  subscribeToNotifications(filters?: {
    clinicId?: string;
    role?: string;
  }): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:notifications', filters);
  }

  /**
   * Send analytics event
   */
  sendAnalyticsEvent(event: {
    type: 'user_action' | 'system_event' | 'performance_metric';
    category: string;
    action: string;
    data: any;
  }): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send analytics event: WebSocket not connected');
      return;
    }

    this.socket.emit('analytics:event', event);
  }

  /**
   * Start typing indicator
   */
  startTyping(channelId: string, type?: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:start', { channelId, type });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(channelId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:stop', { channelId });
  }

  /**
   * Join collaboration channel
   */
  joinCollaboration(channelId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('collaboration:join', channelId);
  }

  /**
   * Leave collaboration channel
   */
  leaveCollaboration(channelId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('collaboration:leave', channelId);
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'away' | 'busy', metadata?: any): void {
    if (!this.socket?.connected) return;

    this.socket.emit('presence:update', { status, metadata });
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: any[]) => any): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => any): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send message to specific user (for internal use)
   */
  static sendToUser(userId: string, message: any): void {
    // This would be implemented on the server side
    // For client-side, we emit events to the server
    // This is a placeholder for server-side implementation
    console.log('Send to user:', userId, message);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
