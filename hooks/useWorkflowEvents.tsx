/**
 * React Hook for Workflow Events
 * Provides real-time updates for workflow changes
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { eventBroadcaster, WorkflowEvent } from '@/lib/realtime/eventBroadcaster';
import { useAuth } from './useAuth';

export interface UseWorkflowEventsOptions {
  onStageChange?: (workflowId: string, oldStage: string, newStage: string) => void;
  onCommissionEarned?: (workflowId: string, amount: number) => void;
  onTreatmentScheduled?: (workflowId: string, schedule: any) => void;
  onMessageReceived?: (workflowId: string, message: any) => void;
  onError?: (error: Error) => void;
}

export function useWorkflowEvents(options: UseWorkflowEventsOptions = {}) {
  const { user } = useAuth();
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleEvent = useCallback((event: WorkflowEvent) => {
    // Add to events list
    setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events

    // Handle specific event types
    switch (event.event_type) {
      case 'workflow_stage_changed':
        if (options.onStageChange) {
          options.onStageChange(
            event.workflow_id!,
            event.event_data.old_stage,
            event.event_data.new_stage
          );
        }
        break;

      case 'commission_earned':
        if (options.onCommissionEarned) {
          options.onCommissionEarned(
            event.workflow_id!,
            event.event_data.commission_amount
          );
        }
        break;

      case 'treatment_scheduled':
        if (options.onTreatmentScheduled) {
          options.onTreatmentScheduled(
            event.workflow_id!,
            event.event_data.schedule
          );
        }
        break;

      case 'message_received':
        if (options.onMessageReceived) {
          options.onMessageReceived(
            event.workflow_id!,
            event.event_data.message
          );
        }
        break;
    }
  }, [options]);

  useEffect(() => {
    if (!user?.id) return;

    const subscribe = async () => {
      try {
        await eventBroadcaster.subscribe({
          userId: user.id,
          channels: [],
          onEvent: handleEvent,
          onError: (err) => {
            setError(err);
            if (options.onError) {
              options.onError(err);
            }
          }
        });
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setIsConnected(false);
      }
    };

    subscribe();

    // Load recent events
    eventBroadcaster.getRecentEvents(user.id).then(recentEvents => {
      setEvents(recentEvents);
    });

    return () => {
      eventBroadcaster.unsubscribe(user.id);
      setIsConnected(false);
    };
  }, [user?.id, handleEvent, options.onError]);

  // Manual broadcast function
  const broadcast = useCallback(async (
    eventType: string,
    workflowId?: string,
    eventData?: any,
    targetUsers?: string[],
    targetRoles?: string[],
    broadcast?: boolean
  ) => {
    try {
      await eventBroadcaster.broadcastEvent(
        eventType,
        workflowId,
        eventData,
        targetUsers,
        targetRoles,
        broadcast
      );
    } catch (err) {
      setError(err as Error);
      if (options.onError) {
        options.onError(err as Error);
      }
    }
  }, [options.onError]);

  return {
    events,
    isConnected,
    error,
    broadcast
  };
}

// Hook for clinic-wide real-time stats
export function useClinicRealtimeStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    // Get clinic ID from user metadata or clinic_staff
    const clinicId = user?.user_metadata?.clinic_id || 
                    user?.app_metadata?.clinic_id;
    
    if (!clinicId) return;

    try {
      setLoading(true);
      const clinicStats = await eventBroadcaster.getClinicStats(clinicId);
      setStats(clinicStats);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();

    // Set up polling for stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
