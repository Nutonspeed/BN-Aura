import { createClient } from '@/lib/supabase/client';
import { callGemini } from '@/lib/ai';
import { resendService } from '@/lib/email/resendService';
import { emailTemplates, type FollowUpEmailData } from '@/lib/email/templates/followUpEmail';
import { smsService } from '@/lib/sms/smsService';
import { smsTemplates, type SMSTemplateData } from '@/lib/sms/templates';
import { lineService } from '@/lib/line';
import { taskQueueManager } from '@/lib/workflow/taskQueue';
import { eventBroadcaster } from '@/lib/workflow/eventBroadcaster';

/**
 * Automated Follow-up System
 * ระบบติดตามลูกค้าอัตโนมัติด้วย AI personalization
 */

export type FollowUpType = 
  | 'post_treatment'     // หลังทำ Treatment
  | 'payment_reminder'   // เตือนชำระเงิน
  | 'appointment_reminder' // เตือนนัดหมาย
  | 'satisfaction_survey'  // สำรวจความพึงพอใจ
  | 'upsell_opportunity'   // โอกาส Upsell
  | 'loyalty_reward'       // รางวัลความภักดี
  | 'birthday_special'     // โปรโมชั่นวันเกิด
  | 'inactive_reactivation'; // เรียกลูกค้ากลับ

export type FollowUpChannel = 'email' | 'sms' | 'line' | 'call' | 'in_app';

