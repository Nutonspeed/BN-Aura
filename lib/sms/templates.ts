// SMS Templates for Thai SMS Gateways
// Keep messages short (70 Thai characters max for single SMS)

export interface SMSTemplateData {
  customerName: string;
  clinicName: string;
  appointmentDate?: string;
  appointmentTime?: string;
  treatmentName?: string;
  amount?: string;
  link?: string;
}

export const smsTemplates = {
  /**
   * Appointment Reminder (1 day before)
   */
  appointmentReminder: (data: SMSTemplateData): string => {
    const time = data.appointmentTime || '';
    return `สวัสดีค่ะ คุณ${data.customerName}\nเตือนนัดหมาย: ${data.treatmentName}\nวันที่: ${data.appointmentDate} ${time}\n${data.clinicName}\nโทร 02-xxx-xxxx`;
  },

  /**
   * Appointment Confirmation
   */
  appointmentConfirm: (data: SMSTemplateData): string => {
    return `ยืนยันนัดหมายสำเร็จ\nคุณ${data.customerName}\n${data.treatmentName}\n${data.appointmentDate} ${data.appointmentTime}\n${data.clinicName}`;
  },

  /**
   * Post-treatment follow-up
   */
  postTreatment: (data: SMSTemplateData): string => {
    return `สวัสดีค่ะ คุณ${data.customerName}\nหวังว่าจะพอใจกับบริการ ${data.treatmentName}\nหากมีคำถาม โทร 02-xxx-xxxx\n${data.clinicName}`;
  },

  /**
   * Payment reminder
   */
  paymentReminder: (data: SMSTemplateData): string => {
    return `เรียน คุณ${data.customerName}\nเตือนชำระค่าบริการ ${data.amount} บาท\nโปรดชำระภายใน 3 วัน\n${data.clinicName}`;
  },

  /**
   * Proposal sent notification
   */
  proposalSent: (data: SMSTemplateData): string => {
    return `สวัสดีค่ะ คุณ${data.customerName}\nข้อเสนอการรักษาพร้อมแล้ว\nดูที่: ${data.link}\n${data.clinicName}`;
  },

  /**
   * Scan results ready
   */
  scanReady: (data: SMSTemplateData): string => {
    return `คุณ${data.customerName}\nผลการสแกนผิวพร้อมแล้ว\nดูผลที่: ${data.link}\n${data.clinicName}`;
  },

  /**
   * Special promotion
   */
  promotion: (data: SMSTemplateData): string => {
    return `พิเศษ! ${data.treatmentName}\nเฉพาะคุณ${data.customerName}\nโทรจองเลย 02-xxx-xxxx\n${data.clinicName}`;
  },

  /**
   * Birthday greeting
   */
  birthday: (data: SMSTemplateData): string => {
    return `🎂 สุขสันต์วันเกิดค่ะ คุณ${data.customerName}\nรับส่วนลด 20% ทุกคอร์ส\n${data.clinicName}`;
  },

  /**
   * OTP verification
   */
  otp: (data: { otp: string; clinicName: string }): string => {
    return `รหัส OTP: ${data.otp}\nใช้สำหรับยืนยันตัวตน\nห้ามแชร์รหัสนี้\n${data.clinicName}`;
  },

  /**
   * Generic notification
   */
  notification: (data: { customerName: string; message: string; clinicName: string }): string => {
    return `คุณ${data.customerName}\n${data.message}\n${data.clinicName}`;
  }
};

/**
 * Format SMS with length check
 */
export function formatSMS(message: string, maxLength: number = 70): string {
  if (message.length <= maxLength) {
    return message;
  }

  // Truncate and add ellipsis
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Count SMS segments (Thai characters count as 2)
 */
export function countSMSSegments(message: string): number {
  // Rough estimate: Thai chars ~70 per segment, English ~160
  const thaiCharCount = (message.match(/[\u0E00-\u0E7F]/g) || []).length;
  const otherCharCount = message.length - thaiCharCount;
  
  const estimatedLength = (thaiCharCount * 2) + otherCharCount;
  
  if (estimatedLength <= 160) return 1;
  if (estimatedLength <= 306) return 2; // 153 chars per segment for multipart
  if (estimatedLength <= 459) return 3;
  
  return Math.ceil(estimatedLength / 153);
}

/**
 * Validate SMS message
 */
export function validateSMS(message: string): { valid: boolean; error?: string; segments: number } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message is empty', segments: 0 };
  }

  const segments = countSMSSegments(message);

  if (segments > 3) {
    return { 
      valid: false, 
      error: 'Message too long (max 3 segments)', 
      segments 
    };
  }

  return { valid: true, segments };
}
