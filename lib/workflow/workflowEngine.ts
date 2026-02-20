/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client';

/**
 * Unified Workflow Engine
 * จัดการสถานะของ Workflow ระหว่าง Sales → Beautician → Customer → Owner
 */

export type WorkflowStage = 
  | 'lead_created'        // ลูกค้าใหม่เข้ามา
  | 'scanned'            // สแกนผิวแล้ว
  | 'proposal_sent'      // ส่งใบเสนอราคาแล้ว
  | 'payment_confirmed'  // ชำระเงินแล้ว
  | 'treatment_scheduled'// นัดหมายแล้ว
  | 'in_treatment'       // กำลังทำ Treatment
  | 'treatment_completed'// เสร็จ Treatment
  | 'follow_up'          // ติดตาม
  | 'completed';         // เสร็จสิ้นทั้งหมด

export type WorkflowActionType = 
  | 'scan_customer'
  | 'send_proposal'
  | 'confirm_payment'
  | 'schedule_appointment'
  | 'start_treatment'
  | 'complete_treatment'
  | 'send_follow_up'
  | 'close_case';

export interface WorkflowState {
  id: string;
  clinicId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Current State
  currentStage: WorkflowStage;
  assignedStaff: {
    salesId?: string;
    beauticianId?: string;
  };
  
  // Data Context
  scanResults?: {
    skinAnalysis: any;
    urgencyScore: number;
    concerns: string[];
  };
  
  treatmentPlan?: {
    treatments: string[];
    totalAmount: number;
    duration: number;
  };
  
  // Workflow History
  actions: WorkflowAction[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  performedBy: string;
  performedAt: Date;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  data?: any;
  notes?: string;
}

export interface WorkflowTransition {
  from: WorkflowStage;
  to: WorkflowStage;
  action: WorkflowActionType;
  requiredRole?: string[];
  autoTrigger?: boolean;
  conditions?: (state: WorkflowState) => boolean;
}

// กำหนด Workflow Transitions ที่ถูกต้อง
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Lead → Scanned (Sales Action)
  {
    from: 'lead_created',
    to: 'scanned',
    action: 'scan_customer',
    requiredRole: ['sales_staff', 'clinic_owner']
  },
  
  // Scanned → Proposal (Auto/Manual)
  {
    from: 'scanned',
    to: 'proposal_sent',
    action: 'send_proposal',
    requiredRole: ['sales_staff'],
    autoTrigger: true
  },
  
  // Proposal → Payment (Customer Action)
  {
    from: 'proposal_sent',
    to: 'payment_confirmed',
    action: 'confirm_payment',
    conditions: (state) => !!state.treatmentPlan?.totalAmount
  },
  
  // Payment → Scheduled (Sales Action)
  {
    from: 'payment_confirmed',
    to: 'treatment_scheduled',
    action: 'schedule_appointment',
    requiredRole: ['sales_staff', 'beautician']
  },
  
  // Scheduled → In Treatment (Beautician Action)
  {
    from: 'treatment_scheduled',
    to: 'in_treatment',
    action: 'start_treatment',
    requiredRole: ['beautician']
  },
  
  // In Treatment → Completed (Beautician Action)
  {
    from: 'in_treatment',
    to: 'treatment_completed',
    action: 'complete_treatment',
    requiredRole: ['beautician']
  },
  
  // Completed → Follow-up (Auto)
  {
    from: 'treatment_completed',
    to: 'follow_up',
    action: 'send_follow_up',
    autoTrigger: true
  },
  
  // Follow-up → Completed (Manual/Auto after 7 days)
  {
    from: 'follow_up',
    to: 'completed',
    action: 'close_case',
    requiredRole: ['sales_staff', 'clinic_owner']
  }
];

/**
 * Workflow Engine Class
 */
export class WorkflowEngine {
  private supabase = createClient();
  
  /**
   * สร้าง Workflow ใหม่
   */
  async createWorkflow(params: {
    clinicId: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    assignedSalesId?: string;
    metadata?: Record<string, any>;
  }): Promise<WorkflowState> {
    const workflowId = crypto.randomUUID();
    
    const workflow: WorkflowState = {
      id: workflowId,
      clinicId: params.clinicId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      currentStage: 'lead_created',
      assignedStaff: {
        salesId: params.assignedSalesId
      },
      actions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata || {}
    };

    // บันทึกลงฐานข้อมูล
    await this.saveWorkflowState(workflow);
    
    // สร้าง Initial Action
    await this.addAction(workflowId, {
      type: 'scan_customer',
      performedBy: params.assignedSalesId || 'system',
      fromStage: 'lead_created',
      toStage: 'lead_created',
      notes: 'เริ่ม Workflow ใหม่'
    });

    return workflow;
  }