export interface FollowUpRule {
  id: string;
  clinicId: string;
  name: string;
  type: FollowUpType;
  triggerConditions: {
    daysAfter?: number;
    daysBefore?: number;
    workflowStage?: string;
    customerSegment?: string;
    treatmentType?: string[];
  };
  channels: FollowUpChannel[];
  priority: 'low' | 'medium' | 'high';
  active: boolean;
  aiPersonalization: boolean;
  template: {
    subject?: string;
    message: string;
    variables: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUpExecution {
  id: string;
  ruleId: string;
  customerId: string;
  workflowId?: string;
  channel: FollowUpChannel;
  scheduledAt: Date;
  executedAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  personalizedContent?: {
    subject?: string;
    message: string;
    aiGenerated: boolean;
  };
  response?: {
    opened: boolean;
    clicked: boolean;
    replied: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
  metadata: Record<string, any>;
}

/**
 * Follow-up Automation Engine
 */
export class FollowUpAutomationEngine {
  private supabase = createClient();

  /**
   * สร้าง Follow-up Rule ใหม่
   */
  async createFollowUpRule(rule: Omit<FollowUpRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<FollowUpRule> {
    const ruleId = crypto.randomUUID();
    
    const followUpRule: FollowUpRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveFollowUpRule(followUpRule);
    return followUpRule;
  }

  /**
   * ตรวจสอบและสร้าง Follow-ups อัตโนมัติ
   */
  async processAutomatedFollowUps(clinicId: string): Promise<number> {
    const activeRules = await this.getActiveRules(clinicId);
    let processedCount = 0;

    for (const rule of activeRules) {
      const eligibleCustomers = await this.findEligibleCustomers(rule);
      
      for (const customer of eligibleCustomers) {
        await this.scheduleFollowUp(rule, customer);
        processedCount++;
      }
    }

    return processedCount;
  }

  /**
   * หาลูกค้าที่ควรได้รับ Follow-up
   */
  private async findEligibleCustomers(rule: FollowUpRule): Promise<any[]> {
    let query = this.supabase
      .from('customers')
      .select(`
        id, full_name, email, phone,
        workflow_states!inner(
          current_stage, updated_at, scan_results, treatment_plan
        )
      `)
      .eq('clinic_id', rule.clinicId);

    // กรอง Stage
    if (rule.triggerConditions.workflowStage) {
      query = query.eq('workflow_states.current_stage', rule.triggerConditions.workflowStage);
    }

    // กรองตามเวลา
    if (rule.triggerConditions.daysAfter) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - rule.triggerConditions.daysAfter);
      query = query.lte('workflow_states.updated_at', targetDate.toISOString());
    }

    const { data } = await query;
    return data || [];
  }

  /**
   * สร้าง Follow-up Schedule
   */
  private async scheduleFollowUp(rule: FollowUpRule, customer: any): Promise<void> {
    // ตรวจสอบว่าได้ส่งไปแล้วหรือยัง
    const existingExecution = await this.checkExistingFollowUp(rule.id, customer.id);
    if (existingExecution) return;

    for (const channel of rule.channels) {
      const scheduledAt = this.calculateScheduleTime(rule, customer);
      
      const execution: FollowUpExecution = {
        id: crypto.randomUUID(),
        ruleId: rule.id,
        customerId: customer.id,
        workflowId: customer.workflow_states?.[0]?.id,
        channel,
        scheduledAt,
        status: 'pending',
        metadata: {
          customerName: customer.full_name,
          ruleName: rule.name,
          triggerType: rule.type
        }
      };

      // สร้าง AI Personalized Content
      if (rule.aiPersonalization) {
        execution.personalizedContent = await this.generatePersonalizedContent(rule, customer);
      }

      await this.saveFollowUpExecution(execution);

      // สร้าง Task สำหรับ Staff ถ้าเป็น Call
      if (channel === 'call') {
        await this.createFollowUpTask(execution, customer);
      }
    }
  }

  /**
   * สร้าง AI Personalized Content
   */
  private async generatePersonalizedContent(rule: FollowUpRule, customer: any): Promise<{
    subject?: string;
    message: string;
    aiGenerated: boolean;
  }> {
    const customerContext = {
      name: customer.full_name,
      treatmentHistory: customer.workflow_states?.[0]?.treatment_plan,
      skinConcerns: customer.workflow_states?.[0]?.scan_results?.concerns,
      stage: customer.workflow_states?.[0]?.current_stage
    };

    const prompt = `สร้างข้อความติดตามลูกค้าคลินิกความงาม

ประเภท: ${rule.type}
ลูกค้า: ${customer.full_name}
ข้อมูลลูกค้า: ${JSON.stringify(customerContext)}
Template เดิม: ${rule.template.message}

โปรดสร้างข้อความใหม่ที่:
1. เป็นภาษาไทยสุภาพและเป็นกันเอง
2. ปรับแต่งตาม Treatment และปัญหาผิวของลูกค้า
3. มี Call-to-Action ที่เหมาะสม
4. ความยาวไม่เกิน 200 คำ

ตอบในรูปแบบ JSON:
{
  "subject": "หัวข้อ (ถ้าเป็น email)",
  "message": "ข้อความหลัก",
  "tone": "friendly|professional|caring"
}`;

    try {
      const response = await callGemini(prompt, 'gemini-2.0-flash', {
        clinicId: rule.clinicId,
        useCache: false
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        return {
          subject: generated.subject,
          message: generated.message,
          aiGenerated: true
        };
      }
    } catch (error) {
      console.error('Failed to generate personalized content:', error);
    }

    // Fallback to template
    return {
      subject: rule.template.subject,
      message: rule.template.message.replace(/\{customerName\}/g, customer.full_name),
      aiGenerated: false
    };
  }

  /**
   * Execute Scheduled Follow-ups
   */
  async executeScheduledFollowUps(): Promise<number> {
    const { data: pendingExecutions } = await this.supabase
      .from('followup_executions')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (!pendingExecutions) return 0;

    let executedCount = 0;

    for (const execution of pendingExecutions) {
      try {
        const success = await this.executeFollowUp(execution);
        if (success) {
          executedCount++;
        }
      } catch (error) {
        console.error(`Failed to execute follow-up ${execution.id}:`, error);
        await this.updateExecutionStatus(execution.id, 'failed');
      }
    }

    return executedCount;
  }

  /**
   * Execute Individual Follow-up
   */
  private async executeFollowUp(execution: FollowUpExecution): Promise<boolean> {
    switch (execution.channel) {
      case 'email':
        return await this.sendEmail(execution);
      case 'sms':
        return await this.sendSMS(execution);
      case 'line':
        return await this.sendLineMessage(execution);
      case 'in_app':
        return await this.createInAppNotification(execution);
      case 'call':
        // Call ถูกสร้างเป็น Task แล้ว
        await this.updateExecutionStatus(execution.id, 'sent');
        return true;
      default:
        return false;
    }
  }

  /**
   * Send Email Follow-up
   */
  private async sendEmail(execution: FollowUpExecution): Promise<boolean> {
    try {
      // Get customer details
      const { data: customer } = await this.supabase
        .from('customers')
        .select('full_name, email, clinic_id, clinics(display_name)')
        .eq('id', execution.customerId)
        .single();

      if (!customer?.email) {
        console.error('❌ Customer email not found');
        await this.updateExecutionStatus(execution.id, 'failed', 'Customer email not found');
        return false;
      }

      // Prepare email data
      const content = execution.personalizedContent as any;
      const emailData: Partial<FollowUpEmailData> = {
        customerName: customer.full_name,
        clinicName: (customer.clinics as any)?.[0]?.display_name?.th || 'BN-Aura',
        subject: content?.subject || 'ข้อความจากคลินิก',
        message: content?.message || '',
        ctaText: content?.ctaText,
        ctaUrl: content?.ctaUrl
      };

      // Select appropriate template based on execution type
      let emailHtml: string;
      const templateType = execution.metadata?.templateType as string | undefined;
      
      if (templateType && templateType in emailTemplates) {
        emailHtml = emailTemplates[templateType as keyof typeof emailTemplates](emailData);
      } else {
        // Use generic template
        emailHtml = emailTemplates.followUpCheck(emailData);
      }

      // Send email via Resend
      const result = await resendService.send({
        to: customer.email,
        subject: emailData.subject || 'ข้อความจากคลินิก',
        html: emailHtml,
        tags: [
          { name: 'type', value: 'follow_up' },
          { name: 'customer_id', value: execution.customerId },
          { name: 'clinic_id', value: customer.clinic_id || '' }
        ]
      });

      if (result.success) {
        await this.updateExecutionStatus(execution.id, 'sent', undefined, {
          messageId: result.messageId,
          sentAt: new Date().toISOString()
        });
        console.log(`✅ Email sent to ${customer.email}: ${emailData.subject}`);
        return true;
      } else {
        await this.updateExecutionStatus(execution.id, 'failed', result.error);
        console.error(`❌ Email failed: ${result.error}`);
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateExecutionStatus(execution.id, 'failed', errorMessage);
      console.error('❌ Email sending error:', error);
      return false;
    }
  }

  /**
   * Send SMS Follow-up
   */
  private async sendSMS(execution: FollowUpExecution): Promise<boolean> {
    try {
      // Get customer details
      const { data: customer } = await this.supabase
        .from('customers')
        .select('full_name, phone, clinic_id, clinics(display_name)')
        .eq('id', execution.customerId)
        .single();

      if (!customer?.phone) {
        console.error('❌ Customer phone not found');
        await this.updateExecutionStatus(execution.id, 'failed', 'Customer phone not found');
        return false;
      }

      // Validate phone number
      if (!smsService.isValidThaiPhone(customer.phone)) {
        console.error('❌ Invalid Thai phone number:', customer.phone);
        await this.updateExecutionStatus(execution.id, 'failed', 'Invalid phone number');
        return false;
      }

      // Prepare SMS data
      const smsContent = execution.personalizedContent as any;
      const smsData: SMSTemplateData = {
        customerName: customer.full_name,
        clinicName: (customer.clinics as any)?.[0]?.display_name?.th || 'BN-Aura',
        treatmentName: execution.metadata?.treatmentName,
        appointmentDate: execution.metadata?.appointmentDate,
        appointmentTime: execution.metadata?.appointmentTime,
        amount: execution.metadata?.amount,
        link: smsContent?.ctaUrl
      };

      // Select appropriate template
      let smsMessage: string;
      const templateType = execution.metadata?.templateType as string | undefined;
      
      if (templateType && templateType in smsTemplates) {
        smsMessage = smsTemplates[templateType as keyof typeof smsTemplates](smsData as any);
      } else if (execution.personalizedContent?.message) {
        // Use personalized message (truncate if needed)
        smsMessage = execution.personalizedContent.message.substring(0, 160);
      } else {
        // Generic notification
        smsMessage = smsTemplates.notification({
          customerName: customer.full_name,
          message: 'มีข้อความจากคลินิก',
          clinicName: smsData.clinicName
        });
      }

      // Send SMS
      const result = await smsService.send({
        to: customer.phone,
        message: smsMessage,
        sender: 'BN-Aura',
        tags: {
          type: 'follow_up',
          customer_id: execution.customerId,
          clinic_id: customer.clinic_id || ''
        }
      });

      if (result.success) {
        await this.updateExecutionStatus(execution.id, 'sent', undefined, {
          messageId: result.messageId,
          creditsUsed: result.creditsUsed,
          sentAt: new Date().toISOString()
        });
        console.log(`✅ SMS sent to ${customer.phone}: ${smsMessage.substring(0, 50)}...`);
        return true;
      } else {
        await this.updateExecutionStatus(execution.id, 'failed', result.error);
        console.error(`❌ SMS failed: ${result.error}`);
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateExecutionStatus(execution.id, 'failed', errorMessage);
      console.error('❌ SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send LINE Message
   */
  private async sendLineMessage(execution: FollowUpExecution): Promise<boolean> {
    try {
      // Get customer LINE ID from database
      const { data: customer } = await this.supabase
        .from('customers')
        .select('full_name, metadata, clinic_id, clinics(display_name)')
        .eq('id', execution.customerId)
        .single();

      const lineUserId = customer?.metadata?.lineUserId;

      if (!lineUserId) {
        console.warn('⚠️ Customer LINE ID not found, skipping LINE message');
        await this.updateExecutionStatus(execution.id, 'failed', 'LINE ID not found');
        return false;
      }

      // Prepare message
      const lineContent = execution.personalizedContent as any;
      const message = lineContent?.message ||
        `สวัสดีค่ะ คุณ${customer.full_name}\nมีข้อความจาก${(customer.clinics as any)?.[0]?.display_name?.th || 'คลินิก'}`;

      // Send LINE message
      const result = await lineService.sendMessage({
        to: lineUserId,
        message,
        imageUrl: execution.metadata?.imageUrl,
        quickReply: execution.metadata?.quickReply
      });

      if (result.success) {
        await this.updateExecutionStatus(execution.id, 'sent', undefined, {
          messageId: result.messageId,
          sentAt: new Date().toISOString()
        });
        console.log(`✅ LINE message sent to ${customer.full_name}`);
        return true;
      } else {
        await this.updateExecutionStatus(execution.id, 'failed', result.error);
        console.error(`❌ LINE failed: ${result.error}`);
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateExecutionStatus(execution.id, 'failed', errorMessage);
      console.error('❌ LINE sending error:', error);
      return false;
    }
  }

  /**
   * Create In-App Notification
   */
  private async createInAppNotification(execution: FollowUpExecution): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        id: crypto.randomUUID(),
        user_id: execution.customerId,
        type: 'followup',
        title: execution.personalizedContent?.subject || 'ข้อความจากคลินิก',
        message: execution.personalizedContent?.message || '',
        priority: 'medium',
        metadata: {
          followUpExecutionId: execution.id,
          ruleId: execution.ruleId
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create in-app notification:', error);
      return false;
    }

    await this.updateExecutionStatus(execution.id, 'sent');
    return true;
  }

  /**
   * สร้าง Follow-up Task สำหรับ Call
   */
  private async createFollowUpTask(execution: FollowUpExecution, customer: any): Promise<void> {
    // หา Sales Staff ที่ดูแลลูกค้า
    const { data: workflow } = await this.supabase
      .from('workflow_states')
      .select('assigned_sales_id')
      .eq('customer_id', execution.customerId)
      .single();

    if (workflow?.assigned_sales_id) {
      await taskQueueManager.createTask({
        workflowId: execution.workflowId!,
        assignedTo: workflow.assigned_sales_id,
        taskType: 'customer_follow_up',
        customerName: customer.full_name,
        priority: 'medium',
        taskData: {
          followUpExecutionId: execution.id,
          followUpType: execution.metadata.triggerType,
          customerPhone: customer.phone,
          suggestedScript: execution.personalizedContent?.message
        },
        notes: `โทรติดตาม: ${execution.metadata.ruleName}`
      });
    }
  }

  /**
   * Update Execution Status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: 'pending' | 'sent' | 'failed' | 'cancelled',
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    if (status === 'sent') {
      updates.executed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updates.error = errorMessage;
    }
    
    if (metadata) {
      updates.metadata = { ...updates.metadata, ...metadata };
    }

    const { error } = await this.supabase
      .from('followup_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) {
      console.error('Failed to update execution status:', error);
    }
  }

  /**
   * Track Follow-up Response
   */
  async trackFollowUpResponse(executionId: string, response: {
    opened?: boolean;
    clicked?: boolean;
    replied?: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    replyText?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('followup_executions')
      .update({
        response,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) {
      console.error('Failed to track follow-up response:', error);
    }

    // สร้าง Event สำหรับ positive response
    if (response.sentiment === 'positive' && response.replied) {
      const execution = await this.getFollowUpExecution(executionId);
      if (execution) {
        await eventBroadcaster.broadcastEvent({
          eventType: 'upsell_opportunity',
          workflowId: execution.workflowId!,
          sourceUserId: execution.customerId,
          targetUsers: [], // Broadcast to sales team
          data: {
            customerName: execution.metadata.customerName,
            workflowStage: 'follow_up' as any,
            message: 'ลูกค้าตอบกลับ Follow-up เป็นบวก',
            actionRequired: 'ติดต่อเสนอบริการเพิ่มเติม',
            priority: 'medium' as any,
            metadata: {
              followUpResponse: response.replyText,
              sentiment: response.sentiment
            }
          },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Get Follow-up Analytics
   */
  async getFollowUpAnalytics(clinicId: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    responseRate: number;
    sentimentBreakdown: Record<string, number>;
    channelPerformance: Record<FollowUpChannel, {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    }>;
    typePerformance: Record<FollowUpType, number>;
  }> {
    let query = this.supabase
      .from('followup_executions')
      .select(`
        *,
        followup_rules!inner(clinic_id)
      `)
      .eq('followup_rules.clinic_id', clinicId);

    if (dateRange) {
      query = query
        .gte('executed_at', dateRange.from.toISOString())
        .lte('executed_at', dateRange.to.toISOString());
    }

    const { data: executions } = await query;

    if (!executions) {
      return {
        totalSent: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0,
        sentimentBreakdown: {},
        channelPerformance: {} as any,
        typePerformance: {} as any
      };
    }

    const totalSent = executions.filter(e => e.status === 'sent').length;
    const delivered = executions.filter(e => e.status === 'delivered').length;
    const opened = executions.filter(e => e.response?.opened).length;
    const clicked = executions.filter(e => e.response?.clicked).length;
    const replied = executions.filter(e => e.response?.replied).length;

    // Channel Performance
    const channelPerformance: any = {};
    const typePerformance: any = {};
    const sentimentBreakdown: any = {};

    for (const execution of executions) {
      // Channel stats
      if (!channelPerformance[execution.channel]) {
        channelPerformance[execution.channel] = {
          sent: 0, delivered: 0, opened: 0, clicked: 0
        };
      }
      
      const channelStats = channelPerformance[execution.channel];
      if (execution.status === 'sent') channelStats.sent++;
      if (execution.status === 'delivered') channelStats.delivered++;
      if (execution.response?.opened) channelStats.opened++;
      if (execution.response?.clicked) channelStats.clicked++;

      // Sentiment tracking
      if (execution.response?.sentiment) {
        sentimentBreakdown[execution.response.sentiment] = 
          (sentimentBreakdown[execution.response.sentiment] || 0) + 1;
      }
    }

    return {
      totalSent,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
      responseRate: totalSent > 0 ? (replied / totalSent) * 100 : 0,
      sentimentBreakdown,
      channelPerformance,
      typePerformance
    };
  }

  // Helper methods
  private calculateScheduleTime(rule: FollowUpRule, customer: any): Date {
    const scheduleDate = new Date();
    
    if (rule.triggerConditions.daysBefore) {
      scheduleDate.setDate(scheduleDate.getDate() + rule.triggerConditions.daysBefore);
    } else if (rule.triggerConditions.daysAfter) {
      // Already handled in findEligibleCustomers
    }

    return scheduleDate;
  }

  private async checkExistingFollowUp(ruleId: string, customerId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('followup_executions')
      .select('id')
      .eq('rule_id', ruleId)
      .eq('customer_id', customerId)
      .single();

    return !!data;
  }

  private async getActiveRules(clinicId: string): Promise<FollowUpRule[]> {
    const { data } = await this.supabase
      .from('followup_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('active', true);

    return data?.map(this.mapDatabaseToFollowUpRule) || [];
  }

  private async saveFollowUpRule(rule: FollowUpRule): Promise<void> {
    const { error } = await this.supabase
      .from('followup_rules')
      .upsert({
        id: rule.id,
        clinic_id: rule.clinicId,
        name: rule.name,
        type: rule.type,
        trigger_conditions: rule.triggerConditions,
        channels: rule.channels,
        priority: rule.priority,
        active: rule.active,
        ai_personalization: rule.aiPersonalization,
        template: rule.template,
        created_at: rule.createdAt.toISOString(),
        updated_at: rule.updatedAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save follow-up rule: ${error.message}`);
    }
  }

  private async saveFollowUpExecution(execution: FollowUpExecution): Promise<void> {
    const { error } = await this.supabase
      .from('followup_executions')
      .insert({
        id: execution.id,
        rule_id: execution.ruleId,
        customer_id: execution.customerId,
        workflow_id: execution.workflowId,
        channel: execution.channel,
        scheduled_at: execution.scheduledAt.toISOString(),
        executed_at: execution.executedAt?.toISOString(),
        status: execution.status,
        personalized_content: execution.personalizedContent,
        response: execution.response,
        metadata: execution.metadata
      });

    if (error) {
      throw new Error(`Failed to save follow-up execution: ${error.message}`);
    }
  }

  private async getFollowUpExecution(executionId: string): Promise<FollowUpExecution | null> {
    const { data } = await this.supabase
      .from('followup_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    return data ? this.mapDatabaseToFollowUpExecution(data) : null;
  }

  private mapDatabaseToFollowUpRule(data: any): FollowUpRule {
    return {
      id: data.id,
      clinicId: data.clinic_id,
      name: data.name,
      type: data.type,
      triggerConditions: data.trigger_conditions,
      channels: data.channels,
      priority: data.priority,
      active: data.active,
      aiPersonalization: data.ai_personalization,
      template: data.template,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDatabaseToFollowUpExecution(data: any): FollowUpExecution {
    return {
      id: data.id,
      ruleId: data.rule_id,
      customerId: data.customer_id,
      workflowId: data.workflow_id,
      channel: data.channel,
      scheduledAt: new Date(data.scheduled_at),
      executedAt: data.executed_at ? new Date(data.executed_at) : undefined,
      status: data.status,
      personalizedContent: data.personalized_content,
      response: data.response,
      metadata: data.metadata
    };
  }
}

// Export singleton instance
export const followUpEngine = new FollowUpAutomationEngine();
