/**
 * Queue Notification Service
 * Auto-sends SMS/LINE when a customer's queue number is called
 * Integrates with the kiosk check-in system
 */

interface QueueNotifyOptions {
  queueNumber: number;
  customerName?: string;
  phone?: string;
  clinicName?: string;
  clinicId: string;
  checkinId: string;
}

interface NotifyResult {
  sent: boolean;
  channel?: 'sms' | 'line' | 'none';
  error?: string;
}

/**
 * Send notification when queue is called
 * Tries SMS first (if phone available), falls back gracefully
 */
export async function notifyQueueCalled(options: QueueNotifyOptions): Promise<NotifyResult> {
  const { queueNumber, customerName, phone, clinicName, clinicId } = options;

  // No phone = no notification possible
  if (!phone) {
    return { sent: false, channel: 'none', error: 'No phone number available' };
  }

  const message = buildQueueCallMessage({
    queueNumber,
    customerName,
    clinicName: clinicName || 'คลินิก',
  });

  // Try SMS notification
  try {
    const res = await fetch(`${getBaseUrl()}/api/notifications/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'queue_called',
        phone,
        message,
        clinicId,
        checkinId: options.checkinId,
        queueNumber,
      }),
    });

    if (res.ok) {
      return { sent: true, channel: 'sms' };
    }
  } catch (e) {
    console.warn('Queue SMS notification failed:', e);
  }

  return { sent: false, channel: 'none', error: 'Notification delivery failed' };
}

/**
 * Build the Thai-language queue call notification message
 */
function buildQueueCallMessage(opts: {
  queueNumber: number;
  customerName?: string;
  clinicName: string;
}): string {
  const greeting = opts.customerName ? `คุณ${opts.customerName}` : 'ลูกค้า';
  return [
    `${opts.clinicName}`,
    `${greeting} คิวหมายเลข ${opts.queueNumber} ถูกเรียกแล้ว`,
    `กรุณาเตรียมตัวเข้ารับบริการ`,
  ].join('\n');
}

/**
 * Get base URL for internal API calls
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
}
