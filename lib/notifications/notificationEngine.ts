/**
 * Enhanced Notification Engine
 */

import { createClient } from '@/lib/supabase/client';

export enum NotificationType {
  HOT_LEAD_ASSIGNED = 'hot_lead_assigned',
  QUOTA_WARNING = 'quota_warning',
  SLA_BREACH = 'sla_breach',
  PAYMENT_FAILED = 'payment_failed',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
}

export interface NotificationConfig {
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: NotificationChannel[];
  clinicId?: string;
  targetUsers?: string[];
}

export class NotificationEngine {
  private _supabase: ReturnType<typeof createClient> | null = null;

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  async sendNotification(config: NotificationConfig): Promise<string[]> {
    const results: string[] = [];
    
    // Store notification
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        clinic_id: config.clinicId,
        type: config.type,
        title: config.title,
        message: config.message,
        priority: config.priority,
        channels: config.channels,
        is_read: false
      })
      .select('id')
      .single();

    if (error) throw error;
    results.push(`stored:${data.id}`);

    // Real-time broadcast
    await this.supabase
      .channel(`clinic:${config.clinicId}`)
      .send({
        type: 'broadcast',
        event: 'notification',
        payload: config
      });

    results.push('realtime:sent');
    return results;
  }

  async checkQuotaAlert(clinicId: string, quotaType: string): Promise<void> {
    const { data } = await this.supabase
      .from('clinic_quotas')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('quota_type', quotaType)
      .single();

    if (data && data.quota_used >= data.quota_limit * 0.8) {
      await this.sendNotification({
        type: NotificationType.QUOTA_WARNING,
        title: 'Quota Warning',
        message: `${quotaType} quota at ${Math.round((data.quota_used / data.quota_limit) * 100)}%`,
        priority: 'high',
        channels: [NotificationChannel.IN_APP],
        clinicId
      });
    }
  }
}

export const notificationEngine = new NotificationEngine();
