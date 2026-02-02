import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface HotLeadNotification {
  id: string;
  name: string;
  email: string;
  score: number;
  category: string;
  created_at: string;
}

export function useHotLeadsRealtime(clinicId: string, onNewLead?: (lead: HotLeadNotification) => void) {
  useEffect(() => {
    if (!clinicId) return;

    const supabase = createClient();
    
    const channel = supabase
      .channel('hot_leads_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sales_leads',
        filter: `clinic_id=eq.${clinicId}`
      }, (payload) => {
        const newLead = payload.new as HotLeadNotification;
        
        // Only notify for hot leads (score >= 70)
        if (newLead.score && newLead.score >= 70) {
          // Show toast notification
          toast.success(`🔥 New Hot Lead: ${newLead.name}`, {
            description: `Score: ${newLead.score}% - ${newLead.email}`,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = `/sales/leads?highlight=${newLead.id}`;
              }
            }
          });
          
          // Play notification sound (if user preference allows)
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Ignore autoplay policy errors
            });
          } catch (err) {
            // Sound file not found or audio not supported
          }
          
          // Call optional callback
          if (onNewLead) {
            onNewLead(newLead);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sales_leads',
        filter: `clinic_id=eq.${clinicId}`
      }, (payload) => {
        const updatedLead = payload.new as HotLeadNotification;
        const oldLead = payload.old as HotLeadNotification;
        
        // Notify if lead became hot (score crossed 70 threshold)
        if (updatedLead.score >= 70 && oldLead.score < 70) {
          toast.warning(`⚡ Lead Heating Up: ${updatedLead.name}`, {
            description: `Score increased to ${updatedLead.score}%`,
            duration: 6000
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time hot leads notifications active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          toast.error('Real-time notifications unavailable', {
            description: 'Falling back to manual refresh'
          });
        }
      });

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [clinicId, onNewLead]);
}

/**
 * Hook for real-time lead status updates
 */
export function useLeadStatusRealtime(onStatusChange?: (leadId: string, newStatus: string) => void) {
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('lead_status_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sales_leads'
      }, (payload) => {
        const newLead = payload.new as { id: string; status: string };
        const oldLead = payload.old as { id: string; status: string };
        
        if (newLead.status !== oldLead.status && onStatusChange) {
          onStatusChange(newLead.id, newLead.status);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [onStatusChange]);
}
