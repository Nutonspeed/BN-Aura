/**
 * BN-Aura Unified LINE Service
 * Consolidates all LINE functionality into one service
 * 
 * Replaces:
 * - lib/integrations/line.ts
 * - lib/line/lineService.ts
 * - lib/notifications/lineNotify.ts
 */

// Types
export interface LineConfig {
  channelAccessToken?: string;
  channelSecret?: string;
  notifyToken?: string;
}

export interface LineMessage {
  type: 'text' | 'flex' | 'image' | 'template';
  text?: string;
  altText?: string;
  contents?: unknown;
  template?: unknown;
}

export interface LineResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface LineUser {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
}

// Message templates for BN-Aura
export const lineTemplates = {
  analysisComplete: (data: { customerName: string; score: number; reportUrl: string }) => ({
    type: 'flex' as const,
    altText: `ผลวิเคราะห์ผิวของคุณ${data.customerName}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '🧠 AI Skin Analysis', weight: 'bold', size: 'lg', color: '#8B5CF6' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `สวัสดีคุณ${data.customerName}`, size: 'md' },
          { type: 'text', text: `คะแนนผิวของคุณ: ${data.score}/100`, size: 'xl', weight: 'bold', margin: 'md' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'button', action: { type: 'uri', label: 'ดูรายงาน', uri: data.reportUrl }, style: 'primary', color: '#8B5CF6' },
        ],
      },
    },
  }),

  bookingReminder: (data: { customerName: string; treatmentName: string; date: string; time: string }) => ({
    type: 'flex' as const,
    altText: `แจ้งเตือนนัดหมาย ${data.treatmentName}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '📅 แจ้งเตือนนัดหมาย', weight: 'bold', size: 'lg', color: '#3B82F6' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `สวัสดีคุณ${data.customerName}`, size: 'md' },
          { type: 'text', text: data.treatmentName, size: 'lg', weight: 'bold', margin: 'md' },
          { type: 'text', text: `${data.date} เวลา ${data.time}`, size: 'md', color: '#666', margin: 'sm' },
        ],
      },
    },
  }),

  quotaWarning: (data: { clinicName: string; remaining: number; limit: number }) => ({
    type: 'text' as const,
    text: `⚠️ แจ้งเตือน: โควต้าของ ${data.clinicName} เหลือ ${data.remaining}/${data.limit} กรุณาเติมโควต้าหรืออัพเกรดแพ็กเกจ`,
  }),
};

class UnifiedLineService {
  private config: LineConfig;
  private readonly LINE_API = 'https://api.line.me/v2/bot';
  private readonly NOTIFY_API = 'https://notify-api.line.me/api/notify';

  constructor(config?: Partial<LineConfig>) {
    this.config = {
      channelAccessToken: config?.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: config?.channelSecret || process.env.LINE_CHANNEL_SECRET,
      notifyToken: config?.notifyToken || process.env.LINE_NOTIFY_TOKEN,
    };
  }

  // Send push message to user
  async pushMessage(userId: string, messages: LineMessage[]): Promise<LineResult> {
    if (!this.config.channelAccessToken) {
      console.log('[LINE] No token, skipping:', { userId, messages: messages.length });
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    try {
      const response = await fetch(`${this.LINE_API}/message/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: userId, messages }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // Send via LINE Notify (simpler, for alerts)
  async notify(message: string, imageUrl?: string): Promise<LineResult> {
    if (!this.config.notifyToken) {
      console.log('[LINE Notify]', message);
      return { success: true };
    }

    try {
      const params = new URLSearchParams({ message });
      if (imageUrl) {
        params.append('imageThumbnail', imageUrl);
        params.append('imageFullsize', imageUrl);
      }

      const response = await fetch(this.NOTIFY_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.notifyToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      return { success: response.ok };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // Get user profile
  async getProfile(userId: string): Promise<LineUser | null> {
    if (!this.config.channelAccessToken) return null;

    try {
      const response = await fetch(`${this.LINE_API}/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${this.config.channelAccessToken}` },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  // === Convenience methods ===

  async sendAnalysisComplete(userId: string, data: Parameters<typeof lineTemplates.analysisComplete>[0]): Promise<LineResult> {
    return this.pushMessage(userId, [lineTemplates.analysisComplete(data)]);
  }

  async sendBookingReminder(userId: string, data: Parameters<typeof lineTemplates.bookingReminder>[0]): Promise<LineResult> {
    return this.pushMessage(userId, [lineTemplates.bookingReminder(data)]);
  }

  async sendQuotaWarning(data: Parameters<typeof lineTemplates.quotaWarning>[0]): Promise<LineResult> {
    return this.notify(lineTemplates.quotaWarning(data).text);
  }
}

// Singleton
let lineServiceInstance: UnifiedLineService | null = null;

export function getLineService(config?: Partial<LineConfig>): UnifiedLineService {
  if (!lineServiceInstance) {
    lineServiceInstance = new UnifiedLineService(config);
  }
  return lineServiceInstance;
}

export { UnifiedLineService };
export default getLineService;
