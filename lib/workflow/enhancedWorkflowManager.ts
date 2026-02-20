/**
 * Unified Workflow Engine - Enhanced Manager
 * Phase 7: Cross-Role Workflow Integration (Upgrade)
 */

import { createClient } from '@supabase/supabase-js';
import { 
  WorkflowState, 
  WorkflowEvent, 
  WorkflowTask, 
  UnifiedWorkflow,
  CreateWorkflowRequest,
  UpdateWorkflowStageRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  WorkflowFilters,
  TaskFilters,
  WorkflowStatistics,
  WorkflowStage,
  TaskStatus,
  PriorityLevel,
  EventType,
  BeauticianAvailability,
  AssignmentCriteria,
  UserInfo
} from '@/types/workflow';

export class EnhancedWorkflowManager {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // ==================== WORKFLOW MANAGEMENT ====================

  /**
   * Create a new workflow from customer scan
   */
  async createWorkflow(request: CreateWorkflowRequest, userId: string): Promise<WorkflowState> {
    try {
      // Get customer info to validate access
      const { data: customer, error: customerError } = await this.supabase
        .from('customers')
        .select('clinic_id, assigned_sales_id')
        .eq('id', request.customer_id)
        .single();

      if (customerError || !customer) {
        throw new Error('Customer not found or access denied');
      }

      // Validate user can create workflow for this customer
      if (customer.assigned_sales_id !== userId) {
        throw new Error('You can only create workflows for your assigned customers');
      }

      // Create workflow state
      const { data: workflow, error: workflowError } = await this.supabase
        .from('workflow_states')
        .insert({
          customer_id: request.customer_id,
          clinic_id: customer.clinic_id,
          current_stage: 'scanned',
          assigned_sales: userId,
          scan_results: request.scan_results,
          treatment_plan: request.treatment_plan || null,
          priority_level: request.priority_level || 'normal',
          notes: request.notes || null
        })
        .select()
        .single();

      if (workflowError || !workflow) {
        throw new Error(`Failed to create workflow: ${workflowError?.message}`);
      }

      // Create initial event
      await this.createWorkflowEvent(workflow.id, 'created', userId, 'sales_staff', {
        customer_id: request.customer_id,
        scan_completed: true
      }, null, 'scanned', 'Customer scan completed and workflow created');

      // Auto-assign beautician if requested
      if (request.auto_assign_beautician) {
        await this.autoAssignBeautician(workflow.id);
      }

      // Create initial tasks
      await this.createInitialTasks(workflow.id, userId);

      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Update workflow stage
   */
  async updateWorkflowStage(request: UpdateWorkflowStageRequest, userId: string): Promise<WorkflowState> {
    try {
      // Get current workflow
      const { data: currentWorkflow, error: fetchError } = await this.supabase
        .from('workflow_states')
        .select('*')
        .eq('id', request.workflow_id)
        .single();

      if (fetchError || !currentWorkflow) {
        throw new Error('Workflow not found');
      }

      // Validate transition
      this.validateStageTransition(currentWorkflow.current_stage, request.new_stage);

      // Update workflow
      const { data: updatedWorkflow, error: updateError } = await this.supabase
        .from('workflow_states')
        .update({
          current_stage: request.new_stage,
          notes: request.notes || currentWorkflow.notes,
          assigned_beautician: request.assign_to || currentWorkflow.assigned_beautician,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.workflow_id)
        .select()
        .single();

      if (updateError || !updatedWorkflow) {
        throw new Error(`Failed to update workflow: ${updateError?.message}`);
      }

      // Create stage change event
      await this.createWorkflowEvent(
        request.workflow_id,
        'stage_changed',
        userId,
        await this.getUserRole(userId),
        { stage_change: true },
        currentWorkflow.current_stage,
        request.new_stage,
        `Workflow stage changed from ${currentWorkflow.current_stage} to ${request.new_stage}`
      );

      // Create follow-up tasks based on new stage
      await this.createStageBasedTasks(updatedWorkflow.id, request.new_stage, userId);

      return updatedWorkflow;
    } catch (error) {
      console.error('Error updating workflow stage:', error);
      throw error;
    }
  }

  /**
   * Get workflow by ID with full details
   */
  async getWorkflow(workflowId: string, userId: string): Promise<UnifiedWorkflow | null> {
    try {
      // Get workflow state
      const { data: workflow, error: workflowError } = await this.supabase
        .from('workflow_states')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflow) {
        return null;
      }

      // Validate access
      if (!await this.canAccessWorkflow(workflowId, userId)) {
        throw new Error('Access denied');
      }

      // Get events
      const { data: events } = await this.supabase
        .from('workflow_events')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      // Get tasks
      const { data: tasks } = await this.supabase
        .from('workflow_tasks')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      // Get customer info
      const { data: customer } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', workflow.customer_id)
        .single();

      // Get assigned staff info
      const [assignedSales, assignedBeautician] = await Promise.all([
        workflow.assigned_sales ? this.getUserInfo(workflow.assigned_sales) : null,
        workflow.assigned_beautician ? this.getUserInfo(workflow.assigned_beautician) : null
      ]);

      return {
        id: workflow.id,
        state: workflow,
        events: events || [],
        tasks: tasks || [],
        customer: customer!,
        assignedSales,
        assignedBeautician
      };
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflows for user with filters
   */
  async getWorkflows(filters: WorkflowFilters, userId: string, page = 1, limit = 20): Promise<{ workflows: UnifiedWorkflow[], total: number }> {
    try {
      let query = this.supabase
        .from('workflow_states')
        .select(`
          *,
          customers!inner(
            id,
            full_name,
            email,
            phone,
            age,
            gender,
            notes,
            created_at
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.stage) {
        query = query.eq('current_stage', filters.stage);
      }
      if (filters.assigned_sales) {
        query = query.eq('assigned_sales', filters.assigned_sales);
      }
      if (filters.assigned_beautician) {
        query = query.eq('assigned_beautician', filters.assigned_beautician);
      }
      if (filters.priority_level) {
        query = query.eq('priority_level', filters.priority_level);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.customer_search) {
        query = query.ilike('customers.full_name', `%${filters.customer_search}%`);
      }

      // Apply access control
      const userRole = await this.getUserRole(userId);
      if (userRole === 'sales_staff') {
        query = query.eq('assigned_sales', userId);
      } else if (userRole === 'beautician') {
        query = query.eq('assigned_beautician', userId);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: workflows, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Failed to fetch workflows: ${error.message}`);
      }

      // Get additional details for each workflow
      const unifiedWorkflows: UnifiedWorkflow[] = [];
      for (const workflow of workflows || []) {
        const [events, tasks, assignedSales, assignedBeautician] = await Promise.all([
          this.getWorkflowEvents(workflow.id),
          this.getWorkflowTasks(workflow.id),
          workflow.assigned_sales ? this.getUserInfo(workflow.assigned_sales) : null,
          workflow.assigned_beautician ? this.getUserInfo(workflow.assigned_beautician) : null
        ]);

        unifiedWorkflows.push({
          id: workflow.id,
          state: workflow,
          events,
          tasks,
          customer: workflow.customers,
          assignedSales,
          assignedBeautician
        });
      }

      return {
        workflows: unifiedWorkflows,
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw error;
    }
  }

  // ==================== TASK MANAGEMENT ====================

  /**
   * Create a new task
   */
  async createTask(request: CreateTaskRequest, userId: string): Promise<WorkflowTask> {
    try {
      // Validate workflow access
      if (!await this.canAccessWorkflow(request.workflow_id, userId)) {
        throw new Error('Access denied to workflow');
      }

      const { data: task, error } = await this.supabase
        .from('workflow_tasks')
        .insert({
          workflow_id: request.workflow_id,
          assigned_to: request.assigned_to,
          task_type: request.task_type,
          task_title: request.task_title,
          task_description: request.task_description || null,
          task_data: request.task_data || null,
          priority_level: request.priority_level || 'normal',
          due_date: request.due_date || null,
          estimated_duration: request.estimated_duration || null
        })
        .select()
        .single();

      if (error || !task) {
        throw new Error(`Failed to create task: ${error?.message}`);
      }

      // Create task assignment event
      await this.createWorkflowEvent(
        request.workflow_id,
        'task_assigned',
        userId,
        await this.getUserRole(userId),
        {
          task_id: task.id,
          task_type: request.task_type,
          assigned_to: request.assigned_to
        },
        null,
        null,
        `Task "${request.task_title}" assigned to user ${request.assigned_to}`
      );

      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTask(request: UpdateTaskRequest, userId: string): Promise<WorkflowTask> {
    try {
      // Get current task
      const { data: currentTask, error: fetchError } = await this.supabase
        .from('workflow_tasks')
        .select('*')
        .eq('id', request.task_id)
        .single();

      if (fetchError || !currentTask) {
        throw new Error('Task not found');
      }

      // Validate access (only assigned user or clinic owner can update)
      if (currentTask.assigned_to !== userId && !await this.isClinicOwner(userId, currentTask.workflow_id)) {
        throw new Error('Access denied');
      }

      // Update task
      const updateData: Partial<WorkflowTask> = {};
      if (request.status) updateData.status = request.status;
      if (request.completion_notes !== undefined) updateData.completion_notes = request.completion_notes;
      if (request.assigned_to) updateData.assigned_to = request.assigned_to;
      if (request.due_date) updateData.due_date = request.due_date;
      
      if (request.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedTask, error: updateError } = await this.supabase
        .from('workflow_tasks')
        .update(updateData)
        .eq('id', request.task_id)
        .select()
        .single();

      if (updateError || !updatedTask) {
        throw new Error(`Failed to update task: ${updateError?.message}`);
      }

      // Create task completion event
      if (request.status === 'completed') {
        await this.createWorkflowEvent(
          currentTask.workflow_id,
          'task_completed',
          userId,
          await this.getUserRole(userId),
          {
            task_id: updatedTask.id,
            task_type: updatedTask.task_type,
            completion_notes: request.completion_notes
          },
          null,
          null,
          `Task "${updatedTask.task_title}" completed`
        );
      }

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Get tasks for user with filters
   */
  async getTasks(filters: TaskFilters, userId: string, page = 1, limit = 20): Promise<{ tasks: WorkflowTask[], total: number }> {
    try {
      let query = this.supabase
        .from('workflow_tasks')
        .select(`
          *,
          workflow_states!inner(
            id,
            customer_id,
            clinic_id,
            current_stage
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      } else {
        // Default to current user's tasks
        query = query.eq('assigned_to', userId);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.task_type) {
        query = query.eq('task_type', filters.task_type);
      }
      if (filters.priority_level) {
        query = query.eq('priority_level', filters.priority_level);
      }
      if (filters.due_from) {
        query = query.gte('due_date', filters.due_from);
      }
      if (filters.due_to) {
        query = query.lte('due_date', filters.due_to);
      }
      if (filters.workflow_id) {
        query = query.eq('workflow_id', filters.workflow_id);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: tasks, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      return {
        tasks: tasks || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  // ==================== ASSIGNMENT ENGINE ====================

  /**
   * Auto-assign beautician to workflow
   */
  async autoAssignBeautician(workflowId: string, criteria?: AssignmentCriteria): Promise<string | null> {
    try {
      // Get workflow details
      const { data: workflow } = await this.supabase
        .from('workflow_states')
        .select('clinic_id, treatment_plan, priority_level')
        .eq('id', workflowId)
        .single();

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Get available beauticians
      const beauticians = await this.getAvailableBeauticians(workflow.clinic_id, criteria);

      if (beauticians.length === 0) {
        console.warn('No available beauticians found for workflow:', workflowId);
        return null;
      }

      // Select best beautician based on workload and skills
      const selectedBeautician = this.selectBestBeautician(beauticians, criteria);

      // Update workflow with assigned beautician
      await this.supabase
        .from('workflow_states')
        .update({ assigned_beautician: selectedBeautician.user_id })
        .eq('id', workflowId);

      // Create assignment task
      await this.createTask({
        workflow_id: workflowId,
        assigned_to: selectedBeautician.user_id,
        task_type: 'review_scan',
        task_title: 'Review Customer Scan Results',
        task_description: 'Review the customer scan results and prepare treatment plan',
        priority_level: workflow.priority_level as PriorityLevel
      }, await this.getClinicOwner(workflow.clinic_id));

      return selectedBeautician.user_id;
    } catch (error) {
      console.error('Error auto-assigning beautician:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get workflow statistics for clinic
   */
  async getWorkflowStatistics(clinicId: string, userId: string): Promise<WorkflowStatistics> {
    try {
      // Validate access
      if (!await this.canAccessClinic(clinicId, userId)) {
        throw new Error('Access denied');
      }

      // Get workflow counts by stage
      const { data: stageCounts } = await this.supabase
        .from('workflow_states')
        .select('current_stage')
        .eq('clinic_id', clinicId);

      const workflowsByStage = stageCounts?.reduce((acc, w) => {
        acc[w.current_stage as WorkflowStage] = (acc[w.current_stage as WorkflowStage] || 0) + 1;
        return acc;
      }, {} as Record<WorkflowStage, number>) || {} as Record<WorkflowStage, number>;

      // Get task counts by status
      const { data: taskCounts } = await this.supabase
        .from('workflow_tasks')
        .select(`
          status,
          workflow_states!inner(
            clinic_id
          )
        `)
        .eq('workflow_states.clinic_id', clinicId);

      const tasksByStatus = taskCounts?.reduce((acc, t) => {
        acc[t.status as TaskStatus] = (acc[t.status as TaskStatus] || 0) + 1;
        return acc;
      }, {} as Record<TaskStatus, number>) || {} as Record<TaskStatus, number>;

      // Get overdue tasks
      const { count: overdueTasks } = await this.supabase
        .from('workflow_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString())
        .eq('workflow_states.clinic_id', clinicId);

      // Calculate completion rate and average time
      const { data: completedTasks } = await this.supabase
        .from('workflow_tasks')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .eq('workflow_states.clinic_id', clinicId)
        .not('completed_at', 'is', null);

      const completedTaskList = completedTasks ?? [];

      const completionRate = taskCounts ? 
        (tasksByStatus.completed || 0) / taskCounts.length * 100 : 0;

      const averageCompletionTime = completedTaskList.length > 0 ?
        completedTaskList.reduce((acc, task) => {
          const created = new Date(task.created_at).getTime();
          const completed = new Date(task.completed_at!).getTime();
          return acc + (completed - created) / (1000 * 60 * 60); // hours
        }, 0) / completedTaskList.length : 0;

      // Get staff workload
      const { data: staffWorkload } = await this.supabase
        .from('workflow_tasks')
        .select(`
          assigned_to,
          status,
          users!inner(
            id,
            full_name,
            clinic_staff!inner(
              role
            )
          )
        `)
        .eq('users.clinic_staff.clinic_id', clinicId);

      type StaffStats = Record<string, {
        user_id: string;
        user_name: string;
        role: string;
        active_tasks: number;
        completed_tasks: number;
        overdue_tasks: number;
      }>;

      const staffStats = (staffWorkload ?? []).reduce<StaffStats>((acc, task) => {
        const userId = task.assigned_to as string;
        const userRecord = Array.isArray(task.users) ? task.users[0] : task.users;
        const userName = (userRecord as any)?.full_name ?? 'Unknown';
        const clinicStaffRole = Array.isArray((userRecord as any)?.clinic_staff)
          ? (userRecord as any).clinic_staff[0]?.role
          : (userRecord as any)?.clinic_staff?.role;
        const role = clinicStaffRole ?? 'unknown';

        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_name: userName,
            role,
            active_tasks: 0,
            completed_tasks: 0,
            overdue_tasks: 0
          };
        }

        if (task.status === 'pending' || task.status === 'in_progress') {
          acc[userId].active_tasks++;
        } else if (task.status === 'completed') {
          acc[userId].completed_tasks++;
        }

        const dueDateValue = (task as any).due_date as string | undefined;
        const dueDate = dueDateValue ? new Date(dueDateValue) : null;
        if (task.status === 'pending' && dueDate && dueDate < new Date()) {
          acc[userId].overdue_tasks++;
        }

        return acc;
      }, {}) || {};

      return {
        total_workflows: Object.values(workflowsByStage).reduce((a, b) => a + b, 0),
        workflows_by_stage: workflowsByStage,
        tasks_by_status: tasksByStatus,
        overdue_tasks: overdueTasks || 0,
        completion_rate: completionRate,
        average_completion_time: averageCompletionTime,
        staff_workload: Object.values(staffStats)
      };
    } catch (error) {
      console.error('Error getting workflow statistics:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private async createWorkflowEvent(
    workflowId: string,
    eventType: EventType,
    actorId: string,
    actorRole: string,
  eventData: Record<string, unknown>,
    previousStage: string | null,
    newStage: string | null,
    description: string
  ): Promise<void> {
    await this.supabase
      .from('workflow_events')
      .insert({
        workflow_id: workflowId,
        event_type: eventType,
        actor_id: actorId,
        actor_role: actorRole,
        event_data: eventData,
        previous_stage: previousStage,
        new_stage: newStage,
        description: description
      });
  }

  private async createInitialTasks(workflowId: string, createdBy: string): Promise<void> {
    // Create review task for assigned beautician
    await this.createTask({
      workflow_id: workflowId,
      assigned_to: createdBy, // Will be reassigned to beautician
      task_type: 'review_scan',
      task_title: 'Review Customer Scan Results',
      task_description: 'Review the customer scan results and prepare treatment recommendations',
      priority_level: 'normal'
    }, createdBy);
  }

  private async createStageBasedTasks(workflowId: string, stage: WorkflowStage, userId: string): Promise<void> {
    switch (stage) {
      case 'treatment_scheduled':
        await this.createTask({
          workflow_id: workflowId,
          assigned_to: userId,
          task_type: 'prepare_treatment',
          task_title: 'Prepare Treatment Room',
          task_description: 'Prepare treatment room and equipment for scheduled treatment',
          priority_level: 'normal'
        }, userId);
        break;
      
      case 'completed':
        await this.createTask({
          workflow_id: workflowId,
          assigned_to: userId,
          task_type: 'follow_up',
          task_title: 'Schedule Follow-up',
          task_description: 'Schedule follow-up appointment with customer',
          priority_level: 'normal',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }, userId);
        break;
    }
  }

  private validateStageTransition(currentStage: WorkflowStage, newStage: WorkflowStage): void {
    const validTransitions: Record<WorkflowStage, WorkflowStage[]> = {
      'scanned': ['treatment_scheduled'],
      'treatment_scheduled': ['in_treatment'],
      'in_treatment': ['completed', 'treatment_scheduled'], // Can go back if rescheduled
      'completed': ['follow_up'],
      'follow_up': ['scanned'] // New scan cycle
    };

    if (!validTransitions[currentStage].includes(newStage)) {
      throw new Error(`Invalid stage transition from ${currentStage} to ${newStage}`);
    }
  }

  private async canAccessWorkflow(workflowId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('workflow_states')
      .select('clinic_id, assigned_sales, assigned_beautician')
      .eq('id', workflowId)
      .single();

    if (!data) return false;

    // Check if user is assigned staff
    if (data.assigned_sales === userId || data.assigned_beautician === userId) {
      return true;
    }

    // Check if user is clinic staff
    const { data: staff } = await this.supabase
      .from('clinic_staff')
      .select('user_id')
      .eq('clinic_id', data.clinic_id)
      .eq('user_id', userId)
      .single();

    return !!staff;
  }

  private async canAccessClinic(clinicId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('clinic_staff')
      .select('user_id')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  private async getUserRole(userId: string): Promise<string> {
    const { data } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    return data?.role || 'unknown';
  }

  private async getUserInfo(userId: string): Promise<UserInfo | null> {
    const { data } = await this.supabase
      .from('users')
      .select('id, full_name, email, role, avatar_url, phone')
      .eq('id', userId)
      .single();

    return data;
  }

  private async getClinicOwner(clinicId: string): Promise<string> {
    const { data } = await this.supabase
      .from('clinics')
      .select('owner_id')
      .eq('id', clinicId)
      .single();

    const ownerId = (data as { owner_id?: string } | null)?.owner_id;
    return ownerId || '';
  }

  private async isClinicOwner(userId: string, workflowId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('workflow_states')
      .select(`
        clinic_id,
        clinics!inner(
          owner_id
        )
      `)
      .eq('id', workflowId)
      .single();

    const clinicRecord = (data as { clinics?: { owner_id?: string }[] | { owner_id?: string } } | null)?.clinics;
    const ownerId = Array.isArray(clinicRecord) ? clinicRecord[0]?.owner_id : clinicRecord?.owner_id;
    return ownerId === userId;
  }

  private async getWorkflowEvents(workflowId: string): Promise<WorkflowEvent[]> {
    const { data } = await this.supabase
      .from('workflow_events')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  private async getWorkflowTasks(workflowId: string): Promise<WorkflowTask[]> {
    const { data } = await this.supabase
      .from('workflow_tasks')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  private async getAvailableBeauticians(clinicId: string, _criteria?: AssignmentCriteria): Promise<BeauticianAvailability[]> {
    void _criteria;
    // Get beauticians with their current workload
    const { data } = await this.supabase
      .from('clinic_staff')
      .select(`
        user_id,
        users!inner(
          full_name
        ),
        workflow_tasks!left(
          status
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('role', 'beautician');

    return (data as any[] || []).map((staff: {
      user_id: string;
      users: UserInfo | UserInfo[];
      workflow_tasks?: { status?: string }[];
    }) => {
      const userRecord = Array.isArray(staff.users) ? staff.users[0] : staff.users;
      const userName = (userRecord as any)?.full_name ?? 'Unknown';

      return {
        user_id: staff.user_id,
        user_name: userName,
        current_workload: staff.workflow_tasks?.filter((t) => t.status === 'pending' || t.status === 'in_progress').length || 0,
        skills: [], // TODO: Implement skills tracking
        available_hours: [], // TODO: Implement availability tracking
        rating: 0 // TODO: Implement rating system
      };
    });
  }

  private selectBestBeautician(beauticians: BeauticianAvailability[], _criteria?: AssignmentCriteria): BeauticianAvailability {
    void _criteria;
    // Simple selection based on workload - can be enhanced with more sophisticated logic
    return beauticians.reduce((best, current) => 
      current.current_workload < best.current_workload ? current : best
    );
  }
}

// Export singleton instance
export const enhancedWorkflowManager = new EnhancedWorkflowManager();
