'use client';

import { useState, useCallback, useEffect } from 'react';
import { WorkflowState, WorkflowStage } from '@/lib/workflow/workflowEngine';
import { Task, TaskStatus, TaskPriority } from '@/lib/workflow/taskQueue';
import { DashboardEvent, EventPayload } from '@/lib/workflow/eventBroadcaster';

interface UseWorkflowReturn {
  workflows: WorkflowState[];
  currentWorkflow: WorkflowState | null;
  loading: boolean;
  error: string | null;
  
  // Workflow operations
  createWorkflow: (params: CreateWorkflowParams) => Promise<void>;
  executeTransition: (workflowId: string, actionType: string, data?: any, notes?: string) => Promise<void>;
  getWorkflow: (workflowId: string) => Promise<void>;
  listWorkflows: (stage?: WorkflowStage, assignedTo?: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  refreshWorkflows: () => Promise<void>;
}

interface CreateWorkflowParams {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  assignedSalesId?: string;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Task operations
  createTask: (params: CreateTaskParams) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, notes?: string) => Promise<void>;
  getMyTasks: (status?: TaskStatus[], priority?: TaskPriority[]) => Promise<void>;
  getWorkflowTasks: (workflowId: string, includeCompleted?: boolean) => Promise<void>;
  
  // Statistics
  pendingCount: number;
  highPriorityCount: number;
  overdueCount: number;
  
  // Utility
  clearError: () => void;
  refreshTasks: () => Promise<void>;
}

interface CreateTaskParams {
  workflowId: string;
  assignedTo: string;
  taskType: string;
  customerName: string;
  priority?: TaskPriority;
  dueDate?: Date;
  taskData?: Record<string, any>;
  notes?: string;
}

interface UseWorkflowEventsReturn {
  events: EventPayload[];
  loading: boolean;
  error: string | null;
  
  // Event operations
  broadcastEvent: (params: BroadcastEventParams) => Promise<void>;
  getEventHistory: (workflowId: string, eventTypes?: DashboardEvent[], limit?: number) => Promise<void>;
  
  // Real-time subscription
  subscribe: (callback: (event: EventPayload) => void) => () => void;
  
  // Utility
  clearError: () => void;
}

interface BroadcastEventParams {
  workflowId: string;
  eventType: DashboardEvent;
  targetUsers: string[];
  eventData: any;
}

/**
 * Hook สำหรับจัดการ Workflows
 */
