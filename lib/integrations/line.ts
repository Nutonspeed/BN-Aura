import { createAdminClient } from '@/lib/supabase/admin';

interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

interface SendLineMessageParams {
  userId: string;
  message: string | LineMessage;
  clinicId: string;
}

interface LineMessage {
  type: 'text' | 'image' | 'template' | 'flex';
  text?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
  template?: unknown;
  contents?: unknown;
}

interface LineResult {
  success: boolean;
  error?: string;
}

export class LineService {
  private config: LineConfig | null = null;
  private clinicId: string;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  async initialize(): Promise<boolean> {
    try {
      const adminClient = createAdminClient();
      const { data: integration } = await adminClient
        .from('social_integrations')
        .select('access_token, settings')
        .eq('clinic_id', this.clinicId)
        .eq('platform', 'line')
        .eq('is_active', true)
        .single();

      if (integration?.access_token) {
        this.config = {
          channelAccessToken: integration.access_token,
          channelSecret: (integration.settings as { channelSecret?: string })?.channelSecret || '',
        };
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async pushMessage(params: SendLineMessageParams): Promise<LineResult> {
    if (!this.config) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'LINE not configured' };
      }
    }

    try {
      const message = typeof params.message === 'string' 
        ? { type: 'text', text: params.message }
        : params.message;

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.userId,
          messages: [message],
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to send LINE message',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async replyMessage(replyToken: string, message: string | LineMessage): Promise<LineResult> {
    if (!this.config) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'LINE not configured' };
      }
    }

    try {
      const msg = typeof message === 'string' 
        ? { type: 'text', text: message }
        : message;

      const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyToken,
          messages: [msg],
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to reply LINE message',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getProfile(userId: string): Promise<{ displayName: string; pictureUrl?: string } | null> {
    if (!this.config) await this.initialize();
    if (!this.config) return null;

    try {
      const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${this.config.channelAccessToken}` },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  async broadcastMessage(message: string | LineMessage): Promise<LineResult> {
    if (!this.config) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'LINE not configured' };
      }
    }

    try {
      const msg = typeof message === 'string' 
        ? { type: 'text', text: message }
        : message;

      const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [msg] }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to broadcast',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  verifySignature(body: string, signature: string): boolean {
    if (!this.config?.channelSecret) return false;

    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', this.config.channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  }
}

export async function createLineService(clinicId: string): Promise<LineService> {
  const service = new LineService(clinicId);
  await service.initialize();
  return service;
}
