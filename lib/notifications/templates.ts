/**
 * Notification Template System
 * Centralized message templates for consistent multi-channel messaging
 */

export interface TemplateData {
  customerName?: string;
  clinicName?: string;
  queueNumber?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  treatmentName?: string;
  analysisScore?: number;
  pointsEarned?: number;
  totalPoints?: number;
  staffName?: string;
  [key: string]: any;
}

export interface RenderedTemplate {
  title: string;
  message: string;
  shortMessage: string; // For SMS (max ~160 chars)
}

type TemplateId =
  | 'queue_called'
  | 'appointment_reminder_24h'
  | 'appointment_reminder_1h'
  | 'analysis_complete'
  | 'follow_up_7d'
  | 'quota_warning'
  | 'payment_success'
  | 'points_earned'
  | 'welcome';

const TEMPLATES: Record<TemplateId, {
  title: (d: TemplateData) => string;
  message: (d: TemplateData) => string;
  shortMessage: (d: TemplateData) => string;
}> = {
  queue_called: {
    title: () => 'คิวของคุณถูกเรียกแล้ว',
    message: (d) =>
      `สวัสดีค่ะ คุณ${d.customerName || ''} คิวหมายเลข ${d.queueNumber || ''} ถูกเรียกแล้วค่ะ กรุณาเข้าพบที่เคาน์เตอร์ ${d.clinicName || ''}`,
    shortMessage: (d) =>
      `คิว #${d.queueNumber} ถูกเรียกแล้ว กรุณาเข้าพบที่เคาน์เตอร์`,
  },
  appointment_reminder_24h: {
    title: () => 'แจ้งเตือนนัดหมาย (พรุ่งนี้)',
    message: (d) =>
      `สวัสดีค่ะ คุณ${d.customerName || ''} คุณมีนัดหมาย${d.treatmentName ? ' ' + d.treatmentName : ''} ในวันพรุ่งนี้ ${d.appointmentDate || ''} เวลา ${d.appointmentTime || ''} ที่ ${d.clinicName || ''} ค่ะ`,
    shortMessage: (d) =>
      `นัดหมายพรุ่งนี้ ${d.appointmentTime || ''} ${d.treatmentName || ''} ที่ ${d.clinicName || ''}`,
  },
  appointment_reminder_1h: {
    title: () => 'นัดหมายอีก 1 ชั่วโมง',
    message: (d) =>
      `คุณ${d.customerName || ''} นัดหมายของคุณจะเริ่มในอีก 1 ชั่วโมง (${d.appointmentTime || ''}) กรุณามาถึงก่อน 10 นาทีค่ะ`,
    shortMessage: (d) =>
      `นัดหมายอีก 1 ชม. (${d.appointmentTime || ''}) กรุณามาถึงก่อน 10 นาที`,
  },
  analysis_complete: {
    title: () => 'ผลวิเคราะห์ผิวของคุณพร้อมแล้ว',
    message: (d) =>
      `คุณ${d.customerName || ''} ผลวิเคราะห์ผิวของคุณพร้อมแล้วค่ะ คะแนนผิวโดยรวม: ${d.analysisScore || 0}/100 คุณสามารถดูรายละเอียดและคำแนะนำการดูแลผิวได้ที่พอร์ทัลของคุณ`,
    shortMessage: (d) =>
      `ผลวิเคราะห์ผิวพร้อมแล้ว คะแนน: ${d.analysisScore || 0}/100 ดูรายละเอียดที่พอร์ทัล`,
  },
  follow_up_7d: {
    title: () => 'ติดตามผลหลังทรีทเมนต์',
    message: (d) =>
      `สวัสดีค่ะ คุณ${d.customerName || ''} ครบ 7 วันแล้วหลังจาก${d.treatmentName || 'ทรีทเมนต์'} ผิวของคุณเป็นอย่างไรบ้างคะ? หากมีข้อสงสัยสามารถติดต่อเราได้เลยค่ะ`,
    shortMessage: (d) =>
      `ครบ 7 วันหลัง${d.treatmentName || 'ทรีทเมนต์'} ผิวเป็นอย่างไรคะ? ติดต่อเราได้เลย`,
  },
  quota_warning: {
    title: () => 'แจ้งเตือน: AI Quota ใกล้หมด',
    message: (d) =>
      `${d.clinicName || 'คลินิก'}: AI Quota เหลือ ${d.remainingQuota || 0} ครั้ง (${d.usagePercent || 0}% ใช้ไปแล้ว) กรุณาอัพเกรดแพ็คเกจหรือติดต่อ admin`,
    shortMessage: (d) =>
      `AI Quota เหลือ ${d.remainingQuota || 0} ครั้ง กรุณาอัพเกรด`,
  },
  payment_success: {
    title: () => 'ชำระเงินสำเร็จ',
    message: (d) =>
      `คุณ${d.customerName || ''} ชำระเงินสำเร็จ จำนวน ฿${(d.amount || 0).toLocaleString()} ขอบคุณที่ใช้บริการ ${d.clinicName || ''} ค่ะ`,
    shortMessage: (d) =>
      `ชำระเงินสำเร็จ ฿${(d.amount || 0).toLocaleString()} ขอบคุณค่ะ`,
  },
  points_earned: {
    title: () => 'ได้รับคะแนนสะสม',
    message: (d) =>
      `คุณ${d.customerName || ''} ได้รับ ${d.pointsEarned || 0} คะแนนสะสม! คะแนนรวม: ${d.totalPoints || 0} pts สามารถใช้แลกส่วนลดได้ในครั้งถัดไป`,
    shortMessage: (d) =>
      `+${d.pointsEarned || 0} pts! รวม ${d.totalPoints || 0} pts แลกส่วนลดได้`,
  },
  welcome: {
    title: () => 'ยินดีต้อนรับ',
    message: (d) =>
      `ยินดีต้อนรับสู่ ${d.clinicName || 'BN-Aura'} คุณ${d.customerName || ''} ค่ะ เราพร้อมดูแลผิวของคุณ`,
    shortMessage: (d) =>
      `ยินดีต้อนรับสู่ ${d.clinicName || 'BN-Aura'} ค่ะ`,
  },
};

/**
 * Render a notification template with data
 */
export function renderTemplate(
  templateId: string,
  data: TemplateData
): RenderedTemplate {
  const template = TEMPLATES[templateId as TemplateId];

  if (!template) {
    return {
      title: data.title || 'Notification',
      message: data.message || '',
      shortMessage: (data.message || '').slice(0, 160),
    };
  }

  return {
    title: template.title(data),
    message: template.message(data),
    shortMessage: template.shortMessage(data),
  };
}

/**
 * Get all available template IDs
 */
export function getTemplateIds(): string[] {
  return Object.keys(TEMPLATES);
}
