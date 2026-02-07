/**
 * Automated Notification Triggers
 * Centralized service for scheduling and dispatching notifications
 * based on system events (appointments, queue, analysis, follow-ups)
 */

interface TriggerPayload {
  clinicId: string;
  userId?: string;
  customerId?: string;
  phone?: string;
  customerName?: string;
}

interface AppointmentReminderPayload extends TriggerPayload {
  appointmentId: string;
  appointmentTime: string;
  serviceName: string;
}

interface AnalysisCompletePayload extends TriggerPayload {
  analysisId: string;
  overallScore: number;
  skinType?: string;
}

interface FollowUpPayload extends TriggerPayload {
  treatmentName: string;
  treatmentDate: string;
  daysSinceTreatment: number;
}

interface QuotaAlertPayload extends TriggerPayload {
  quotaType: string;
  quotaUsed: number;
  quotaLimit: number;
  percentUsed: number;
}

/**
 * Build notification messages in Thai
 */
const messageTemplates = {
  appointmentReminder24h: (p: AppointmentReminderPayload) =>
    `${p.customerName || 'คุณลูกค้า'} มีนัดหมาย "${p.serviceName}" พรุ่งนี้เวลา ${p.appointmentTime} น. กรุณาเตรียมตัวล่วงหน้า`,

  appointmentReminder1h: (p: AppointmentReminderPayload) =>
    `${p.customerName || 'คุณลูกค้า'} นัดหมาย "${p.serviceName}" ของคุณจะถึงในอีก 1 ชั่วโมง (${p.appointmentTime} น.)`,

  analysisComplete: (p: AnalysisCompletePayload) =>
    `ผลวิเคราะห์ผิวของ${p.customerName || 'คุณลูกค้า'}พร้อมแล้ว! Overall Score: ${p.overallScore}/100 ${p.skinType ? `(${p.skinType})` : ''}`,

  followUp7Days: (p: FollowUpPayload) =>
    `สวัสดีค่ะ ${p.customerName || 'คุณลูกค้า'} ผ่านมา ${p.daysSinceTreatment} วันหลังทำ "${p.treatmentName}" สบายดีไหมคะ? มีอะไรให้ช่วยเหลือติดต่อเราได้เลย`,

  quotaWarning: (p: QuotaAlertPayload) =>
    `AI Quota Alert: ${p.quotaType} ใช้ไปแล้ว ${p.percentUsed}% (${p.quotaUsed}/${p.quotaLimit}) กรุณาอัปเกรดแผนหรือรอรีเซ็ต`,
};

/**
 * Dispatch notification via internal API
 */
async function dispatchNotification(opts: {
  clinicId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  phone?: string;
  channels?: string[];
}): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();

    // Store in-app notification
    const res = await fetch(`${baseUrl}/api/notifications/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: opts.type,
        clinicId: opts.clinicId,
        phone: opts.phone,
        message: opts.message,
        queueNumber: 0, // Not a queue notification, but reuse the endpoint
      }),
    });

    return res.ok;
  } catch (e) {
    console.error('Notification dispatch failed:', e);
    return false;
  }
}

/**
 * Trigger: Appointment Reminder (24h before)
 */
export async function triggerAppointmentReminder24h(payload: AppointmentReminderPayload): Promise<boolean> {
  return dispatchNotification({
    clinicId: payload.clinicId,
    userId: payload.userId,
    type: 'appointment_reminder',
    title: 'นัดหมายพรุ่งนี้',
    message: messageTemplates.appointmentReminder24h(payload),
    priority: 'medium',
    phone: payload.phone,
  });
}

/**
 * Trigger: Appointment Reminder (1h before)
 */
export async function triggerAppointmentReminder1h(payload: AppointmentReminderPayload): Promise<boolean> {
  return dispatchNotification({
    clinicId: payload.clinicId,
    userId: payload.userId,
    type: 'appointment_reminder',
    title: 'นัดหมายใกล้ถึงแล้ว',
    message: messageTemplates.appointmentReminder1h(payload),
    priority: 'high',
    phone: payload.phone,
  });
}

/**
 * Trigger: Skin Analysis Complete
 */
export async function triggerAnalysisComplete(payload: AnalysisCompletePayload): Promise<boolean> {
  return dispatchNotification({
    clinicId: payload.clinicId,
    userId: payload.userId,
    type: 'analysis_complete',
    title: 'ผลวิเคราะห์ผิวพร้อมแล้ว',
    message: messageTemplates.analysisComplete(payload),
    priority: 'medium',
    phone: payload.phone,
  });
}

/**
 * Trigger: Follow-up Reminder (7 days after treatment)
 */
export async function triggerFollowUpReminder(payload: FollowUpPayload): Promise<boolean> {
  return dispatchNotification({
    clinicId: payload.clinicId,
    userId: payload.userId,
    type: 'treatment_update',
    title: 'ติดตามผลหลังทรีทเมนต์',
    message: messageTemplates.followUp7Days(payload),
    priority: 'low',
    phone: payload.phone,
  });
}

/**
 * Trigger: Quota Warning
 */
export async function triggerQuotaWarning(payload: QuotaAlertPayload): Promise<boolean> {
  return dispatchNotification({
    clinicId: payload.clinicId,
    userId: payload.userId,
    type: 'quota_alert',
    title: 'AI Quota Warning',
    message: messageTemplates.quotaWarning(payload),
    priority: payload.percentUsed >= 95 ? 'critical' : 'high',
  });
}

/**
 * Get base URL for internal API calls
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}