  /**
   * ดำเนินการ Transition
   */
  async executeTransition(
    workflowId: string,
    action: WorkflowActionType,
    performedBy: string,
    data?: any,
    notes?: string
  ): Promise<WorkflowState | null> {
    const workflow = await this.getWorkflowState(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // หา Valid Transition
    const transition = WORKFLOW_TRANSITIONS.find(t => 
      t.from === workflow.currentStage && t.action === action
    );

    if (!transition) {
      throw new Error(`Invalid transition: ${action} from ${workflow.currentStage}`);
    }

    // ตรวจสอบ Conditions
    if (transition.conditions && !transition.conditions(workflow)) {
      throw new Error(`Transition conditions not met for ${action}`);
    }

    // อัพเดท Workflow State
    const updatedWorkflow = {
      ...workflow,
      currentStage: transition.to,
      updatedAt: new Date(),
      ...(data ? this.updateWorkflowData(workflow, action, data) : {})
    };

    // บันทึก Action
    await this.addAction(workflowId, {
      type: action,
      performedBy,
      fromStage: workflow.currentStage,
      toStage: transition.to,
      data,
      notes
    });

    // บันทึก Updated State
    await this.saveWorkflowState(updatedWorkflow);

    // ทำ Auto Actions ถ้ามี
    if (transition.autoTrigger) {
      await this.executeAutoActions(workflowId);
    }

    // ส่ง Notifications
    await this.sendNotifications(workflowId, transition.to, action);

    return updatedWorkflow;
  }

  /**
   * อัปเดตข้อมูล Workflow ตาม Action
   */
  private updateWorkflowData(
    workflow: WorkflowState, 
    action: WorkflowActionType, 
    data: any
  ): Partial<WorkflowState> {
    switch (action) {
      case 'scan_customer':
        return {
          scanResults: data.scanResults,
          assignedStaff: {
            ...workflow.assignedStaff,
            salesId: data.salesId
          }
        };
        
      case 'send_proposal':
        return {
          treatmentPlan: data.treatmentPlan
        };
        
      case 'schedule_appointment':
        return {
          assignedStaff: {
            ...workflow.assignedStaff,
            beauticianId: data.beauticianId
          },
          metadata: {
            ...workflow.metadata,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime
          }
        };
        
      default:
        return {};
    }
  }

  /**
   * ดำเนินการ Auto Actions
   */
  private async executeAutoActions(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflowState(workflowId);
    if (!workflow) return;

    // ตัวอย่าง Auto Actions
    switch (workflow.currentStage) {
      case 'scanned':
        // สร้าง Proposal อัตโนมัติ
        if (workflow.scanResults) {
          await this.executeTransition(
            workflowId,
            'send_proposal',
            'system',
            {
              treatmentPlan: await this.generateTreatmentPlan(workflow.scanResults)
            },
            'สร้าง Proposal อัตโนมัติจาก AI'
          );
        }
        break;
        
      case 'treatment_completed':
        // ส่ง Follow-up อัตโนมัติ
        setTimeout(async () => {
          await this.executeTransition(
            workflowId,
            'send_follow_up',
            'system',
            { followUpType: 'post_treatment' },
            'ส่ง Follow-up อัตโนมัติหลังทำ Treatment'
          );
        }, 24 * 60 * 60 * 1000); // 1 วันหลัง Treatment
        break;
    }
  }

  /**
   * ส่ง Notifications ไปยัง Staff ที่เกี่ยวข้อง
   */
  private async sendNotifications(
    workflowId: string,
    newStage: WorkflowStage,
    action: WorkflowActionType
  ): Promise<void> {
    const workflow = await this.getWorkflowState(workflowId);
    if (!workflow) return;

    const notifications = this.getNotificationTargets(workflow, newStage, action);
    
    for (const notification of notifications) {
      await this.createNotification({
        workflowId,
        targetUserId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority
      });
    }
  }

  /**
   * กำหนด Notification Targets
   */
  private getNotificationTargets(
    workflow: WorkflowState,
    newStage: WorkflowStage,
    action: WorkflowActionType
  ): Array<{
    userId: string;
    type: string;
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    void action;
    const notifications = [];

    switch (newStage) {
      case 'treatment_scheduled':
        // แจ้ง Beautician
        if (workflow.assignedStaff.beauticianId) {
          notifications.push({
            userId: workflow.assignedStaff.beauticianId,
            type: 'task_assigned',
            title: '🏥 งาน Treatment ใหม่',
            message: `มี Treatment ใหม่สำหรับ ${workflow.customerName}`,
            priority: 'high' as const
          });
        }
        break;
        
      case 'treatment_completed':
        // แจ้ง Sales สำหรับ Upsell
        if (workflow.assignedStaff.salesId) {
          notifications.push({
            userId: workflow.assignedStaff.salesId,
            type: 'upsell_opportunity',
            title: '💰 โอกาส Upsell',
            message: `${workflow.customerName} ทำ Treatment เสร็จแล้ว พร้อมสำหรับ Upsell`,
            priority: 'medium' as const
          });
        }
        break;
    }

    return notifications;
  }

  /**
   * บันทึก Workflow State ลงฐานข้อมูล
   */
  private async saveWorkflowState(workflow: WorkflowState): Promise<void> {
    const { error } = await this.supabase
      .from('workflow_states')
      .upsert({
        id: workflow.id,
        clinic_id: workflow.clinicId,
        customer_id: workflow.customerId,
        customer_name: workflow.customerName,
        customer_email: workflow.customerEmail,
        customer_phone: workflow.customerPhone,
        current_stage: workflow.currentStage,
        assigned_sales_id: workflow.assignedStaff.salesId,
        assigned_beautician_id: workflow.assignedStaff.beauticianId,
        scan_results: workflow.scanResults,
        treatment_plan: workflow.treatmentPlan,
        metadata: workflow.metadata,
        created_at: workflow.createdAt.toISOString(),
        updated_at: workflow.updatedAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save workflow state: ${error.message}`);
    }
  }

  /**
   * ดึง Workflow State จากฐานข้อมูล
   */
  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    const { data, error } = await this.supabase
      .from('workflow_states')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      console.error('Failed to get workflow state:', error);
      return null;
    }

    if (!data) return null;

    // แปลง Database format เป็น WorkflowState
    return {
      id: data.id,
      clinicId: data.clinic_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      currentStage: data.current_stage,
      assignedStaff: {
        salesId: data.assigned_sales_id,
        beauticianId: data.assigned_beautician_id
      },
      scanResults: data.scan_results,
      treatmentPlan: data.treatment_plan,
      actions: [], // จะต้องดึงแยก
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata || {}
    };
  }

  /**
   * เพิ่ม Action ใหม่
   */
  private async addAction(
    workflowId: string,
    action: Omit<WorkflowAction, 'id' | 'performedAt'>
  ): Promise<void> {
    const actionId = crypto.randomUUID();
    
    const { error } = await this.supabase
      .from('workflow_actions')
      .insert({
        id: actionId,
        workflow_id: workflowId,
        type: action.type,
        performed_by: action.performedBy,
        performed_at: new Date().toISOString(),
        from_stage: action.fromStage,
        to_stage: action.toStage,
        data: action.data,
        notes: action.notes
      });

    if (error) {
      throw new Error(`Failed to add workflow action: ${error.message}`);
    }
  }

  /**
   * สร้าง Notification
   */
  private async createNotification(params: {
    workflowId: string;
    targetUserId: string;
    type: string;
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        id: crypto.randomUUID(),
        user_id: params.targetUserId,
        type: params.type,
        title: params.title,
        message: params.message,
        priority: params.priority,
        metadata: {
          workflowId: params.workflowId
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  }

  /**
   * สร้าง Treatment Plan อัตโนมัติจาก AI
   */
  private async generateTreatmentPlan(scanResults: any): Promise<any> {
    // ตัวอย่าง Treatment Plan Generation
    const basePlan = {
      treatments: ['hydrafacial', 'vitamin_c_mask'],
      totalAmount: 3500,
      duration: 90,
      sessions: 1
    };

    // ปรับตาม Scan Results
    if (scanResults.urgencyScore > 70) {
      basePlan.treatments.push('deep_cleansing');
      basePlan.totalAmount += 1500;
      basePlan.duration += 30;
    }

    return basePlan;
  }

  /**
   * ดึง Workflows ของ Clinic
   */
  async getClinicWorkflows(
    clinicId: string,
    stage?: WorkflowStage,
    assignedTo?: string
  ): Promise<WorkflowState[]> {
    let query = this.supabase
      .from('workflow_states')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false });

    if (stage) {
      query = query.eq('current_stage', stage);
    }

    if (assignedTo) {
      query = query.or(`assigned_sales_id.eq.${assignedTo},assigned_beautician_id.eq.${assignedTo}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get clinic workflows:', error);
      return [];
    }

    return data?.map(this.mapDatabaseToWorkflowState) || [];
  }

  /**
   * แปลงข้อมูลจากฐานข้อมูลเป็น WorkflowState
   */
  private mapDatabaseToWorkflowState(data: any): WorkflowState {
    return {
      id: data.id,
      clinicId: data.clinic_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      currentStage: data.current_stage,
      assignedStaff: {
        salesId: data.assigned_sales_id,
        beauticianId: data.assigned_beautician_id
      },
      scanResults: data.scan_results,
      treatmentPlan: data.treatment_plan,
      actions: [], // จะต้องดึงแยกถ้าต้องการ
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata || {}
    };
  }
}

// สร้าง Singleton Instance
export const workflowEngine = new WorkflowEngine();
