import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/notifications/queue
 * Send notification when a queue number is called
 * Supports SMS and LINE channels
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, phone, message, clinicId, checkinId, queueNumber } = body;

    if (!type || !clinicId) {
      return NextResponse.json({ error: 'type and clinicId required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const results: string[] = [];

    // Log the notification attempt
    try {
      const { data: notiData } = await adminClient
        .from('notifications')
        .insert({
          clinic_id: clinicId,
          type: 'queue_called',
          title: `คิว ${queueNumber} ถูกเรียก`,
          message: message || `คิวหมายเลข ${queueNumber} กรุณาเตรียมตัวเข้ารับบริการ`,
          priority: 'high',
          channels: phone ? ['sms'] : ['in_app'],
          is_read: false,
          metadata: { checkinId, queueNumber, phone }
        })
        .select('id')
        .single();
      if (notiData) results.push(`notification:${notiData.id}`);
    } catch {
      results.push('notification:skipped');
    }

    // Send SMS if phone is available
    if (phone && message) {
      try {
        // Use the SMS service if configured
        const smsApiKey = process.env.THAI_SMS_PLUS_API_KEY || process.env.TWILIO_ACCOUNT_SID;
        
        if (smsApiKey) {
          // Import and use SMS service
          const { smsService } = await import('@/lib/sms');
          const smsResult = await smsService.send({
            to: phone,
            message,
            priority: 'high',
          });

          if (smsResult.success) {
            results.push(`sms:${smsResult.messageId || 'sent'}`);
          } else {
            results.push(`sms:failed:${smsResult.error || 'unknown'}`);
          }
        } else {
          // No SMS provider configured - log but don't fail
          results.push('sms:no_provider');
          console.log(`[Queue Notify] SMS not configured. Would send to ${phone}: ${message}`);
        }
      } catch (smsError: any) {
        results.push(`sms:error:${smsError.message || 'unknown'}`);
        console.warn('SMS send failed:', smsError);
      }
    }

    // Broadcast via Supabase Realtime (always works)
    try {
      await adminClient
        .channel(`queue:${clinicId}`)
        .send({
          type: 'broadcast',
          event: 'queue_called',
          payload: { queueNumber, phone, checkinId }
        });
      results.push('realtime:sent');
    } catch (e) {
      results.push('realtime:skipped');
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Queue ${queueNumber} notification processed`
    });
  } catch (error: any) {
    console.error('Queue notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
