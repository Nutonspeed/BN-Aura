// LINE Messaging API Integration for Thailand
// Official LINE Developers: https://developers.line.biz/

export interface SendLineMessageOptions {
  to: string; // LINE User ID or Group ID
  message: string;
  imageUrl?: string;
  quickReply?: Array<{
    label: string;
    text: string;
  }>;
  template?: 'buttons' | 'confirm' | 'carousel';
  templateData?: any;
}

export interface LineResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface LineUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LINE Messaging API Service
 * 
 * Setup Instructions:
 * 1. Create LINE Official Account at https://manager.line.biz/
 * 2. Create Messaging API Channel at https://developers.line.biz/console/
 * 3. Get Channel Access Token
 * 4. Set webhook URL for receiving messages
 * 5. Enable "Use webhooks" in Messaging API settings
 */
class LineMessagingService {
  private channelAccessToken: string | undefined;
  private channelSecret: string | undefined;
  private isDevelopment: boolean;

  constructor() {
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    this.channelSecret = process.env.LINE_CHANNEL_SECRET;
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    if (this.isConfigured()) {
      console.log('✅ LINE Messaging API initialized');
    } else if (!this.isDevelopment) {
      console.warn('⚠️ LINE not configured. Messages will be mocked.');
    }
  }

  /**
   * Send text message to LINE user
   */
  async sendMessage(options: SendLineMessageOptions): Promise<LineResponse> {
    // Development mode: Mock LINE message
    if (this.isDevelopment && !this.isConfigured()) {
      console.log('💬 [MOCK LINE MESSAGE - Development Mode]');
      console.log('═'.repeat(50));
      console.log('To:', options.to);
      console.log('Message:', options.message);
      if (options.imageUrl) console.log('Image:', options.imageUrl);
      if (options.quickReply) console.log('Quick Reply:', options.quickReply);
      console.log('═'.repeat(50));
      
      return {
        success: true,
        messageId: `mock-line-${Date.now()}`
      };
    }

    // Production mode: Send via LINE API
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'LINE not configured. Please set LINE_CHANNEL_ACCESS_TOKEN'
      };
    }

    try {
      const messages = this.buildMessages(options);

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          messages: messages
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ LINE API Error:', error);
        return {
          success: false,
          error: error.message || 'LINE message failed'
        };
      }

      console.log('✅ LINE message sent to', options.to);
      return {
        success: true,
        messageId: response.headers.get('x-line-request-id') || undefined
      };

    } catch (error) {
      console.error('❌ LINE sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown LINE error'
      };
    }
  }

  /**
   * Send broadcast message to all followers
   */
  async sendBroadcast(message: string, imageUrl?: string): Promise<LineResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'LINE not configured'
      };
    }

    try {
      const messages: any[] = [{ type: 'text', text: message }];
      if (imageUrl) {
        messages.push({
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl
        });
      }

      const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Broadcast failed'
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get LINE user profile
   */
  async getUserProfile(userId: string): Promise<LineUser | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        userId: data.userId,
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
        statusMessage: data.statusMessage
      };

    } catch (error) {
      console.error('Failed to get LINE profile:', error);
      return null;
    }
  }

  /**
   * Get number of followers
   */
  async getFollowerCount(): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const response = await fetch('https://api.line.me/v2/bot/followers/ids', {
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
        },
      });

      if (!response.ok) return 0;

      const data = await response.json();
      return data.userIds?.length || 0;

    } catch (error) {
      console.error('Failed to get follower count:', error);
      return 0;
    }
  }

  /**
   * Build LINE message objects from options
   */
  private buildMessages(options: SendLineMessageOptions): any[] {
    const messages: any[] = [];

    // Text message
    messages.push({
      type: 'text',
      text: options.message,
      ...(options.quickReply && {
        quickReply: {
          items: options.quickReply.map(item => ({
            type: 'action',
            action: {
              type: 'message',
              label: item.label,
              text: item.text
            }
          }))
        }
      })
    });

    // Image message
    if (options.imageUrl) {
      messages.push({
        type: 'image',
        originalContentUrl: options.imageUrl,
        previewImageUrl: options.imageUrl
      });
    }

    // Template message
    if (options.template && options.templateData) {
      messages.push(this.buildTemplate(options.template, options.templateData));
    }

    return messages;
  }

  /**
   * Build LINE template message
   */
  private buildTemplate(type: string, data: any): any {
    switch (type) {
      case 'buttons':
        return {
          type: 'template',
          altText: data.altText || 'Template message',
          template: {
            type: 'buttons',
            text: data.text,
            actions: data.actions || []
          }
        };

      case 'confirm':
        return {
          type: 'template',
          altText: data.altText || 'Confirmation',
          template: {
            type: 'confirm',
            text: data.text,
            actions: data.actions || []
          }
        };

      case 'carousel':
        return {
          type: 'template',
          altText: data.altText || 'Carousel',
          template: {
            type: 'carousel',
            columns: data.columns || []
          }
        };

      default:
        return { type: 'text', text: 'Template not supported' };
    }
  }

  /**
   * Verify LINE webhook signature
   */
  verifySignature(body: string, signature: string): boolean {
    if (!this.channelSecret) return false;

    const crypto = require('crypto');
    const hash = crypto
      .createHmac('SHA256', this.channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  }

  /**
   * Check if LINE is configured
   */
  isConfigured(): boolean {
    return !!(this.channelAccessToken && this.channelSecret);
  }

  /**
   * Get configuration status
   */
  getStatus(): { configured: boolean; mode: string } {
    return {
      configured: this.isConfigured(),
      mode: this.isDevelopment ? 'development' : 'production'
    };
  }
}

// Export singleton instance
export const lineService = new LineMessagingService();

// Helper function for quick message sending
export async function sendLineMessage(
  to: string,
  message: string,
  options?: Partial<SendLineMessageOptions>
): Promise<LineResponse> {
  return lineService.sendMessage({
    to,
    message,
    ...options
  });
}

// LINE Rich Menu Builder (Advanced Feature)
export class LineRichMenuBuilder {
  /**
   * Create rich menu for LINE Official Account
   * Rich menus provide quick access buttons at bottom of chat
   * 
   * Example usage:
   * - Book appointment
   * - View treatment history
   * - Check promotions
   * - Contact clinic
   */
  async createRichMenu(menuConfig: any): Promise<string | null> {
    // Rich menu creation - requires menu configuration and image assets
    // See LINE Developers documentation for setup
    return null;
  }
}
