/**
 * Realtime Event Broadcaster for Multi-Tenant Workflow System
 * Handles hierarchical channels and event distribution
 */

import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkflowEvent {
  id: string;
  event_type: string;
  workflow_id?: string;
  clinic_id: string;
  event_data: any;
  created_at: string;
  channel_hierarchy?: string[];
  target_users?: string[];
  target_roles?: string[];
  broadcast?: boolean;
}

export interface EventSubscription {
  userId: string;
  channels: string[];
  onEvent: (event: WorkflowEvent) => void;
  onError?: (error: Error) => void;
}

class RealtimeEventBroadcaster {
  private supabase = createClient();
  private subscriptions = new Map<string, RealtimeChannel>();
  private eventHandlers = new Map<string, (event: WorkflowEvent) => void>();

  /**
   * Subscribe to workflow events for a user
   */
  async subscribe(subscription: EventSubscription): Promise<RealtimeChannel> {
    const { userId, channels, onEvent, onError } = subscription;
    
    // Get user's channels from database
    const userChannels = await this.getUserChannels(userId);
    const allChannels = [...new Set([...channels, ...userChannels])];
    
    // Create channel name
    const channelName = `workflow_events:${userId}`;
    
    // Create Supabase realtime channel
    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'workflow_event' }, (payload) => {
        const event = payload.payload as WorkflowEvent;
        onEvent(event);
        
        // Also call any additional handlers
        const handler = this.eventHandlers.get(userId);
        if (handler) {
          handler(event);
        }
      })
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'workflow_events',
          filter: `clinic_id=eq.${allChannels.find(c => c.startsWith('clinic:'))?.split(':')[1]}`
        }, 
        (payload) => {
          // Handle new workflow events
          const event = payload.new as WorkflowEvent;
          
          // Check if user should receive this event
          if (this.shouldReceiveEvent(event, userId, allChannels)) {
            onEvent(event);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`User ${userId} subscribed to workflow events`);
        } else if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Failed to subscribe to workflow events'));
        }
      });
    
    this.subscriptions.set(userId, channel);
    return channel;
  }

  /**
   * Unsubscribe user from events
   */
  unsubscribe(userId: string): void {
    const channel = this.subscriptions.get(userId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.subscriptions.delete(userId);
      this.eventHandlers.delete(userId);
    }
  }

  /**
   * Broadcast a workflow event
   */
  async broadcastEvent(
    eventType: string,
    workflowId?: string,
    eventData?: any,
    targetUsers?: string[],
    targetRoles?: string[],
    broadcast?: boolean
  ): Promise<void> {
    // Call database function to create event
    const { error } = await this.supabase.rpc('create_workflow_event', {
      p_event_type: eventType,
      p_workflow_id: workflowId || null,
      p_event_data: eventData || {},
      p_target_users: targetUsers || [],
      p_target_roles: targetRoles || [],
      p_broadcast: broadcast || false
    });

    if (error) {
      console.error('Failed to broadcast event:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription channels
   */
  private async getUserChannels(userId: string): Promise<string[]> {
    try {
      // Try RPC call first
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('get_user_channels', {
        p_user_id: userId
      });
      
      // If RPC succeeds, return the data
      if (!rpcError && rpcData) {
        return rpcData;
      }
      
      // If RPC fails, use fallback method
      console.warn('RPC get_user_channels failed, using fallback method:', rpcError?.message);
      
      // Get user clinic information
      const { data: staffData } = await this.supabase
        .from('clinic_staff')
        .select('clinic_id, role')
        .eq('user_id', userId)
        .single();
      
      if (!staffData?.clinic_id) {
        return [];
      }
      
      // Build channels based on user's clinic and role
      const channels: string[] = [
        `clinic:${staffData.clinic_id}`,
        `role:${staffData.role}`
      ];
      
      return channels;
    } catch (err) {
      console.error('Error in getUserChannels:', err);
      return [];
    }
  }

  /**
   * Check if user should receive an event
   */
  private shouldReceiveEvent(
    event: WorkflowEvent, 
    userId: string, 
    userChannels: string[]
  ): boolean {
    // Check if user is directly targeted
    if (event.event_data?.target_users?.includes(userId)) {
      return true;
    }

    // Check if event is broadcast to user's channels
    for (const channel of userChannels) {
      if (event.channel_hierarchy?.includes(channel)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add additional event handler for a user
   */
  addEventHandler(userId: string, handler: (event: WorkflowEvent) => void): void {
    this.eventHandlers.set(userId, handler);
  }

  /**
   * Get recent events for a user
   */
  async getRecentEvents(userId: string, limit: number = 50): Promise<WorkflowEvent[]> {
    try {
      // Try RPC call first
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('subscribe_to_workflow_events', {
        p_user_id: userId
      });
      
      // If RPC succeeds, return the data
      if (!rpcError && rpcData) {
        return rpcData;
      }
      
      // If RPC fails, use fallback polling method
      console.warn('RPC method failed, using fallback polling for events:', rpcError?.message);
      
      // Get user clinic information
      const { data: userData } = await this.supabase
        .from('users')
        .select('id, clinic_id')
        .eq('id', userId)
        .single();
        
      const { data: staffData } = await this.supabase
        .from('clinic_staff')
        .select('clinic_id, role')
        .eq('user_id', userId)
        .single();
        
      const clinicId = userData?.clinic_id || staffData?.clinic_id;
      
      if (!clinicId) {
        console.warn('No clinic ID found for user, returning empty events');
        return [];
      }
      
      // Direct query to workflow_events
      const { data, error } = await this.supabase
        .from('workflow_events')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Failed to get events (fallback):', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Error in getRecentEvents:', err);
      return [];
    }
  }

  /**
   * Get real-time stats for clinic dashboard
   */
  async getClinicStats(clinicId: string): Promise<any> {
    const { data, error } = await this.supabase.rpc('get_realtime_workflow_stats', {
      p_clinic_id: clinicId
    });

    if (error) {
      console.error('Failed to get clinic stats:', error);
      return null;
    }

    return data;
  }

  /**
   * Cleanup old connections
   */
  cleanup(): void {
    for (const [userId, channel] of this.subscriptions) {
      this.supabase.removeChannel(channel);
    }
    this.subscriptions.clear();
    this.eventHandlers.clear();
  }
}

// Singleton instance
export const eventBroadcaster = new RealtimeEventBroadcaster();

// React hook for using the broadcaster
export function useWorkflowEvents(userId: string, onEvent: (event: WorkflowEvent) => void) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    const subscribe = async () => {
      try {
        await eventBroadcaster.subscribe({
          userId,
          channels: [],
          onEvent,
          onError: (err) => setError(err)
        });
        setIsSubscribed(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    subscribe();

    return () => {
      eventBroadcaster.unsubscribe(userId);
      setIsSubscribed(false);
    };
  }, [userId, onEvent]);

  return { isSubscribed, error };
}

// Import useState and useEffect
import { useState, useEffect } from 'react';
