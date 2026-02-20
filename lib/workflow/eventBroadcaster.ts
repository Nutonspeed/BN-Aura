import { createClient } from '@/lib/supabase/client';
import { WorkflowStage } from './workflowEngine';

type WorkflowUpdateDetails = {
  customerName: string;
  currentStage: WorkflowStage;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
} & Record<string, unknown>;

/**
 * Event Broadcasting System
 * จัดการการส่งข้อความระหว่าง Dashboard แบบ Real-time
 */

export type DashboardEvent = 
  | 'customer_scanned'       // Sales → Beautician
  | 'treatment_completed'    // Beautician → Sales  
  | 'payment_received'       // Customer → Sales
  | 'appointment_scheduled'  // Sales → Beautician
  | 'upsell_opportunity'     // System → Sales
  | 'task_assigned'          // System → Staff
  | 'workflow_updated'       // Any → Owner
  | 'notification_sent';     // System → User

export interface EventPayload {
  eventType: DashboardEvent;
  workflowId: string;
  sourceUserId: string;
  targetUsers: string[];
  data: {
    customerName: string;
    workflowStage: WorkflowStage;
    message: string;
    actionRequired?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
  };
  timestamp: Date;
}

export interface DashboardSubscription {
  userId: string;
  dashboardType: 'sales' | 'beautician' | 'customer' | 'owner';
  eventTypes: DashboardEvent[];
  isActive: boolean;
}

/**
 * Event Broadcaster Class
 */
export class EventBroadcaster {
  private supabase = createClient();
  private subscriptions: Map<string, DashboardSubscription> = new Map();
  private eventListeners: Map<DashboardEvent, Array<(payload: EventPayload) => void>> = new Map();

  constructor() {
    this.setupRealtimeSubscriptions();
  }

  /**
   * ส่ง Event ไปยัง Dashboard อื่น
   */
  async broadcastEvent(payload: EventPayload): Promise<void> {
    try {
      // บันทึกลงฐานข้อมูลก่อน
      const { data: insertResult, error } = await this.supabase
        .from('workflow_events')
        .insert({
          workflow_id: payload.workflowId,
          event_type: payload.eventType,
          event_data: payload.data,
          target_users: payload.targetUsers,
          broadcast: payload.targetUsers.length === 0, // True if broadcast to all
          processed: false
        })
        .select();

      if (error) {
        console.error('Failed to save event:', error);
        return;
      }

      if (insertResult && insertResult.length > 0) {
        console.log('Event saved to database:', insertResult[0]);
      }

      // ส่ง Real-time Event ผ่าน Supabase Realtime
      await this.sendRealtimeEvent(payload);

      // เรียก Local Event Listeners
      this.triggerLocalListeners(payload);

      console.log(`📡 Event broadcasted: ${payload.eventType} for workflow ${payload.workflowId}`);
    } catch (error) {
      console.error('Failed to broadcast event:', error);
    }
  }

  /**
   * Subscribe รับ Events
   */
  subscribe(subscription: DashboardSubscription): void {
    this.subscriptions.set(subscription.userId, subscription);
    console.log(`📱 User ${subscription.userId} subscribed to ${subscription.dashboardType} events`);
  }

  /**
   * Unsubscribe Events
   */
  unsubscribe(userId: string): void {
    this.subscriptions.delete(userId);
    console.log(`📱 User ${userId} unsubscribed from events`);
  }

