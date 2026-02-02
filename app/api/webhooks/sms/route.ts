import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * SMS Webhook Handler
 * รับ callback จาก SMS Gateway (ThaiSMSPlus, SMS.to, Twilio)
 * สำหรับ:
 * 1. Delivery reports (DLR) - แจ้งสถานะการส่ง
 * 2. Incoming messages - ข้อความตอบกลับจากลูกค้า
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-sms-provider') || 'unknown';
    
    console.log('📱 SMS Webhook received:', { provider, body });

    // Verify webhook signature (ถ้า provider มี)
    const signature = request.headers.get('x-signature');
    if (signature && !verifySignature(body, signature, provider)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = createClient();

    // Handle different webhook types
    if (body.type === 'delivery_report' || body.status) {
      // Delivery Report - อัปเดตสถานะการส่ง
      await handleDeliveryReport(supabase, body, provider);
    } else if (body.type === 'incoming_message' || body.message) {
      // Incoming Message - ลูกค้าตอบกลับ
      await handleIncomingMessage(supabase, body, provider);
    } else {
      console.warn('⚠️ Unknown webhook type:', body);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Delivery Report
 * อัปเดตสถานะการส่ง SMS
 */
async function handleDeliveryReport(
  supabase: any,
  body: any,
  provider: string
) {
  const { message_id, status, phone, delivered_at, error_message } = body;

  console.log(`📊 Delivery Report: ${message_id} -> ${status}`);

  // บันทึกลง database (ถ้ามีตาราง sms_logs)
  const { error } = await supabase.from('sms_logs').insert({
    message_id,
    phone,
    status: mapDeliveryStatus(status, provider),
    delivered_at: delivered_at || new Date().toISOString(),
    error_message,
    provider,
    webhook_data: body
  });

  if (error) {
    console.error('Failed to log delivery report:', error);
  }

  // อัปเดต follow-up execution status ถ้ามี
  if (message_id) {
    await supabase
      .from('followup_executions')
      .update({
        status: status === 'delivered' ? 'sent' : 'failed',
        error_message: error_message,
        metadata: { delivery_report: body }
      })
      .eq('metadata->messageId', message_id);
  }
}

/**
 * Handle Incoming Message
 * รับข้อความตอบกลับจากลูกค้า
 */
async function handleIncomingMessage(
  supabase: any,
  body: any,
  provider: string
) {
  const { from, message, received_at } = body;
  const phone = normalizePhone(from);

  console.log(`💬 Incoming SMS from ${phone}: ${message}`);

  // หาลูกค้าจากเบอร์โทร
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, clinic_id')
    .eq('phone', phone)
    .single();

  if (!customer) {
    console.warn('⚠️ Customer not found for phone:', phone);
    return;
  }

  // บันทึกข้อความเข้ามา
  await supabase.from('customer_messages').insert({
    customer_id: customer.id,
    clinic_id: customer.clinic_id,
    direction: 'inbound',
    channel: 'sms',
    content: message,
    from_phone: phone,
    received_at: received_at || new Date().toISOString(),
    metadata: { webhook_data: body, provider }
  });

  // Auto-reply logic (ถ้าต้องการ)
  await handleAutoReply(supabase, customer, message);
}

/**
 * Auto-reply logic
 * ตอบกลับอัตโนมัติตามคำสำคัญ
 */
async function handleAutoReply(supabase: any, customer: any, message: string) {
  const lowerMessage = message.toLowerCase().trim();

  // ตัวอย่าง auto-reply rules
  if (lowerMessage.includes('ยกเลิก') || lowerMessage.includes('cancel')) {
    // TODO: Handle cancellation
    console.log('🚫 Cancellation request from', customer.full_name);
  } else if (lowerMessage.includes('ยืนยัน') || lowerMessage.includes('confirm')) {
    // TODO: Handle confirmation
    console.log('✅ Confirmation from', customer.full_name);
  } else if (lowerMessage.includes('สอบถาม') || lowerMessage.includes('ติดต่อ')) {
    // Create notification for staff
    await supabase.from('notifications').insert({
      clinic_id: customer.clinic_id,
      title: 'ลูกค้าส่งข้อความ SMS',
      message: `${customer.full_name}: ${message}`,
      type: 'customer_message',
      link: `/customers/${customer.id}`,
      metadata: { customer_id: customer.id, channel: 'sms' }
    });
  }
}

/**
 * Verify webhook signature
 */
function verifySignature(body: any, signature: string, provider: string): boolean {
  // TODO: Implement signature verification per provider
  // ThaiSMSPlus: HMAC-SHA256
  // SMS.to: Custom header
  // Twilio: X-Twilio-Signature
  return true; // Skip verification for now
}

/**
 * Map delivery status from different providers
 */
function mapDeliveryStatus(status: string, provider: string): string {
  const statusMap: Record<string, string> = {
    // ThaiSMSPlus & Twilio
    'success': 'delivered',
    'delivered': 'delivered',
    'failed': 'failed',
    'expired': 'failed',
    'undelivered': 'failed',
    // SMS.to
    'sent': 'delivered',
    'error': 'failed'
  };

  return statusMap[status.toLowerCase()] || 'unknown';
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string): string {
  // Remove non-digits
  let normalized = phone.replace(/\D/g, '');
  
  // Convert to Thai format (0xxx)
  if (normalized.startsWith('66')) {
    normalized = '0' + normalized.substring(2);
  } else if (normalized.startsWith('+66')) {
    normalized = '0' + normalized.substring(3);
  }
  
  return normalized;
}

/**
 * GET endpoint (for ThaiBulkSMS webhook)
 * รับ parameters ผ่าน query string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // รับ parameters จาก query string
    const message_id = searchParams.get('message_id');
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const delivered_at = searchParams.get('delivered_at');
    const error_message = searchParams.get('error');
    
    // ถ้าไม่มี parameters = test/ping request
    if (!message_id && !status) {
      return NextResponse.json({
        status: 'ok',
        message: 'SMS Webhook endpoint is active',
        url: request.url,
        timestamp: new Date().toISOString()
      });
    }

    console.log('📱 SMS Webhook (GET):', { message_id, status, phone });

    // Process delivery report
    const supabase = createClient();
    await handleDeliveryReport(supabase, {
      message_id,
      status,
      phone,
      delivered_at,
      error_message
    }, 'thaibulksms');

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    console.error('❌ SMS webhook (GET) error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
