import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface WorkflowState {
  id: string;
  customer_id: string;
  clinic_id: string;
  current_stage: string;
  assigned_sales_id: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  customers?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

export interface WorkflowAction {
  id: string;
  workflow_id: string;
  from_stage: string;
  to_stage: string;
  performed_by: string;
  action_metadata: any;
  created_at: string;
}

/**
 * Hook to fetch workflow state for a customer
 */
export function useWorkflowState(customerId: string) {
  const supabase = createClient();

  return useQuery<WorkflowState | null>({
    queryKey: ['workflow-state', customerId],
    queryFn: async () => {
      if (!customerId) return null;

      try {
        const { data, error } = await supabase
          .from('workflow_states')
          .select(`
            *,
            customers (
              id,
              full_name,
              phone
            )
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // Silently handle errors - table might not exist yet
          return null;
        }

        return data;
      } catch (error) {
        // Handle 406 and other network errors silently
        return null;
      }
    },
    enabled: !!customerId,
    refetchInterval: false, // Disable auto-refetch to reduce errors
    retry: false, // Don't retry failed requests
  });
}

/**
 * Hook to fetch workflow history/actions
 */
export function useWorkflowHistory(workflowId: string) {
  const supabase = createClient();

  return useQuery<WorkflowAction[]>({
    queryKey: ['workflow-history', workflowId],
    queryFn: async () => {
      if (!workflowId) return [];

      const { data, error } = await supabase
        .from('workflow_actions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching workflow history:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!workflowId,
  });
}

/**
 * Hook to fetch all workflows for a clinic
 */
export function useClinicWorkflows(clinicId: string, status?: string) {
  const supabase = createClient();

  return useQuery<WorkflowState[]>({
    queryKey: ['clinic-workflows', clinicId, status],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from('workflow_states')
        .select(`
          *,
          customers (
            id,
            full_name,
            phone
          )
        `)
        .eq('clinic_id', clinicId)
        .order('updated_at', { ascending: false });

      if (status) {
        query = query.eq('current_stage', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching clinic workflows:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!clinicId,
    refetchInterval: 10000,
  });
}

/**
 * Hook to transition workflow to next stage
 */
export function useTransitionWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workflowId,
      toStage,
      metadata = {},
    }: {
      workflowId: string;
      toStage: string;
      metadata?: any;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current workflow state
      const { data: workflow, error: fetchError } = await supabase
        .from('workflow_states')
        .select('current_stage')
        .eq('id', workflowId)
        .single();

      if (fetchError) throw fetchError;

      // Update workflow state
      const { error: updateError } = await supabase
        .from('workflow_states')
        .update({
          current_stage: toStage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflowId);

      if (updateError) throw updateError;

      // Record action
      const { error: actionError } = await supabase
        .from('workflow_actions')
        .insert({
          workflow_id: workflowId,
          from_stage: workflow.current_stage,
          to_stage: toStage,
          performed_by: user.id,
          action_metadata: metadata,
        });

      if (actionError) throw actionError;

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-state'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history', variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['clinic-workflows'] });
      toast.success('Workflow updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update workflow');
    },
  });
}

/**
 * Hook to confirm payment and transition workflow
 */
export function useConfirmPayment() {
  const transitionWorkflow = useTransitionWorkflow();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workflowId,
      customerId,
      beauticianId,
      treatmentName,
      scheduledTime,
      amount,
      paymentMethod,
    }: {
      workflowId: string;
      customerId: string;
      beauticianId: string;
      treatmentName: string;
      scheduledTime: string;
      amount: number;
      paymentMethod: string;
    }) => {
      // 1. Transition workflow to payment_confirmed
      await transitionWorkflow.mutateAsync({
        workflowId,
        toStage: 'payment_confirmed',
        metadata: { amount, paymentMethod },
      });

      // 2. Create beautician task
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createTask',
          journeyId: workflowId,
          customerId,
          beauticianId,
          treatmentName,
          scheduledTime,
          priority: 'high',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-state'] });
      queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] });
      toast.success('Payment confirmed! Task assigned to beautician.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm payment');
    },
  });
}

/**
 * Get workflow stage display info
 */
export function getWorkflowStageInfo(stage: string) {
  const stages: Record<string, { label: string; color: string; icon: string }> = {
    lead_created: { label: 'New Lead', color: 'bg-blue-500', icon: '🆕' },
    scanned: { label: 'Scanned', color: 'bg-purple-500', icon: '📸' },
    proposal_sent: { label: 'Proposal Sent', color: 'bg-yellow-500', icon: '📄' },
    payment_confirmed: { label: 'Payment Confirmed', color: 'bg-green-500', icon: '💰' },
    treatment_scheduled: { label: 'Scheduled', color: 'bg-indigo-500', icon: '📅' },
    in_treatment: { label: 'In Treatment', color: 'bg-orange-500', icon: '⚡' },
    treatment_completed: { label: 'Completed', color: 'bg-emerald-500', icon: '✅' },
    follow_up: { label: 'Follow-up', color: 'bg-pink-500', icon: '📞' },
    completed: { label: 'Done', color: 'bg-gray-500', icon: '🎉' },
  };

  return stages[stage] || { label: stage, color: 'bg-gray-400', icon: '❓' };
}

/**
 * Get all workflow stages in order
 */
export function getWorkflowStages() {
  return [
    'lead_created',
    'scanned',
    'proposal_sent',
    'payment_confirmed',
    'treatment_scheduled',
    'in_treatment',
    'treatment_completed',
    'follow_up',
    'completed',
  ];
}

/**
 * Hook for real-time workflow updates
 */
export function useWorkflowRealtime(clinicId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!clinicId) return;

    const channel = supabase
      .channel('workflow-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_states',
          filter: `clinic_id=eq.${clinicId}`,
        },
        (payload) => {
          console.log('Workflow state changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['workflow-state'] });
          queryClient.invalidateQueries({ queryKey: ['clinic-workflows'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_events',
          filter: `clinic_id=eq.${clinicId}`,
        },
        (payload) => {
          console.log('Workflow event:', payload);
          toast.info('New workflow event');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, supabase, queryClient]);

  return useQuery({
    queryKey: ['realtime-workflow', clinicId],
    queryFn: () => null,
    enabled: false,
  });
}
