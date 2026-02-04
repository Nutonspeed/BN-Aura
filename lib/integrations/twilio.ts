import { createAdminClient } from '@/lib/supabase/admin';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface SendSMSParams {
  to: string;
  body: string;
  clinicId: string;
  conversationId?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export class TwilioService {
  private config: TwilioConfig | null = null;
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
        .eq('platform', 'twilio')
        .eq('is_active', true)
        .single();

      if (integration?.settings) {
        this.config = integration.settings as TwilioConfig;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async sendSMS(params: SendSMSParams): Promise<SMSResult> {
    if (!this.config) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Twilio not configured' };
      }
    }

    try {
      const auth = Buffer.from(`${this.config!.accountSid}:${this.config!.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config!.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: params.to,
            From: this.config!.phoneNumber,
            Body: params.body,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Log message to database
        const adminClient = createAdminClient();
        await adminClient.from('sms_messages').insert({
          conversation_id: params.conversationId,
          clinic_id: this.clinicId,
          direction: 'outbound',
          content: params.body,
          status: 'sent',
          provider_message_id: data.sid,
          sent_at: new Date().toISOString(),
          cost: parseFloat(data.price || '0'),
        });

        return {
          success: true,
          messageId: data.sid,
          cost: parseFloat(data.price || '0'),
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMessages(phoneNumber: string): Promise<unknown[]> {
    if (!this.config) await this.initialize();
    if (!this.config) return [];

    try {
      const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json?To=${encodeURIComponent(phoneNumber)}`,
        {
          headers: { 'Authorization': `Basic ${auth}` },
        }
      );

      const data = await response.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }
}

export async function createTwilioService(clinicId: string): Promise<TwilioService> {
  const service = new TwilioService(clinicId);
  await service.initialize();
  return service;
}
