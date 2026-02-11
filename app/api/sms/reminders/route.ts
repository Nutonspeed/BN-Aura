/**
 * SMS Appointment Reminder API
 * POST - Send appointment reminder to customer
 * GET  - Get upcoming appointments that need reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { smsService, formatThaiSMS } from '@/lib/sms/smsService';

const REMINDER_TEMPLATES = {
  '24h': 'สวัสดีค่ะ คุณ{name} นัดหมายของคุณที่ {clinic} วันพรุ่งนี้ เวลา {time} น. กรุณามาตรงเวลา - BN-Aura',
  '1h': 'แจ้งเตือน: นัดหมายของคุณที่ {clinic} อีก 1 ชม. เวลา {time} น. - BN-Aura',
  'confirm': 'คุณ{name} กรุณายืนยันนัดหมาย {date} เวลา {time} น. ที่ {clinic} ตอบ Y เพื่อยืนยัน - BN-Aura',
  'cancel': 'นัดหมายของคุณที่ {clinic} วันที่ {date} เวลา {time} น. ถูกยกเลิก กรุณาติดต่อคลินิก - BN-Aura',
  'reschedule': 'นัดหมายของคุณถูกเลื่อนเป็น {date} เวลา {time} น. ที่ {clinic} - BN-Aura',
};

// POST: Send appointment reminder
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { appointmentId, type, customMessage } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get appointment details
    const { data: appointment } = await adminClient
      .from('appointments')
      .select(`
        id, appointment_date, start_time, status,
        customer:customers(id, full_name, phone),
        clinic:clinics(id, display_name)
      `)
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const customer = appointment.customer as any;
    const clinic = appointment.clinic as any;

    if (!customer?.phone) {
      return NextResponse.json({ error: 'Customer has no phone number' }, { status: 400 });
    }

    // Build message
    const templateType = (type || '24h') as keyof typeof REMINDER_TEMPLATES;
    const template = REMINDER_TEMPLATES[templateType];
    
    if (!template && !customMessage) {
      return NextResponse.json({ error: 'Invalid reminder type' }, { status: 400 });
    }

    const clinicName = typeof clinic?.display_name === 'object' 
      ? (clinic.display_name as any)?.th || (clinic.display_name as any)?.en || 'คลินิก'
      : clinic?.display_name || 'คลินิก';

    const message = customMessage || formatThaiSMS(template, {
      name: customer.full_name || 'ลูกค้า',
      clinic: clinicName,
      date: appointment.appointment_date || '',
      time: appointment.start_time || '',
    });

    // Send SMS
    const result = await smsService.send({
      to: customer.phone,
      message,
    });

    // Log the reminder
    await adminClient.from('notifications').insert({
      clinic_id: clinic?.id,
      user_id: customer.id,
      type: 'sms_reminder',
      title: `SMS Reminder (${templateType})`,
      message,
      metadata: {
        appointment_id: appointmentId,
        reminder_type: templateType,
        sms_result: result,
      },
    }).select().maybeSingle();

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Reminder sent' : 'Failed to send',
      details: result,
    });
  } catch (error) {
    console.error('[SMS Reminder] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get appointments needing reminders (for cron/scheduled tasks)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');

    // Simple cron auth
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find appointments in next 24 hours that haven't been reminded
    const { data: appointments } = await adminClient
      .from('appointments')
      .select(`
        id, appointment_date, start_time, status,
        customer:customers(id, full_name, phone),
        clinic:clinics(id, display_name)
      `)
      .eq('status', 'confirmed')
      .gte('appointment_date', now.toISOString().split('T')[0])
      .lte('appointment_date', tomorrow.toISOString().split('T')[0])
      .limit(50);

    const needsReminder = (appointments || []).filter(
      (apt: any) => apt.customer?.phone
    );

    return NextResponse.json({
      success: true,
      count: needsReminder.length,
      appointments: needsReminder.map((apt: any) => ({
        id: apt.id,
        date: apt.appointment_date,
        time: apt.start_time,
        customer: apt.customer?.full_name,
        phone: apt.customer?.phone,
      })),
    });
  } catch (error) {
    console.error('[SMS Reminder] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
