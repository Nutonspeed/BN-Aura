/**
 * Unified Notification Sender
 * Single entry point for sending notifications across all channels
 * Respects customer channel preferences and handles delivery tracking
 */

export type NotificationChannel = 'in_app' | 'sms' | 'line' | 'email' | 'push';

export interface SendNotificationOptions {
  clinicId: string;
  userId?: string;
  customerId?: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels?: NotificationChannel[];
  phone?: string;
  email?: string;
  lineUserId?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendResult {
  success: boolean;
  deliveries: DeliveryResult[];
  notificationId?: string;
}

/**
 * Send notification across multiple channels
 */
export async function sendNotification(opts: SendNotificationOptions): Promise<SendResult> {
  const baseUrl = getBaseUrl();
  const deliveries: DeliveryResult[] = [];
  let notificationId: string | undefined;

  // Determine which channels to use
  const channels = opts.channels || determineChannels(opts);

  // 1. In-App notification (always attempt)
  if (channels.includes('in_app')) {
    try {
      const res = await fetch(`${baseUrl}/api/notifications/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: opts.type,
          clinicId: opts.clinicId,
          message: opts.message,
          phone: opts.phone,
          queueNumber: 0,
        }),
      });
      const data = await res.json();
      deliveries.push({
        channel: 'in_app',
        success: res.ok,
        messageId: data?.notificationId,
      });
      notificationId = data?.notificationId;
    } catch (e: any) {
      deliveries.push({ channel: 'in_app', success: false, error: e.message });
    }
  }

  // 2. SMS
  if (channels.includes('sms') && opts.phone) {
    try {
      const res = await fetch(`${baseUrl}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: opts.phone,
          message: opts.message,
          clinicId: opts.clinicId,
        }),
      });
      deliveries.push({
        channel: 'sms',
        success: res.ok,
        messageId: `sms-${Date.now()}`,
      });
    } catch (e: any) {
      deliveries.push({ channel: 'sms', success: false, error: e.message });
    }
  }

  // 3. LINE
  if (channels.includes('line') && opts.lineUserId) {
    try {
      const res = await fetch(`${baseUrl}/api/notifications/line`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: opts.lineUserId,
          message: opts.message,
          type: 'text',
        }),
      });
      deliveries.push({
        channel: 'line',
        success: res.ok,
        messageId: `line-${Date.now()}`,
      });
    } catch (e: any) {
      deliveries.push({ channel: 'line', success: false, error: e.message });
    }
  }

  // 4. Email
  if (channels.includes('email') && opts.email) {
    try {
      const res = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: opts.email,
          subject: opts.title,
          html: `<p>${opts.message}</p>`,
          clinicId: opts.clinicId,
        }),
      });
      deliveries.push({
        channel: 'email',
        success: res.ok,
        messageId: `email-${Date.now()}`,
      });
    } catch (e: any) {
      deliveries.push({ channel: 'email', success: false, error: e.message });
    }
  }

  // Log delivery results
  const anySuccess = deliveries.some(d => d.success);

  return {
    success: anySuccess,
    deliveries,
    notificationId,
  };
}

/**
 * Determine channels based on priority and available contact info
 */
function determineChannels(opts: SendNotificationOptions): NotificationChannel[] {
  const channels: NotificationChannel[] = ['in_app'];

  if (opts.priority === 'critical' || opts.priority === 'high') {
    if (opts.phone) channels.push('sms');
    if (opts.lineUserId) channels.push('line');
    if (opts.email) channels.push('email');
  } else if (opts.priority === 'medium') {
    if (opts.lineUserId) channels.push('line');
    else if (opts.phone) channels.push('sms');
  }
  // low priority = in_app only

  return channels;
}

/**
 * Send notification with retry logic
 */
export async function sendWithRetry(
  opts: SendNotificationOptions,
  maxRetries = 2
): Promise<SendResult> {
  let lastResult: SendResult = { success: false, deliveries: [] };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await sendNotification(opts);
    if (lastResult.success) return lastResult;

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }

  return lastResult;
}

/**
 * Get base URL for internal API calls
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}
