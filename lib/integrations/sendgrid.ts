import { createAdminClient } from '@/lib/supabase/admin';

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  clinicId: string;
  campaignId?: string;
  customerId?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendGridService {
  private config: SendGridConfig | null = null;
  private clinicId: string;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  async initialize(): Promise<boolean> {
    try {
      const adminClient = createAdminClient();
      const { data: integration } = await adminClient
        .from('social_integrations')
        .select('settings')
        .eq('clinic_id', this.clinicId)
        .eq('platform', 'sendgrid')
        .eq('is_active', true)
        .single();

      if (integration?.settings) {
        this.config = integration.settings as SendGridConfig;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    if (!this.config) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'SendGrid not configured' };
      }
    }

    try {
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: recipients.map(email => ({ email })) }],
          from: { email: this.config!.fromEmail, name: this.config!.fromName },
          subject: params.subject,
          content: [
            { type: 'text/plain', value: params.text || params.html.replace(/<[^>]*>/g, '') },
            { type: 'text/html', value: params.html },
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        const messageId = response.headers.get('X-Message-Id') || `sg-${Date.now()}`;

        // Update campaign recipients if campaign
        if (params.campaignId) {
          const adminClient = createAdminClient();
          for (const email of recipients) {
            await adminClient
              .from('email_campaign_recipients')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('campaign_id', params.campaignId)
              .eq('email', email);
          }
        }

        return { success: true, messageId };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.errors?.[0]?.message || 'Failed to send email',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    const adminClient = createAdminClient();
    
    // Get campaign
    const { data: campaign } = await adminClient
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) return { sent: 0, failed: 0 };

    // Get recipients
    const { data: recipients } = await adminClient
      .from('email_campaign_recipients')
      .select('email, customer_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (!recipients?.length) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    // Send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const emails = batch.map(r => r.email);

      const result = await this.sendEmail({
        to: emails,
        subject: campaign.subject,
        html: campaign.content_html,
        text: campaign.content_text,
        clinicId: this.clinicId,
        campaignId,
      });

      if (result.success) {
        sent += batch.length;
      } else {
        failed += batch.length;
      }
    }

    // Update campaign status
    await adminClient
      .from('email_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    return { sent, failed };
  }
}

export async function createSendGridService(clinicId: string): Promise<SendGridService> {
  const service = new SendGridService(clinicId);
  await service.initialize();
  return service;
}
