import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface SalesPresence {
  userId: string;
  onlineAt: string;
  status: 'online' | 'busy' | 'away';
  user_metadata?: any;
}

export function useSalesPresence(clinicId: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<SalesPresence[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!clinicId || !userId) return;

    const channel = supabase.channel(`clinic:${clinicId}:sales_presence`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users: SalesPresence[] = [];
        
        for (const key in newState) {
          const state = newState[key] as any[];
          if (state && state.length > 0) {
            users.push({
              userId: key,
              onlineAt: state[0].onlineAt,
              status: state[0].status || 'online',
              user_metadata: state[0].user_metadata
            });
          }
        }
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const joined = newPresences[0] as any;
        console.log('User joined:', key, joined);
        // Optional: Toast notification for specific users
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            onlineAt: new Date().toISOString(),
            status: 'online',
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [clinicId, userId]);

  return { onlineUsers };
}

export function useLeadRealtimeSync(clinicId: string, currentUserId: string) {
  useEffect(() => {
    if (!clinicId) return;

    const supabase = createClient();
    
    const channel = supabase
      .channel(`leads:${clinicId}:updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales_leads',
          filter: `clinic_id=eq.${clinicId}`
        },
        (payload) => {
          const newLead = payload.new as any;
          
          // Don't notify if the update was made by the current user
          if (newLead.updated_by === currentUserId) return;

          // Show toast notification
          toast.info(`Lead Updated`, {
            description: `${newLead.name} was updated just now.`,
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload() // Or invalidate query
            }
          });
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [clinicId, currentUserId]);
}
