import { createClient } from '@/lib/supabase/client';
import { eventBroadcaster } from './eventBroadcaster';

/**
 * Smart Task Queue System
 * จัดการ Tasks อัตโนมัติและจัดลำดับความสำคัญด้วย AI
 */

export type TaskType = 
  | 'scan_customer'
  | 'send_proposal'
  | 'prepare_treatment'
  | 'follow_up_upsell'
  | 'customer_follow_up'
  | 'payment_reminder'
  | 'appointment_reminder'
  | 'review_request';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  workflowId: string;
  assignedTo: string;
  taskType: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  
  // Task Data
  taskData: Record<string, any>;
  
  // Progress
  completedAt?: Date;
  estimatedDuration?: number; // minutes
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedBy?: string;
  notes?: string;
}

export interface TaskTemplate {
  taskType: TaskType;
  title: string;
  description: string;
  defaultPriority: TaskPriority;
  estimatedDuration: number;
  autoAssign?: boolean;
  conditions?: (workflowData: any) => boolean;
}

/**
 * Task Templates สำหรับการสร้าง Task อัตโนมัติ
 */
export const TASK_TEMPLATES: Record<TaskType, TaskTemplate> = {
  scan_customer: {
    taskType: 'scan_customer',
    title: 'สแกนผิวลูกค้า: {customerName}',
    description: 'ทำการสแกนผิวและวิเคราะห์ปัญหาของลูกค้า',
    defaultPriority: 'high',
    estimatedDuration: 15,
    autoAssign: true
  },
  
  send_proposal: {
    taskType: 'send_proposal',
    title: 'ส่งใบเสนอราคา: {customerName}',
    description: 'สร้างและส่งใบเสนอราคาจากผลการสแกนผิว',
    defaultPriority: 'high',
    estimatedDuration: 30,
    autoAssign: true,
    conditions: (data) => !!data.scanResults
  },
  
  prepare_treatment: {
    taskType: 'prepare_treatment',
    title: 'เตรียม Treatment: {customerName}',
    description: 'เตรียมอุปกรณ์และพื้นที่สำหรับทำ Treatment',
    defaultPriority: 'medium',
    estimatedDuration: 20,
    autoAssign: true
  },
  
  follow_up_upsell: {
    taskType: 'follow_up_upsell',
    title: 'ติดตาม Upsell: {customerName}',
    description: 'ติดตามลูกค้าหลัง Treatment และเสนอบริการเพิ่มเติม',
    defaultPriority: 'medium',
    estimatedDuration: 10,
    autoAssign: true
  },
  
  customer_follow_up: {
    taskType: 'customer_follow_up',
    title: 'ติดตามลูกค้า: {customerName}',
    description: 'ติดตามความพึงพอใจและผลการรักษา',
    defaultPriority: 'low',
    estimatedDuration: 5,
    autoAssign: true
  },
  
  payment_reminder: {
    taskType: 'payment_reminder',
    title: 'แจ้งเตือนชำระเงิน: {customerName}',
    description: 'แจ้งเตือนลูกค้าชำระเงินค่า Treatment',
    defaultPriority: 'high',
    estimatedDuration: 5,
    autoAssign: false
  },
  
  appointment_reminder: {
    taskType: 'appointment_reminder',
    title: 'แจ้งเตือนนัดหมาย: {customerName}',
    description: 'แจ้งเตือนลูกค้าเกี่ยวกับการนัดหมาย',
    defaultPriority: 'medium',
    estimatedDuration: 3,
    autoAssign: true
  },
  
  review_request: {
    taskType: 'review_request',
    title: 'ขอรีวิว: {customerName}',
    description: 'ขอให้ลูกค้าให้คะแนนและรีวิวบริการ',
    defaultPriority: 'low',
    estimatedDuration: 5,
    autoAssign: true
  }
};

/**
 * Task Queue Manager Class
 */
export class TaskQueueManager {
  private supabase = createClient();

