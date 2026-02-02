import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface SalesLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  score: number;
  category: 'hot' | 'warm' | 'cold';
  confidence: number;
  clinic_id: string;
  assigned_to?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function useSalesLeads(clinicId: string, options?: { enabled?: boolean }) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['sales-leads', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SalesLead[];
    },
    enabled: options?.enabled !== false && !!clinicId,
  });
}

export function useSalesLeadsByStatus(clinicId: string, status: string) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['sales-leads', clinicId, status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SalesLead[];
    },
    enabled: !!clinicId && !!status,
  });
}

export function useHotLeads(clinicId: string, limit = 5) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['hot-leads', clinicId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('score', 70)
        .order('score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as SalesLead[];
    },
    enabled: !!clinicId,
    staleTime: 2 * 60 * 1000, // 2 minutes for hot leads
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { data, error } = await supabase
        .from('sales_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();
      
      if (error) throw error;
      return data as SalesLead;
    },
    onMutate: async ({ leadId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sales-leads'] });
      
      // Snapshot previous values
      const previousLeads = queryClient.getQueryData(['sales-leads']);
      
      // Optimistically update all related queries
      queryClient.setQueriesData(
        { queryKey: ['sales-leads'] },
        (old: any) => {
          if (!old) return old;
          return old.map((lead: SalesLead) => 
            lead.id === leadId ? { ...lead, status } : lead
          );
        }
      );
      
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(['sales-leads'], context.previousLeads);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
    }
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation({
    mutationFn: async (lead: Partial<SalesLead>) => {
      const { data, error } = await supabase
        .from('sales_leads')
        .insert(lead)
        .select()
        .single();
      
      if (error) throw error;
      return data as SalesLead;
    },
    onSuccess: (newLead) => {
      // Add to cache
      queryClient.setQueryData(
        ['sales-leads', newLead.clinic_id],
        (old: SalesLead[] | undefined) => {
          if (!old) return [newLead];
          return [newLead, ...old];
        }
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      queryClient.invalidateQueries({ queryKey: ['hot-leads'] });
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('sales_leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
      return leadId;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueriesData(
        { queryKey: ['sales-leads'] },
        (old: SalesLead[] | undefined) => {
          if (!old) return old;
          return old.filter(lead => lead.id !== deletedId);
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
    }
  });
}

export function useUpdateLeadScore() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation({
    mutationFn: async ({ leadId, score, category }: { leadId: string; score: number; category: 'hot' | 'warm' | 'cold' }) => {
      const { data, error } = await supabase
        .from('sales_leads')
        .update({ score, category, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();
      
      if (error) throw error;
      return data as SalesLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      queryClient.invalidateQueries({ queryKey: ['hot-leads'] });
    }
  });
}
