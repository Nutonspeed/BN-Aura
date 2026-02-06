// WebSocket fallback using Supabase Realtime
// This replaces Socket.IO which is not supported in v0 environment

import { createClient } from '@/lib/supabase/client';

export class WebSocketFallback {
  private supabase: ReturnType<typeof createClient>;
  private channels: Map<string, any> = new Map();

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Subscribe to real-time updates for a specific table
   */
  subscribe(channelName: string, table: string, callback: (payload: any) => void) {
    if (this.channels.has(channelName)) {
      console.warn(`[v0] Channel ${channelName} already subscribed`);
      return;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log('[v0] Realtime event:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    console.log(`[v0] Subscribed to ${channelName} (${table})`);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`[v0] Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Broadcast message to a channel (using Supabase Broadcast)
   */
  async broadcast(channelName: string, event: string, payload: any) {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      // Create broadcast channel if not exists
      channel = this.supabase.channel(channelName);
      await channel.subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: event,
      payload: payload,
    });

    console.log(`[v0] Broadcasted ${event} to ${channelName}`);
  }

  /**
   * Listen to broadcast messages
   */
  onBroadcast(channelName: string, event: string, callback: (payload: any) => void) {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = this.supabase
        .channel(channelName)
        .on('broadcast', { event: event }, ({ payload }) => {
          callback(payload);
        })
        .subscribe();
      
      this.channels.set(channelName, channel);
    }

    console.log(`[v0] Listening to broadcasts on ${channelName}:${event}`);
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.channels.size > 0;
  }

  /**
   * Disconnect all channels
   */
  async disconnectAll() {
    for (const [name, channel] of this.channels) {
      await this.supabase.removeChannel(channel);
      console.log(`[v0] Disconnected ${name}`);
    }
    this.channels.clear();
  }
}

// Singleton instance
let websocketFallback: WebSocketFallback | null = null;

export function getWebSocketFallback(): WebSocketFallback {
  if (!websocketFallback) {
    websocketFallback = new WebSocketFallback();
  }
  return websocketFallback;
}

export default WebSocketFallback;
