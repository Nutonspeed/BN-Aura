/**
 * Email Service for BN-Aura
 * Send skin analysis reports and notifications via email
 */

interface EmailConfig {
  from: string;
  replyTo?: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      from: config?.from || process.env.EMAIL_FROM || 'noreply@bn-aura.com',
      replyTo: config?.replyTo || process.env.EMAIL_REPLY_TO,
    };
  }

  /**
   * Send email using Resend or fallback
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // Try Resend first
      if (process.env.RESEND_API_KEY) {
        return await this.sendViaResend(options);
      }

      // Fallback to console log in development
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send via Resend API
   */
  private async sendViaResend(options: SendEmailOptions): Promise<EmailResult> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.from,
        to: options.to,
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

  /**
   * Send skin analysis report email
   */
  async sendAnalysisReport(data: {
    customerEmail: string;
    customerName: string;
    reportHtml: string;
    clinicName: string;
  }): Promise<EmailResult> {
    const subject = `🧠 ผลวิเคราะห์ผิว AI - ${data.clinicName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 BN-Aura AI Skin Analysis</h1>
      <p>ผลวิเคราะห์ผิวหน้าด้วยเทคโนโลยี AI</p>
    </div>
    <div class="content">
      <p>สวัสดีคุณ${data.customerName},</p>
      <p>ขอบคุณที่ใช้บริการวิเคราะห์ผิวด้วย AI ที่ ${data.clinicName}</p>
      <p>รายงานผลวิเคราะห์ของคุณแนบมาด้านล่างนี้:</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      ${data.reportHtml}
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="text-align: center;">
        <a href="#" class="btn">จองนัดหมาย Treatment</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 BN-Aura - Advanced Skin Analysis Platform</p>
      <p>อีเมลนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(data: {
    customerEmail: string;
    customerName: string;
    appointmentDate: string;
    appointmentTime: string;
    treatmentName: string;
    clinicName: string;
    clinicAddress: string;
  }): Promise<EmailResult> {
    const subject = `📅 แจ้งเตือนนัดหมาย - ${data.clinicName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .appointment-card { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 แจ้งเตือนนัดหมาย</h1>
    </div>
    <div class="content">
      <p>สวัสดีคุณ${data.customerName},</p>
      <p>นี่คือการแจ้งเตือนนัดหมายของคุณ:</p>
      
      <div class="appointment-card">
        <p><strong>🏥 คลินิก:</strong> ${data.clinicName}</p>
        <p><strong>💆 Treatment:</strong> ${data.treatmentName}</p>
        <p><strong>📆 วันที่:</strong> ${data.appointmentDate}</p>
        <p><strong>⏰ เวลา:</strong> ${data.appointmentTime}</p>
        <p><strong>📍 ที่อยู่:</strong> ${data.clinicAddress}</p>
      </div>
      
      <p>⚠️ กรุณามาถึงก่อนเวลานัด 15 นาที</p>
    </div>
    <div class="footer">
      <p>© 2026 BN-Aura</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Send treatment completion summary
   */
  async sendTreatmentSummary(data: {
    customerEmail: string;
    customerName: string;
    treatmentName: string;
    completedDate: string;
    aftercareTips: string[];
    nextAppointment?: string;
    clinicName: string;
  }): Promise<EmailResult> {
    const subject = `✅ สรุป Treatment - ${data.clinicName}`;

    const aftercareHtml = data.aftercareTips
      .map(tip => `<li>${tip}</li>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: #22c55e; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .tips-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Treatment เสร็จสิ้น</h1>
    </div>
    <div class="content">
      <p>สวัสดีคุณ${data.customerName},</p>
      <p>ขอบคุณที่ใช้บริการ ${data.treatmentName} ที่ ${data.clinicName}</p>
      <p>วันที่ทำ: ${data.completedDate}</p>
      
      <div class="tips-card">
        <h3>🏠 การดูแลหลังทำ Treatment:</h3>
        <ul>${aftercareHtml}</ul>
      </div>
      
      ${data.nextAppointment ? `<p><strong>📅 นัดครั้งถัดไป:</strong> ${data.nextAppointment}</p>` : ''}
      
      <p>หากมีข้อสงสัย กรุณาติดต่อคลินิก</p>
    </div>
    <div class="footer">
      <p>ขอบคุณที่ใช้บริการ 💜</p>
      <p>© 2026 BN-Aura</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      html,
    });
  }
}

// Factory function
function createEmailService(config?: Partial<EmailConfig>): EmailService {
  return new EmailService(config);
}

export { EmailService, createEmailService };
export type { EmailConfig, SendEmailOptions, EmailResult };