  /**
   * สร้าง Task ใหม่
   */
  async createTask(params: {
    workflowId: string;
    assignedTo: string;
    taskType: TaskType;
    customerName: string;
    priority?: TaskPriority;
    dueDate?: Date;
    taskData?: Record<string, any>;
    notes?: string;
  }): Promise<Task> {
    const template = TASK_TEMPLATES[params.taskType];
    const taskId = crypto.randomUUID();
    
    const task: Task = {
      id: taskId,
      workflowId: params.workflowId,
      assignedTo: params.assignedTo,
      taskType: params.taskType,
      title: template.title.replace('{customerName}', params.customerName),
      description: template.description,
      priority: params.priority || template.defaultPriority,
      status: 'pending',
      dueDate: params.dueDate,
      taskData: params.taskData || {},
      estimatedDuration: template.estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: params.notes
    };

    // บันทึกลงฐานข้อมูล
    await this.saveTask(task);

    // ส่ง Notification
    await eventBroadcaster.notifyTaskAssignment(
      params.workflowId,
      'system',
      params.assignedTo,
      {
        taskType: params.taskType,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: params.dueDate
      }
    );

    console.log(`📋 Task created: ${task.title} for ${params.assignedTo}`);
    return task;
  }

  /**
   * อัปเดต Task Status
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    userId: string,
    notes?: string
  ): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask: Task = {
      ...task,
      status,
      updatedAt: new Date(),
      notes: notes || task.notes,
      ...(status === 'completed' ? {
        completedAt: new Date(),
        completedBy: userId
      } : {})
    };

    await this.saveTask(updatedTask);

    // ส่ง Event เมื่อ Task เสร็จ
    if (status === 'completed') {
      await this.handleTaskCompletion(updatedTask);
    }

    return updatedTask;
  }

  /**
   * จัดการเมื่อ Task เสร็จสิ้น
   */
  private async handleTaskCompletion(task: Task): Promise<void> {
    switch (task.taskType) {
      case 'scan_customer':
        // สร้าง Task ส่งใบเสนอราคาอัตโนมัติ
        await this.autoCreateFollowUpTask(
          task.workflowId,
          task.assignedTo,
          'send_proposal',
          task.taskData.customerName
        );
        break;
        
      case 'send_proposal':
        // รอ Payment, ไม่ต้องสร้าง Task ใหม่
        break;
        
      case 'prepare_treatment':
        // แจ้ง Sales ว่า Treatment พร้อมแล้ว
        await eventBroadcaster.notifyOwnerWorkflowUpdate(
          task.workflowId,
          task.completedBy!,
          [], // เฉพาะ Owner
          'Treatment Ready',
          {
            customerName: task.taskData.customerName,
            currentStage: 'treatment_scheduled',
            priority: 'medium'
          }
        );
        break;
        
      case 'follow_up_upsell':
        // สร้าง Task ติดตามลูกค้าในอีก 7 วัน
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 7);
        
        await this.createTask({
          workflowId: task.workflowId,
          assignedTo: task.assignedTo,
          taskType: 'customer_follow_up',
          customerName: task.taskData.customerName,
          dueDate: followUpDate,
          taskData: { previousTask: task.id }
        });
        break;
    }
  }

  /**
   * สร้าง Follow-up Task อัตโนมัติ
   */
  private async autoCreateFollowUpTask(
    workflowId: string,
    assignedTo: string,
    taskType: TaskType,
    customerName: string,
    delayMinutes: number = 0
  ): Promise<void> {
    const template = TASK_TEMPLATES[taskType];
    if (!template.autoAssign) return;

    const dueDate = new Date();
    if (delayMinutes > 0) {
      dueDate.setMinutes(dueDate.getMinutes() + delayMinutes);
    }

    await this.createTask({
      workflowId,
      assignedTo,
      taskType,
      customerName,
      dueDate,
      taskData: { autoGenerated: true }
    });
  }

  /**
   * ดึง Tasks ของ User
   */
  async getUserTasks(
    userId: string,
    status?: TaskStatus[],
    priority?: TaskPriority[],
    limit: number = 50
  ): Promise<Task[]> {
    let query = this.supabase
      .from('task_queue')
      .select('*')
      .eq('assigned_to', userId)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.in('status', status);
    }

    if (priority) {
      query = query.in('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get user tasks:', error);
      return [];
    }

    return data?.map(this.mapDatabaseToTask) || [];
  }

  /**
   * ดึง Tasks ของ Workflow
   */
  async getWorkflowTasks(
    workflowId: string,
    includeCompleted: boolean = false
  ): Promise<Task[]> {
    let query = this.supabase
      .from('task_queue')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: true });

    if (!includeCompleted) {
      query = query.neq('status', 'completed');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get workflow tasks:', error);
      return [];
    }

    return data?.map(this.mapDatabaseToTask) || [];
  }

  /**
   * AI-powered Task Prioritization
   */
  async reprioritizeTasks(clinicId: string): Promise<number> {
    // ดึง Pending Tasks ทั้งหมด
    const { data: tasksData } = await this.supabase
      .from('task_queue')
      .select(`
        *,
        workflow_states!inner(clinic_id, current_stage, scan_results)
      `)
      .eq('workflow_states.clinic_id', clinicId)
      .eq('status', 'pending');

    if (!tasksData || tasksData.length === 0) {
      return 0;
    }

    let updatedCount = 0;

    for (const taskData of tasksData) {
      const currentPriority = taskData.priority;
      const newPriority = this.calculateAIPriority(taskData);

      if (newPriority !== currentPriority) {
        await this.supabase
          .from('task_queue')
          .update({ 
            priority: newPriority,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskData.id);

        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * คำนวณ Priority ด้วย AI Logic
   */
  private calculateAIPriority(taskData: any): TaskPriority {
    let score = 0;

    // Base score ตาม Task Type
    const typeScores: Record<TaskType, number> = {
      'payment_reminder': 100,
      'scan_customer': 90,
      'send_proposal': 80,
      'appointment_reminder': 70,
      'prepare_treatment': 60,
      'follow_up_upsell': 40,
      'customer_follow_up': 30,
      'review_request': 20
    };

    score += typeScores[taskData.task_type as TaskType] || 50;

    // Due date urgency
    if (taskData.due_date) {
      const dueDate = new Date(taskData.due_date);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDue < 1) score += 50;
      else if (hoursUntilDue < 4) score += 30;
      else if (hoursUntilDue < 24) score += 10;
    }

    // Urgency from scan results
    const scanResults = taskData.workflow_states?.scan_results;
    if (scanResults?.urgencyScore) {
      score += scanResults.urgencyScore * 0.3;
    }

    // Workflow stage importance
    const stageScores = {
      'lead_created': 10,
      'scanned': 20,
      'proposal_sent': 15,
      'payment_confirmed': 25,
      'treatment_scheduled': 30,
      'in_treatment': 35,
      'treatment_completed': 20,
      'follow_up': 10,
      'completed': 0
    };

    const currentStage = taskData.workflow_states?.current_stage;
    if (currentStage && currentStage in stageScores) {
      score += stageScores[currentStage as keyof typeof stageScores] || 0;
    }

    // Convert score to priority
    if (score >= 120) return 'critical';
    if (score >= 90) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Auto-assign Tasks to Available Staff
   */
  async autoAssignTasks(clinicId: string): Promise<number> {
    // ดึง Unassigned Tasks
    const { data: unassignedTasks } = await this.supabase
      .from('task_queue')
      .select(`
        *,
        workflow_states!inner(clinic_id)
      `)
      .eq('workflow_states.clinic_id', clinicId)
      .is('assigned_to', null)
      .eq('status', 'pending');

    if (!unassignedTasks || unassignedTasks.length === 0) {
      return 0;
    }

    // ดึงรายชื่อ Staff ที่ว่าง
    const availableStaff = await this.getAvailableStaff(clinicId);

    let assignedCount = 0;

    for (const task of unassignedTasks) {
      const assignedStaff = this.findBestStaffForTask(task, availableStaff);
      
      if (assignedStaff) {
        await this.supabase
          .from('task_queue')
          .update({ 
            assigned_to: assignedStaff.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        assignedCount++;
      }
    }

    return assignedCount;
  }

  /**
   * หา Staff ที่เหมาะสมที่สุดสำหรับ Task
   */
  private findBestStaffForTask(task: any, availableStaff: any[]): any | null {
    // Logic สำหรับเลือก Staff ตาม Task Type
    const taskTypeRoles: Record<TaskType, string[]> = {
      'scan_customer': ['sales_staff'],
      'send_proposal': ['sales_staff'],
      'prepare_treatment': ['beautician'],
      'follow_up_upsell': ['sales_staff'],
      'customer_follow_up': ['sales_staff', 'beautician'],
      'payment_reminder': ['sales_staff'],
      'appointment_reminder': ['reception', 'sales_staff'],
      'review_request': ['sales_staff']
    };

    const requiredRoles = taskTypeRoles[task.task_type as TaskType] || [];
    
    // หา Staff ที่มี Role เหมาะสม
    const suitableStaff = availableStaff.filter(staff => 
      requiredRoles.includes(staff.role) || requiredRoles.length === 0
    );

    if (suitableStaff.length === 0) {
      return availableStaff[0] || null; // Fallback to any available staff
    }

    // เลือก Staff ที่มีงานน้อยที่สุด
    return suitableStaff.sort((a, b) => a.taskCount - b.taskCount)[0];
  }

  /**
   * ดึงรายชื่อ Staff ที่ว่าง
   */
  private async getAvailableStaff(clinicId: string): Promise<any[]> {
    // ดึง Staff และนับ Pending Tasks
    const { data: staff } = await this.supabase
      .from('users')
      .select(`
        id, 
        full_name, 
        role,
        task_queue!left(id)
      `)
      .eq('clinic_id', clinicId)
      .in('role', ['sales_staff', 'beautician', 'reception'])
      .eq('task_queue.status', 'pending');

    return staff?.map(person => ({
      ...person,
      taskCount: Array.isArray(person.task_queue) ? person.task_queue.length : 0
    })) || [];
  }

  /**
   * บันทึก Task ลงฐานข้อมูล
   */
  private async saveTask(task: Task): Promise<void> {
    const { error } = await this.supabase
      .from('task_queue')
      .upsert({
        id: task.id,
        workflow_id: task.workflowId,
        assigned_to: task.assignedTo,
        task_type: task.taskType,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate?.toISOString(),
        task_data: task.taskData,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
        completed_at: task.completedAt?.toISOString(),
        notes: task.notes
      });

    if (error) {
      throw new Error(`Failed to save task: ${error.message}`);
    }
  }

  /**
   * ดึง Task จากฐานข้อมูล
   */
  private async getTask(taskId: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('task_queue')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Failed to get task:', error);
      return null;
    }

    return data ? this.mapDatabaseToTask(data) : null;
  }

  /**
   * แปลงข้อมูลจากฐานข้อมูลเป็น Task object
   */
  private mapDatabaseToTask(data: any): Task {
    return {
      id: data.id,
      workflowId: data.workflow_id,
      assignedTo: data.assigned_to,
      taskType: data.task_type,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      taskData: data.task_data || {},
      estimatedDuration: data.estimated_duration,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      completedBy: data.completed_by,
      notes: data.notes
    };
  }

  /**
   * Clean up Completed Tasks (older than 30 days)
   */
  async cleanupOldTasks(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count } = await this.supabase
      .from('task_queue')
      .delete({ count: 'exact' })
      .eq('status', 'completed')
      .lt('completed_at', thirtyDaysAgo.toISOString());

    return count || 0;
  }
}

// สร้าง Singleton Instance
export const taskQueueManager = new TaskQueueManager();
