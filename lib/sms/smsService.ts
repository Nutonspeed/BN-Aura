// SMS Service for Thailand SMS Gateways
// Supports multiple Thai SMS providers

export interface SendSMSOptions {
  to: string | string[]; // Thai phone numbers (08x-xxx-xxxx or 66x-xxx-xxxx)
  message: string;
  sender?: string; // Sender name (max 11 chars for Thai gateways)
  scheduledAt?: Date;
  priority?: 'normal' | 'high';
  tags?: Record<string, string>;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  creditsUsed?: number;
  error?: string;
  failedNumbers?: string[];
}

export interface SMSProvider {
  name: string;
  send(options: SendSMSOptions): Promise<SMSResponse>;
  getBalance(): Promise<number>;
  isConfigured(): boolean;
}

/**
 * Thai SMS Gateways Supported:
 * 1. ThaiSMSPlus (https://thaismsplus.com)
 * 2. SMS.to (https://sms.to)
 * 3. Twilio (https://twilio.com)
 */

// ===================================================================
// 1. ThaiSMSPlus Provider
// ===================================================================
class ThaiSMSPlusProvider implements SMSProvider {
  name = 'ThaiSMSPlus';
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private sender: string;

  constructor() {
    this.apiKey = process.env.THAI_SMS_PLUS_API_KEY;
    this.apiSecret = process.env.THAI_SMS_PLUS_SECRET;
    this.sender = process.env.SMS_SENDER_NAME || 'BN-Aura';
  }

  async send(options: SendSMSOptions): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ThaiSMSPlus not configured. Please set THAI_SMS_PLUS_API_KEY and THAI_SMS_PLUS_SECRET'
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const normalizedNumbers = recipients.map(num => this.normalizePhoneNumber(num));

      const response = await fetch('https://api.thaismsplus.com/v1/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_secret: this.apiSecret,
          sender: options.sender || this.sender,
          to: normalizedNumbers,
          message: options.message,
          scheduled_at: options.scheduledAt?.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'SMS send failed'
        };
      }

      return {
        success: true,
        messageId: data.message_id,
        creditsUsed: data.credits_used || normalizedNumbers.length
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error'
      };
    }
  }

  async getBalance(): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const response = await fetch('https://api.thaismsplus.com/v1/account/balance', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      return data.balance || 0;

    } catch (error) {
      console.error('Failed to get SMS balance:', error);
      return 0;
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove spaces, dashes, parentheses
    let normalized = phone.replace(/[\s\-()]/g, '');
    
    // Convert 08x to 668x format
    if (normalized.startsWith('0')) {
      normalized = '66' + normalized.substring(1);
    }
    
    // Ensure it starts with 66
    if (!normalized.startsWith('66')) {
      normalized = '66' + normalized;
    }

    return normalized;
  }
}

// ===================================================================
// 2. SMS.to Provider (Global with Thai support)
// ===================================================================
class SMStoProvider implements SMSProvider {
  name = 'SMS.to';
  private apiKey: string | undefined;
  private sender: string;

  constructor() {
    this.apiKey = process.env.SMSTO_API_KEY;
    this.sender = process.env.SMS_SENDER_NAME || 'BN-Aura';
  }

  async send(options: SendSMSOptions): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SMS.to not configured. Please set SMSTO_API_KEY'
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const results = await Promise.all(
        recipients.map(to => this.sendSingle(to, options))
      );

      const failed = results.filter(r => !r.success);
      
      return {
        success: failed.length === 0,
        messageId: results.map(r => r.messageId).join(','),
        creditsUsed: results.reduce((sum, r) => sum + (r.creditsUsed || 0), 0),
        failedNumbers: failed.map(r => r.error || 'unknown'),
        error: failed.length > 0 ? `${failed.length} messages failed` : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error'
      };
    }
  }

  private async sendSingle(to: string, options: SendSMSOptions): Promise<SMSResponse> {
    try {
      const response = await fetch('https://api.sms.to/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.normalizePhoneNumber(to),
          message: options.message,
          sender_id: options.sender || this.sender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'SMS send failed'
        };
      }

      return {
        success: true,
        messageId: data.message_id,
        creditsUsed: 1
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send'
      };
    }
  }

  async getBalance(): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const response = await fetch('https://api.sms.to/balance', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      return data.balance || 0;

    } catch (error) {
      console.error('Failed to get SMS balance:', error);
      return 0;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/[\s\-()]/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = '+66' + normalized.substring(1);
    } else if (normalized.startsWith('66')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+66' + normalized;
    }

    return normalized;
  }
}

// ===================================================================
// 3. Twilio Provider (Global with Thai support)
// ===================================================================
class TwilioProvider implements SMSProvider {
  name = 'Twilio';
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private fromNumber: string | undefined;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async send(options: SendSMSOptions): Promise<SMSResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER'
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const results = await Promise.all(
        recipients.map(to => this.sendSingle(to, options))
      );

