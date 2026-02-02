import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface BeauticianTask {
  id: string;
  workflow_id: string;
  assigned_to: string;
  task_type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  task_data?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  workflow_states?: {
    id: string;
    current_stage: string;
    customer_id: string;
    customers?: {
      id: string;
      full_name: string;
      phone: string;
    };
  };
}

/**
 * Hook to fetch beautician tasks with real-time updates
 */
export function useBeauticianTasks(status: string = 'pending', limit: number = 20) {
  return useQuery<BeauticianTask[]>({
    queryKey: ['beautician-tasks', status, limit],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?status=${status}&limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      return data.tasks || [];
    },
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 3000,
  });
}

/**
 * Hook to update task status
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      status, 
      notes 
    }: { 
      taskId: string; 
      status: string; 
      notes?: string;
    }) => {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, status, notes }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update task');
      }
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all task queries to refetch
      queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] });
      
      // Show success message
      if (variables.status === 'completed') {
        toast.success('Task completed successfully!');
      } else if (variables.status === 'in_progress') {
        toast.success('Task started');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to start treatment (update task + workflow)
 */
export function useStartTreatment() {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      workflowId, 
      beauticianId 
    }: { 
      taskId: string; 
      workflowId: string; 
      beauticianId: string;
    }) => {
      // Update task status
      await updateTask.mutateAsync({ 
        taskId, 
        status: 'in_progress' 
      });
      
      // Update workflow state
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'startTreatment',
          journeyId: workflowId,
          beauticianId,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to start treatment');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] });
      toast.success('Treatment started! Good luck! 💪');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to complete treatment (update task + workflow + trigger follow-up)
 */
export function useCompleteTreatment() {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      workflowId, 
      notes 
    }: { 
      taskId: string; 
      workflowId: string; 
      notes?: string;
    }) => {
      // Update task status
      await updateTask.mutateAsync({ 
        taskId, 
        status: 'completed',
        notes 
      });
      
      // Complete treatment in workflow (triggers follow-up + points)
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeTreatment',
          journeyId: workflowId,
          notes: notes || '',
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to complete treatment');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] });
      toast.success('Treatment completed! Follow-up scheduled and points awarded 🎉');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for real-time task updates via Supabase
 */
export function useTaskRealtime(userId: string | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_queue',
          filter: `assigned_to=eq.${userId}`,
        },
        (payload) => {
          console.log('New task assigned:', payload);
          toast.info('New task assigned to you!');
          queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_queue',
          filter: `assigned_to=eq.${userId}`,
        },
        (payload) => {
          console.log('Task updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, queryClient]);

  return useQuery({
    queryKey: ['realtime-tasks', userId],
    queryFn: () => null,
    enabled: false, // Don't actually fetch anything
  });
}
