import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * Real-time sync for sales leads
 * Listens to INSERT, UPDATE, DELETE events and invalidates React Query cache
 * Also shows toast notifications for team collaboration
 */
export function useLeadRealtimeSync(clinicId: string, enabled = true) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!enabled || !clinicId) return;

    const channel = supabase
      .channel(`leads:${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_leads',
          filter: `clinic_id=eq.${clinicId}`
        },
        (payload) => {
          // Invalidate all leads queries
          queryClient.invalidateQueries({ queryKey: ['sales-leads', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['sales-leads-infinite', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['hot-leads', clinicId] });

          // Show notification
          const lead = payload.new as any;
          if (lead.score >= 70) {
            toast.success('🔥 New Hot Lead!', {
              description: `${lead.name} (Score: ${lead.score})`,
              duration: 5000
            });
          } else {
            toast.info('New lead added', {
              description: lead.name,
              duration: 3000
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales_leads',
          filter: `clinic_id=eq.${clinicId}`
        },
        (payload) => {
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['sales-leads', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['sales-leads-infinite', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['hot-leads', clinicId] });

          // Show notification for status changes
          const oldLead = payload.old as any;
          const newLead = payload.new as any;

          if (oldLead.status !== newLead.status) {
            toast.info('Lead updated', {
              description: `${newLead.name} → ${newLead.status}`,
              duration: 3000
            });
          }

          // Notify if score increased significantly
          if (newLead.score >= 70 && oldLead.score < 70) {
            toast.success('Lead became HOT! 🔥', {
              description: `${newLead.name} (Score: ${newLead.score})`,
              duration: 5000
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sales_leads',
          filter: `clinic_id=eq.${clinicId}`
        },
        (payload) => {
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['sales-leads', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['sales-leads-infinite', clinicId] });
          queryClient.invalidateQueries({ queryKey: ['hot-leads', clinicId] });

          const lead = payload.old as any;
          toast.info('Lead removed', {
            description: lead.name,
            duration: 3000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, enabled, queryClient, supabase]);
}

/**
 * Real-time presence for sales team
 * Shows who is currently online and working on leads
 */
export function useSalesPresence(clinicId: string, userId: string, userName: string) {
  const supabase = createClient();

  useEffect(() => {
    if (!clinicId || !userId) return;

    const channel = supabase.channel(`clinic:${clinicId}:presence`, {
      config: {
        presence: {
          key: userId
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlineUsers = Object.values(presenceState).flat();
        
        console.log('Online sales team:', onlineUsers.length);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== userId) {
            toast.info('Team member joined', {
              description: `${presence.user_name} is now online`,
              duration: 3000
            });
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== userId) {
            toast.info('Team member left', {
              description: `${presence.user_name} went offline`,
              duration: 3000
            });
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [clinicId, userId, userName, supabase]);
}

/**
 * Broadcast lead assignment to other team members
 */
export function broadcastLeadAssignment(
  clinicId: string,
  leadId: string,
  leadName: string,
  assignedTo: string,
  assignedToName: string
) {
  const supabase = createClient();
  
  const channel = supabase.channel(`clinic:${clinicId}:assignments`);
  
  channel.send({
    type: 'broadcast',
    event: 'lead_assigned',
    payload: {
      lead_id: leadId,
      lead_name: leadName,
      assigned_to: assignedTo,
      assigned_to_name: assignedToName,
      assigned_at: new Date().toISOString()
    }
  });
}

/**
 * Listen for lead assignments broadcast
 */
export function useLeadAssignmentListener(clinicId: string, onAssignment?: (data: any) => void) {
  const supabase = createClient();

  useEffect(() => {
    if (!clinicId) return;

    const channel = supabase
      .channel(`clinic:${clinicId}:assignments`)
      .on('broadcast', { event: 'lead_assigned' }, (payload) => {
        const data = payload.payload;
        
        toast.info('Lead assigned', {
          description: `${data.lead_name} → ${data.assigned_to_name}`,
          duration: 4000
        });

        if (onAssignment) {
          onAssignment(data);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, onAssignment, supabase]);
}