      const failed = results.filter(r => !r.success);
      
      return {
        success: failed.length === 0,
        messageId: results.map(r => r.messageId).join(','),
        creditsUsed: results.length,
        failedNumbers: failed.map(r => r.error || 'unknown'),
        error: failed.length > 0 ? `${failed.length} messages failed` : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error'
      };
    }
  }

  private async sendSingle(to: string, options: SendSMSOptions): Promise<SMSResponse> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const body = new URLSearchParams({
        To: this.normalizePhoneNumber(to),
        From: this.fromNumber!,
        Body: options.message,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'SMS send failed'
        };
      }

      return {
        success: true,
        messageId: data.sid,
        creditsUsed: 1
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send'
      };
    }
  }

  async getBalance(): Promise<number> {
    // Twilio uses account balance, requires separate API call
    return 0; // Not implemented for simplicity
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }

  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/[\s\-()]/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = '+66' + normalized.substring(1);
    } else if (normalized.startsWith('66')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+66' + normalized;
    }

    return normalized;
  }
}

// ===================================================================
// SMS Service Manager
// ===================================================================
class SMSService {
  private providers: SMSProvider[];
  private activeProvider: SMSProvider | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Initialize all providers
    this.providers = [
      new ThaiSMSPlusProvider(),
      new SMStoProvider(),
      new TwilioProvider(),
    ];

    // Select first configured provider
    this.activeProvider = this.providers.find(p => p.isConfigured()) || null;

    if (this.activeProvider) {
      console.log(`✅ SMS Service initialized with ${this.activeProvider.name}`);
    } else if (!this.isDevelopment) {
      console.warn('⚠️ No SMS provider configured. SMS will be mocked.');
    }
  }

  /**
   * Send SMS (auto-selects configured provider)
   */
  async send(options: SendSMSOptions): Promise<SMSResponse> {
    // Development mode: Mock SMS
    if (this.isDevelopment && !this.activeProvider) {
      console.log('📱 [MOCK SMS - Development Mode]');
      console.log('═'.repeat(50));
      console.log('To:', Array.isArray(options.to) ? options.to.join(', ') : options.to);
      console.log('Message:', options.message);
      console.log('Sender:', options.sender || 'BN-Aura');
      console.log('═'.repeat(50));
      
      return {
        success: true,
        messageId: `mock-sms-${Date.now()}`,
        creditsUsed: Array.isArray(options.to) ? options.to.length : 1
      };
    }

    // Production mode: Send via configured provider
    if (!this.activeProvider) {
      return {
        success: false,
        error: 'No SMS provider configured. Please set SMS provider credentials.'
      };
    }

    return this.activeProvider.send(options);
  }

  /**
   * Send SMS with specific provider
   */
  async sendWith(providerName: string, options: SendSMSOptions): Promise<SMSResponse> {
    const provider = this.providers.find(
      p => p.name.toLowerCase() === providerName.toLowerCase()
    );

    if (!provider) {
      return {
        success: false,
        error: `Provider '${providerName}' not found`
      };
    }

    if (!provider.isConfigured()) {
      return {
        success: false,
        error: `Provider '${providerName}' not configured`
      };
    }

    return provider.send(options);
  }

  /**
   * Get SMS balance
   */
  async getBalance(): Promise<number> {
    if (!this.activeProvider) return 0;
    return this.activeProvider.getBalance();
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!this.activeProvider || this.isDevelopment;
  }

  /**
   * Get active provider name
   */
  getActiveProvider(): string | null {
    return this.activeProvider?.name || null;
  }

  /**
   * Validate Thai phone number
   */
  isValidThaiPhone(phone: string): boolean {
    const normalized = phone.replace(/[\s\-()]/g, '');
    
    // Thai mobile: 08x, 09x, 06x (10 digits total)
    const thaiMobileRegex = /^(0[689]\d{8}|66[689]\d{8})$/;
    
    return thaiMobileRegex.test(normalized);
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Helper function for quick SMS sending
export async function sendSMS(
  to: string | string[],
  message: string,
  options?: Partial<SendSMSOptions>
): Promise<SMSResponse> {
  return smsService.send({
    to,
    message,
    ...options
  });
}

// Helper to send SMS with Thai template
export function formatThaiSMS(template: string, variables: Record<string, string>): string {
  let message = template;
  
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(`{${key}}`, value);
  }

  // Ensure message is within Thai SMS limit (160 chars for English, ~70 Thai chars)
  // Thai characters count as 2 in GSM encoding
  const maxLength = 70;
  if (message.length > maxLength) {
    message = message.substring(0, maxLength - 3) + '...';
  }

  return message;
}
