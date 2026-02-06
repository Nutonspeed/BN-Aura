/**
 * BN-Aura Unified Email Service
 * Consolidates all email functionality into one service
 * 
 * Replaces:
 * - lib/email/emailService.ts (invitations)
 * - lib/notifications/emailService.ts (notifications)
 * - lib/email/resendService.ts (API)
 */

import { emailTemplates, renderTemplate } from './emailTemplates';

// Types
export interface EmailConfig {
  from: string;
  replyTo?: string;
  apiKey?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: string; contentType: string }[];
  tags?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Template types
export type EmailTemplateId = 
  | 'welcome' 
  | 'analysis-report' 
  | 'booking-confirmation' 
  | 'quota-warning' 
  | 'monthly-report'
  | 'invitation'
  | 'appointment-reminder'
  | 'treatment-summary';

class UnifiedEmailService {
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      from: config?.from || process.env.EMAIL_FROM || 'BN-Aura <noreply@bn-aura.com>',
      replyTo: config?.replyTo || process.env.EMAIL_REPLY_TO,
      apiKey: config?.apiKey || process.env.RESEND_API_KEY,
    };
  }

  // Core send method
  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      if (this.config.apiKey) {
        return await this.sendViaResend(options);
      }
      
      // Development fallback
      console.log('📧 [DEV EMAIL]', { to: options.to, subject: options.subject });
      return { success: true, messageId: `dev-${Date.now()}` };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // Send using template
  async sendTemplate(
    templateId: EmailTemplateId,
    to: string,
    variables: Record<string, string>
  ): Promise<EmailResult> {
    const rendered = renderTemplate(templateId, variables);
    if (!rendered) {
      return { success: false, error: `Template ${templateId} not found` };
    }

    return this.send({ to, subject: rendered.subject, html: rendered.html });
  }

  // === Specific Email Methods ===

  // Staff invitation
  async sendInvitation(data: {
    email: string;
    clinicName: string;
    inviterName: string;
    role: string;
    invitationUrl: string;
    expiresAt: string;
  }): Promise<EmailResult> {
    const html = `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">BN-Aura</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #333;">เชิญเข้าร่วมทีม ${data.clinicName}</h2>
          <p>คุณได้รับเชิญให้เข้าร่วมทีมในฐานะ <strong>${data.role}</strong></p>
          <p>จาก: ${data.inviterName}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.invitationUrl}" style="background: #8B5CF6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              ยืนยันการเข้าร่วม
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">ลิงก์จะหมดอายุ: ${new Date(data.expiresAt).toLocaleDateString('th-TH')}</p>
        </div>
      </div>`;

    return this.send({
      to: data.email,
      subject: `เชิญเข้าร่วมทีม ${data.clinicName} - BN-Aura`,
      html,
    });
  }

  // Analysis report
  async sendAnalysisReport(data: {
    customerEmail: string;
    customerName: string;
    overallScore: number;
    skinAge: number;
    reportUrl: string;
    clinicName: string;
  }): Promise<EmailResult> {
    return this.sendTemplate('analysis-report', data.customerEmail, {
      name: data.customerName,
      overallScore: data.overallScore.toString(),
      skinAge: data.skinAge.toString(),
      reportUrl: data.reportUrl,
      clinicName: data.clinicName,
    });
  }

  // Booking confirmation
  async sendBookingConfirmation(data: {
    customerEmail: string;
    customerName: string;
    treatmentName: string;
    date: string;
    time: string;
    clinicName: string;
    clinicAddress: string;
    calendarUrl: string;
  }): Promise<EmailResult> {
    return this.sendTemplate('booking-confirmation', data.customerEmail, {
      name: data.customerName,
      treatmentName: data.treatmentName,
      date: data.date,
      time: data.time,
      clinicName: data.clinicName,
      clinicAddress: data.clinicAddress,
      calendarUrl: data.calendarUrl,
    });
  }

  // Quota warning
  async sendQuotaWarning(data: {
    email: string;
    clinicName: string;
    remaining: number;
    limit: number;
    upgradeUrl: string;
  }): Promise<EmailResult> {
    const percentage = Math.round((data.remaining / data.limit) * 100);
    return this.sendTemplate('quota-warning', data.email, {
      clinicName: data.clinicName,
      remaining: data.remaining.toString(),
      limit: data.limit.toString(),
      percentage: percentage.toString(),
      upgradeUrl: data.upgradeUrl,
    });
  }

  // Private: Send via Resend API
  private async sendViaResend(options: SendEmailOptions): Promise<EmailResult> {
    const to = Array.isArray(options.to) ? options.to : [options.to];
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: this.config.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  }
}

// Singleton instance
let emailServiceInstance: UnifiedEmailService | null = null;

export function getEmailService(config?: Partial<EmailConfig>): UnifiedEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new UnifiedEmailService(config);
  }
  return emailServiceInstance;
}

export { UnifiedEmailService };
export default getEmailService;