export function useWorkflow(): UseWorkflowReturn {
  const [workflows, setWorkflows] = useState<WorkflowState[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = useCallback(async (params: CreateWorkflowParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_workflow',
          data: params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCurrentWorkflow(result.workflow);
        // Refresh workflows list
        await listWorkflows();
      } else {
        throw new Error(result.error || 'Failed to create workflow');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      setError(errorMessage);
      console.error('Create Workflow Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeTransition = useCallback(async (
    workflowId: string,
    actionType: string,
    data?: any,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_transition',
          workflowId,
          data: {
            actionType,
            actionData: data,
            notes
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCurrentWorkflow(result.workflow);
        // Update workflows list if the current workflow is in it
        setWorkflows(prev => 
          prev.map(w => w.id === result.workflow.id ? result.workflow : w)
        );
      } else {
        throw new Error(result.error || 'Failed to execute transition');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute transition';
      setError(errorMessage);
      console.error('Execute Transition Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getWorkflow = useCallback(async (workflowId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_workflow',
          workflowId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCurrentWorkflow(result.workflow);
      } else {
        throw new Error(result.error || 'Failed to get workflow');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get workflow';
      setError(errorMessage);
      console.error('Get Workflow Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listWorkflows = useCallback(async (stage?: WorkflowStage, assignedTo?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_workflows',
          data: { stage, assignedTo }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setWorkflows(result.workflows);
      } else {
        throw new Error(result.error || 'Failed to list workflows');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list workflows';
      setError(errorMessage);
      console.error('List Workflows Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshWorkflows = useCallback(async () => {
    await listWorkflows();
  }, [listWorkflows]);

  return {
    workflows,
    currentWorkflow,
    loading,
    error,
    createWorkflow,
    executeTransition,
    getWorkflow,
    listWorkflows,
    clearError,
    refreshWorkflows
  };
}

/**
 * Hook สำหรับจัดการ Tasks
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (params: CreateTaskParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_task',
          workflowId: params.workflowId,
          data: {
            assignedTo: params.assignedTo,
            taskType: params.taskType,
            customerName: params.customerName,
            priority: params.priority,
            dueDate: params.dueDate?.toISOString(),
            taskData: params.taskData,
            notes: params.notes
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => [result.task, ...prev]);
      } else {
        throw new Error(result.error || 'Failed to create task');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      console.error('Create Task Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (
    taskId: string,
    status: TaskStatus,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_task_status',
          data: { taskId, status, notes }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => 
          prev.map(task => task.id === taskId ? result.task : task)
        );
      } else {
        throw new Error(result.error || 'Failed to update task status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
      setError(errorMessage);
      console.error('Update Task Status Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyTasks = useCallback(async (
    status?: TaskStatus[],
    priority?: TaskPriority[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        type: 'my_tasks'
      });

      if (status) {
        params.append('status', status.join(','));
      }

      if (priority) {
        params.append('priority', priority.join(','));
      }

      const response = await fetch(`/api/workflow/management?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTasks(result.tasks);
      } else {
        throw new Error(result.error || 'Failed to get tasks');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tasks';
      setError(errorMessage);
      console.error('Get My Tasks Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getWorkflowTasks = useCallback(async (
    workflowId: string,
    includeCompleted: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        type: 'workflow_tasks',
        workflowId,
        includeCompleted: includeCompleted.toString()
      });

      const response = await fetch(`/api/workflow/management?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTasks(result.tasks);
      } else {
        throw new Error(result.error || 'Failed to get workflow tasks');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get workflow tasks';
      setError(errorMessage);
      console.error('Get Workflow Tasks Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const pendingCount = tasks.filter(task => task.status === 'pending').length;
  const highPriorityCount = tasks.filter(task => task.priority === 'high' || task.priority === 'critical').length;
  const overdueCount = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    return task.dueDate < new Date();
  }).length;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshTasks = useCallback(async () => {
    await getMyTasks();
  }, [getMyTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTaskStatus,
    getMyTasks,
    getWorkflowTasks,
    pendingCount,
    highPriorityCount,
    overdueCount,
    clearError,
    refreshTasks
  };
}

/**
 * Hook สำหรับจัดการ Workflow Events
 */
export function useWorkflowEvents(): UseWorkflowEventsReturn {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const broadcastEvent = useCallback(async (params: BroadcastEventParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_event',
          workflowId: params.workflowId,
          data: {
            eventType: params.eventType,
            targetUsers: params.targetUsers,
            eventData: params.eventData
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to broadcast event');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to broadcast event';
      setError(errorMessage);
      console.error('Broadcast Event Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEventHistory = useCallback(async (
    workflowId: string,
    eventTypes?: DashboardEvent[],
    limit?: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        type: 'event_history',
        workflowId
      });

      if (eventTypes) {
        params.append('eventTypes', eventTypes.join(','));
      }

      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await fetch(`/api/workflow/management?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEvents(result.events);
      } else {
        throw new Error(result.error || 'Failed to get event history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get event history';
      setError(errorMessage);
      console.error('Get Event History Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback((callback: (event: EventPayload) => void) => {
    // TODO: Implement real-time subscription using Supabase Realtime
    // This is a placeholder for the subscription logic
    
    return () => {
      // Cleanup subscription
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    events,
    loading,
    error,
    broadcastEvent,
    getEventHistory,
    subscribe,
    clearError
  };
}

/**
 * Hook สำหรับ Dashboard Summary
 */
export function useWorkflowDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/management?type=dashboard_summary');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSummary(result.summary);
      } else {
        throw new Error(result.error || 'Failed to get dashboard summary');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get dashboard summary';
      setError(errorMessage);
      console.error('Dashboard Summary Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardSummary, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardSummary]);

  return {
    summary,
    loading,
    error,
    refresh: fetchDashboardSummary
  };
}
