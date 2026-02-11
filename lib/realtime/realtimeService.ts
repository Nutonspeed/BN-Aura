/**
 * BN-Aura Real-time Service
 * WebSocket-based real-time updates using Supabase Realtime
 */

import { createClient as createSupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export type RealtimeEvent = 
  | 'analysis_completed'
  | 'booking_created'
  | 'customer_updated'
  | 'quota_updated'
  | 'notification_received';

export interface RealtimePayload {
  event: RealtimeEvent;
  data: Record<string, unknown>;
  timestamp: string;
  clinicId: string;
}

type EventCallback = (payload: RealtimePayload) => void;

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<RealtimeEvent, Set<EventCallback>> = new Map();

  // Subscribe to clinic-specific events
  subscribeToClinic(clinicId: string): void {
    if (this.channels.has(clinicId)) return;

    const channel = supabase
      .channel(`clinic:${clinicId}`)
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        this.handleEvent(payload as RealtimePayload);
      })
      .subscribe();

    this.channels.set(clinicId, channel);
    console.log(`[Realtime] Subscribed to clinic: ${clinicId}`);
  }

  // Subscribe to table changes
  subscribeToTable(
    table: string,
    clinicId: string,
    callback: (payload: unknown) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`${table}:${clinicId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `clinic_id=eq.${clinicId}` },
        callback
      )
      .subscribe();

    return channel;
  }

  // Broadcast event to clinic
  async broadcast(clinicId: string, event: RealtimeEvent, data: Record<string, unknown>): Promise<void> {
    const channel = this.channels.get(clinicId);
    if (!channel) {
      console.warn(`[Realtime] No channel for clinic: ${clinicId}`);
      return;
    }

    await channel.send({
      type: 'broadcast',
      event: 'update',
      payload: { event, data, timestamp: new Date().toISOString(), clinicId },
    });
  }

  // Add event listener
  on(event: RealtimeEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event: RealtimeEvent, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  // Handle incoming events
  private handleEvent(payload: RealtimePayload): void {
    const callbacks = this.listeners.get(payload.event);
    callbacks?.forEach(cb => cb(payload));
  }

  // Unsubscribe from clinic
  unsubscribe(clinicId: string): void {
    const channel = this.channels.get(clinicId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(clinicId);
      console.log(`[Realtime] Unsubscribed from clinic: ${clinicId}`);
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach((channel, clinicId) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.listeners.clear();
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
