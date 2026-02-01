// Comprehensive Resend Email Service

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class ResendEmailService {
  private apiKey: string | undefined;
  private defaultFrom: string;
  private isDevelopment: boolean;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.defaultFrom = process.env.EMAIL_FROM || 'BN-Aura <noreply@bn-aura.com>';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Send email via Resend API
   */
  async send(options: SendEmailOptions): Promise<EmailResponse> {
    // Development mode: Log instead of sending
    if (this.isDevelopment && !this.apiKey) {
      console.log('📧 [MOCK EMAIL - Development Mode]');
      console.log('═'.repeat(50));
      console.log('From:', options.from || this.defaultFrom);
      console.log('To:', Array.isArray(options.to) ? options.to.join(', ') : options.to);
      console.log('Subject:', options.subject);
      if (options.cc) console.log('CC:', Array.isArray(options.cc) ? options.cc.join(', ') : options.cc);
      if (options.bcc) console.log('BCC:', Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc);
      console.log('HTML Length:', options.html.length, 'chars');
      console.log('═'.repeat(50));
      
      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    }

    // Production mode: Send via Resend
    if (!this.apiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.'
      };
    }

    try {
      const payload = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.replyTo && { reply_to: options.replyTo }),
        ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc : [options.cc] }),
        ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc] }),
        ...(options.attachments && { attachments: options.attachments }),
        ...(options.tags && { tags: options.tags })
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Resend API Error:', data);
        return {
          success: false,
          error: data.message || `Email failed: ${response.statusText}`
        };
      }

      console.log('✅ Email sent successfully:', data.id);
      return {
        success: true,
        messageId: data.id
      };

    } catch (error) {
      console.error('❌ Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Send bulk emails (batch processing)
   */
  async sendBulk(emails: SendEmailOptions[]): Promise<EmailResponse[]> {
    const results = await Promise.allSettled(
      emails.map(email => this.send(email))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ Bulk email ${index + 1} failed:`, result.reason);
        return {
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey || this.isDevelopment;
  }
}

// Export singleton instance
export const resendService = new ResendEmailService();

// Helper function for quick email sending
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<EmailResponse> {
  return resendService.send({ to, subject, html });
}

// Helper function for sending with template
export async function sendTemplateEmail(
  to: string | string[],
  subject: string,
  templateHtml: string,
  options?: Partial<SendEmailOptions>
): Promise<EmailResponse> {
  return resendService.send({
    to,
    subject,
    html: templateHtml,
    ...options
  });
}