  /**
   * เพิ่ม Event Listener
   */
  addEventListener(eventType: DashboardEvent, callback: (payload: EventPayload) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * ลบ Event Listener
   */
  removeEventListener(eventType: DashboardEvent, callback: (payload: EventPayload) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * สร้าง Event สำหรับ Sales → Beautician
   */
  async notifyTreatmentScheduled(
    workflowId: string, 
    salesUserId: string, 
    beauticianId: string, 
    customerName: string,
    treatmentDetails: Record<string, unknown>
  ): Promise<void> {
    const payload: EventPayload = {
      eventType: 'appointment_scheduled',
      workflowId,
      sourceUserId: salesUserId,
      targetUsers: [beauticianId],
      data: {
        customerName,
        workflowStage: 'treatment_scheduled',
        message: `${customerName} มีนัดหมาย Treatment ใหม่`,
        actionRequired: 'เตรียมอุปกรณ์และเช็คนัดหมาย',
        priority: 'high',
        metadata: {
          treatmentDetails,
          appointmentDate: treatmentDetails.appointmentDate,
          appointmentTime: treatmentDetails.appointmentTime
        }
      },
      timestamp: new Date()
    };

    await this.broadcastEvent(payload);
  }

  /**
   * สร้าง Event สำหรับ Beautician → Sales
   */
  async notifyTreatmentCompleted(
    workflowId: string,
    beauticianId: string,
    salesUserId: string,
    customerName: string,
    treatmentResults: Record<string, unknown>
  ): Promise<void> {
    const payload: EventPayload = {
      eventType: 'treatment_completed',
      workflowId,
      sourceUserId: beauticianId,
      targetUsers: [salesUserId],
      data: {
        customerName,
        workflowStage: 'treatment_completed',
        message: `${customerName} ทำ Treatment เสร็จแล้ว พร้อมสำหรับ Upsell`,
        actionRequired: 'ติดต่อลูกค้าเพื่อเสนอบริการเพิ่มเติม',
        priority: 'medium',
        metadata: {
          treatmentResults,
          upsellRecommendations: treatmentResults.suggestedUpsells
        }
      },
      timestamp: new Date()
    };

    await this.broadcastEvent(payload);
  }

  /**
   * สร้าง Event สำหรับ Owner Dashboard
   */
  async notifyOwnerWorkflowUpdate(
    workflowId: string,
    sourceUserId: string,
    ownerIds: string[],
    updateType: string,
    details: WorkflowUpdateDetails
  ): Promise<void> {
    const payload: EventPayload = {
      eventType: 'workflow_updated',
      workflowId,
      sourceUserId,
      targetUsers: ownerIds,
      data: {
        customerName: details.customerName,
        workflowStage: details.currentStage,
        message: details.message ?? `Workflow Update: ${updateType}`,
        priority: details.priority || 'low',
        metadata: details
      },
      timestamp: new Date()
    };

    await this.broadcastEvent(payload);
  }

  /**
   * ส่ง Task Assignment Event
   */
  async notifyTaskAssignment(
    workflowId: string,
    assignedBy: string,
    assignedTo: string,
    taskDetails: {
      taskType: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      dueDate?: Date;
    }
  ): Promise<void> {
    const payload: EventPayload = {
      eventType: 'task_assigned',
      workflowId,
      sourceUserId: assignedBy,
      targetUsers: [assignedTo],
      data: {
        customerName: taskDetails.title.split(' ').slice(-1)[0] || 'ลูกค้า',
        workflowStage: 'task_assigned' as WorkflowStage,
        message: `งานใหม่: ${taskDetails.title}`,
        actionRequired: taskDetails.description,
        priority: taskDetails.priority,
        metadata: {
          taskType: taskDetails.taskType,
          dueDate: taskDetails.dueDate?.toISOString()
        }
      },
      timestamp: new Date()
    };

    await this.broadcastEvent(payload);
  }

  /**
   * ส่ง Real-time Event ผ่าน Supabase
   */
  private async sendRealtimeEvent(payload: EventPayload): Promise<void> {
    try {
      // Supabase Realtime จะส่งผ่าน Channel
      const channel = this.supabase.channel('workflow_events');
      
      await channel.send({
        type: 'broadcast',
        event: payload.eventType,
        payload: {
          workflowId: payload.workflowId,
          eventType: payload.eventType,
          data: payload.data,
          targetUsers: payload.targetUsers,
          timestamp: payload.timestamp.toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to send realtime event:', error);
    }
  }

  /**
   * Setup Supabase Realtime Subscriptions
   */
  private setupRealtimeSubscriptions(): void {
    // Subscribe to workflow events
    const channel = this.supabase.channel('workflow_events');
    
    channel.on('broadcast', { event: '*' }, (payload: { event: string; payload: unknown }) => {
      this.handleIncomingEvent(payload);
    });

    // Subscribe to table changes
    channel.on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'workflow_events' 
      },
      (payload: { new: unknown }) => {
        this.handleDatabaseEvent(payload);
      }
    );

    channel.subscribe();
  }

  /**
   * จัดการ Incoming Events
   */
  private handleIncomingEvent(payload: { event: string; payload: unknown }): void {
    try {
      const incoming = payload.payload as Partial<EventPayload>;
      if (!incoming || !incoming.workflowId || !incoming.data) return;

      const eventPayload: EventPayload = {
        eventType: (incoming.eventType as DashboardEvent) ?? 'workflow_updated',
        workflowId: incoming.workflowId,
        sourceUserId: incoming.sourceUserId ?? '',
        targetUsers: incoming.targetUsers ?? [],
        data: incoming.data as EventPayload['data'],
        timestamp: incoming.timestamp ? new Date(incoming.timestamp) : new Date()
      };

      this.triggerLocalListeners(eventPayload);
      
    } catch (error) {
      console.error('Failed to handle incoming event:', error);
    }
  }

  /**
   * จัดการ Database Events
   */
  private handleDatabaseEvent(payload: { new: unknown }): void {
    try {
      const eventData = payload.new as {
        event_type: DashboardEvent;
        workflow_id: string;
        event_data: { sourceUserId?: string; [key: string]: unknown };
        target_users: string[];
        created_at: string;
      };

      const eventDataContent = eventData.event_data || {};

      const eventPayload: EventPayload = {
        eventType: eventData.event_type,
        workflowId: eventData.workflow_id,
        sourceUserId: eventDataContent.sourceUserId ?? '',
        targetUsers: eventData.target_users || [],
        data: {
          customerName: (eventDataContent as any).customerName ?? '',
          workflowStage: (eventDataContent as any).workflowStage ?? 'lead_created',
          message: (eventDataContent as any).message ?? '',
          actionRequired: (eventDataContent as any).actionRequired,
          priority: ((eventDataContent as any).priority as 'low' | 'medium' | 'high' | 'critical') ?? 'low',
          metadata: (eventDataContent as any).metadata
        },
        timestamp: new Date(eventData.created_at)
      };

      this.triggerLocalListeners(eventPayload);
      
    } catch (error) {
      console.error('Failed to handle database event:', error);
    }
  }

  /**
   * เรียก Local Event Listeners
   */
  private triggerLocalListeners(payload: EventPayload): void {
    const listeners = this.eventListeners.get(payload.eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for ${payload.eventType}:`, error);
        }
      });
    }
  }

  /**
   * ดึง Event History
   */
  async getEventHistory(
    workflowId: string,
    eventTypes?: DashboardEvent[],
    limit: number = 50
  ): Promise<EventPayload[]> {
    let query = this.supabase
      .from('workflow_events')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventTypes) {
      query = query.in('event_type', eventTypes);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get event history:', error);
      return [];
    }

    return data?.map(item => ({
      eventType: item.event_type,
      workflowId: item.workflow_id,
      sourceUserId: item.event_data.sourceUserId,
      targetUsers: item.target_users,
      data: item.event_data,
      timestamp: new Date(item.created_at)
    })) || [];
  }

  /**
   * Mark Events as Processed
   */
  async markEventsProcessed(eventIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('workflow_events')
      .update({ processed: true })
      .in('id', eventIds);

    if (error) {
      console.error('Failed to mark events as processed:', error);
    }
  }
}

// สร้าง Singleton Instance
export const eventBroadcaster = new EventBroadcaster();

// Predefined Event Templates
export const EventTemplates = {
  CUSTOMER_SCANNED: (workflowId: string, salesId: string, customerName: string) => ({
    eventType: 'customer_scanned' as DashboardEvent,
    workflowId,
    sourceUserId: salesId,
    targetUsers: [], // Broadcast to all
    data: {
      customerName,
      workflowStage: 'scanned' as WorkflowStage,
      message: `${customerName} ถูกสแกนผิวแล้ว`,
      priority: 'medium' as const
    },
    timestamp: new Date()
  }),

  PAYMENT_RECEIVED: (workflowId: string, customerId: string, salesId: string, amount: number) => ({
    eventType: 'payment_received' as DashboardEvent,
    workflowId,
    sourceUserId: customerId,
    targetUsers: [salesId],
    data: {
      customerName: 'ลูกค้า',
      workflowStage: 'payment_confirmed' as WorkflowStage,
      message: `ได้รับชำระเงิน ฿${amount.toLocaleString()}`,
      priority: 'high' as const,
      metadata: { amount }
    },
    timestamp: new Date()
  }),

  UPSELL_OPPORTUNITY: (workflowId: string, beauticianId: string, salesId: string, customerName: string) => ({
    eventType: 'upsell_opportunity' as DashboardEvent,
    workflowId,
    sourceUserId: beauticianId,
    targetUsers: [salesId],
    data: {
      customerName,
      workflowStage: 'treatment_completed' as WorkflowStage,
      message: `โอกาส Upsell สำหรับ ${customerName}`,
      actionRequired: 'ติดต่อลูกค้าเพื่อเสนอบริการเพิ่มเติม',
      priority: 'medium' as const
    },
    timestamp: new Date()
  })
};
