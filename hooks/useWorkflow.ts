/**
 * Workflow Integration Hook
 * Phase 7: Cross-Role Workflow Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  UnifiedWorkflow, 
  WorkflowTask, 
  CreateWorkflowRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateWorkflowStageRequest,
  WorkflowFilters,
  TaskFilters
} from '@/types/workflow';

interface UseWorkflowReturn {
  workflows: UnifiedWorkflow[];
  tasks: WorkflowTask[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createWorkflow: (request: CreateWorkflowRequest) => Promise<UnifiedWorkflow | null>;
  updateWorkflowStage: (request: UpdateWorkflowStageRequest) => Promise<void>;
  createTask: (request: CreateTaskRequest) => Promise<WorkflowTask | null>;
  updateTask: (request: UpdateTaskRequest) => Promise<void>;
  
  // Refresh
  refreshWorkflows: () => Promise<void>;
  refreshTasks: (taskFilters?: TaskFilters) => Promise<void>;
}

export function useWorkflow(filters?: WorkflowFilters): UseWorkflowReturn {
  const [workflows, setWorkflows] = useState<UnifiedWorkflow[]>([]);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem('supabase_token');
  };

  const refreshWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters?.stage) queryParams.append('stage', filters.stage);
      if (filters?.assigned_sales) queryParams.append('assigned_sales', filters.assigned_sales);
      if (filters?.assigned_beautician) queryParams.append('assigned_beautician', filters.assigned_beautician);
      if (filters?.priority_level) queryParams.append('priority_level', filters.priority_level);
      if (filters?.date_from) queryParams.append('date_from', filters.date_from);
      if (filters?.date_to) queryParams.append('date_to', filters.date_to);
      if (filters?.customer_search) queryParams.append('customer_search', filters.customer_search);

      const response = await fetch(`/api/workflow/enhanced?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }

      const data = await response.json();
      setWorkflows(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error refreshing workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshTasks = useCallback(async (taskFilters?: TaskFilters) => {
    try {
      setError(null);

      const queryParams = new URLSearchParams();
      if (taskFilters?.assigned_to) queryParams.append('assigned_to', taskFilters.assigned_to);
      if (taskFilters?.status) queryParams.append('status', taskFilters.status);
      if (taskFilters?.task_type) queryParams.append('task_type', taskFilters.task_type);
      if (taskFilters?.priority_level) queryParams.append('priority_level', taskFilters.priority_level);
      if (taskFilters?.due_from) queryParams.append('due_from', taskFilters.due_from);
      if (taskFilters?.due_to) queryParams.append('due_to', taskFilters.due_to);
      if (taskFilters?.workflow_id) queryParams.append('workflow_id', taskFilters.workflow_id);

      const response = await fetch(`/api/workflow/tasks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      setTasks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error refreshing tasks:', err);
    }
  }, []);

  const createWorkflow = useCallback(async (request: CreateWorkflowRequest): Promise<UnifiedWorkflow | null> => {
    try {
      setError(null);

      const response = await fetch('/api/workflow/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Refresh workflows to get the updated list
      await refreshWorkflows();
      
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating workflow:', err);
      return null;
    }
  }, [refreshWorkflows]);

  const updateWorkflowStage = useCallback(async (request: UpdateWorkflowStageRequest): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`/api/workflow/${request.workflow_id}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          new_stage: request.new_stage,
          notes: request.notes,
          assign_to: request.assign_to
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow stage: ${response.statusText}`);
      }

      // Refresh workflows to get the updated data
      await refreshWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating workflow stage:', err);
    }
  }, [refreshWorkflows]);

  const createTask = useCallback(async (request: CreateTaskRequest): Promise<WorkflowTask | null> => {
    try {
      setError(null);

      const response = await fetch('/api/workflow/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Refresh tasks to get the updated list
      await refreshTasks();
      
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating task:', err);
      return null;
    }
  }, [refreshTasks]);

  const updateTask = useCallback(async (request: UpdateTaskRequest): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`/api/workflow/tasks/${request.task_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          status: request.status,
          completion_notes: request.completion_notes,
          assigned_to: request.assigned_to,
          due_date: request.due_date
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      // Refresh tasks to get the updated data
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating task:', err);
    }
  }, [refreshTasks]);

  useEffect(() => {
    refreshWorkflows();
    refreshTasks();
  }, [refreshWorkflows, refreshTasks]);

  return {
    workflows,
    tasks,
    loading,
    error,
    createWorkflow,
    updateWorkflowStage,
    createTask,
    updateTask,
    refreshWorkflows,
    refreshTasks
  };
}

/**
 * Hook for creating workflows from skin analysis results
 */
export function useWorkflowFromScan() {
  const { createWorkflow } = useWorkflow();

  const createWorkflowFromScan = useCallback(async (
    customerId: string,
    scanResults: any,
    treatmentPlan?: any
  ) => {
    const request: CreateWorkflowRequest = {
      customer_id: customerId,
      scan_results: scanResults,
      treatment_plan: treatmentPlan,
      priority_level: 'normal',
      notes: 'Workflow created from skin analysis scan',
      auto_assign_beautician: true
    };

    return await createWorkflow(request);
  }, [createWorkflow]);

  return { createWorkflowFromScan };
}

/**
 * Hook for managing individual tasks
 */
export function useTaskManagement() {
  const { updateTask, createTask } = useWorkflow();

  const startTask = useCallback(async (taskId: string) => {
    return await updateTask({
      task_id: taskId,
      status: 'in_progress'
    });
  }, [updateTask]);

  const completeTask = useCallback(async (taskId: string, notes?: string) => {
    return await updateTask({
      task_id: taskId,
      status: 'completed',
      completion_notes: notes
    });
  }, [updateTask]);

  const assignTask = useCallback(async (
    workflowId: string,
    assignedTo: string,
    taskType: string,
    taskTitle: string,
    taskDescription?: string
  ) => {
    return await createTask({
      workflow_id: workflowId,
      assigned_to: assignedTo,
      task_type: taskType as any,
      task_title: taskTitle,
      task_description: taskDescription,
      priority_level: 'normal'
    });
  }, [createTask]);

  return {
    startTask,
    completeTask,
    assignTask
  };
}

/**
 * Hook for workflow stage transitions
 */
export function useWorkflowTransitions() {
  const { updateWorkflowStage } = useWorkflow();

  const moveToTreatmentScheduled = useCallback(async (
    workflowId: string,
    assignedBeautician?: string,
    notes?: string
  ) => {
    return await updateWorkflowStage({
      workflow_id: workflowId,
      new_stage: 'treatment_scheduled',
      assign_to: assignedBeautician,
      notes
    });
  }, [updateWorkflowStage]);

  const moveToInTreatment = useCallback(async (
    workflowId: string,
    notes?: string
  ) => {
    return await updateWorkflowStage({
      workflow_id: workflowId,
      new_stage: 'in_treatment',
      notes
    });
  }, [updateWorkflowStage]);

  const moveToCompleted = useCallback(async (
    workflowId: string,
    notes?: string
  ) => {
    return await updateWorkflowStage({
      workflow_id: workflowId,
      new_stage: 'completed',
      notes
    });
  }, [updateWorkflowStage]);

  const moveToFollowUp = useCallback(async (
    workflowId: string,
    notes?: string
  ) => {
    return await updateWorkflowStage({
      workflow_id: workflowId,
      new_stage: 'follow_up',
      notes
    });
  }, [updateWorkflowStage]);

  return {
    moveToTreatmentScheduled,
    moveToInTreatment,
    moveToCompleted,
    moveToFollowUp
  };
}
