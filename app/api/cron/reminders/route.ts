/**
 * Cron Job: Appointment Reminders
 * Runs every hour — sends SMS/LINE reminders for upcoming appointments
 * Vercel Cron: /api/cron/reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const now = new Date();
  const results = { sent24h: 0, sent1h: 0, errors: 0 };

  try {
    // 1. Send 24-hour reminders (appointments tomorrow at this hour)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    const currentHour = now.getHours().toString().padStart(2, '0');

    const { data: appointments24h } = await adminClient
      .from('appointments')
      .select('id, customer_id, appointment_date, start_time, status, customer:customers(full_name, phone)')
      .eq('appointment_date', tomorrowDate)
      .gte('start_time', `${currentHour}:00`)
      .lt('start_time', `${currentHour}:59`)
      .in('status', ['confirmed', 'pending']);

    for (const appt of appointments24h || []) {
      const customer = appt.customer as any;
      if (!customer?.phone) continue;

      try {
        // Log notification (actual SMS sending via smsService)
        await adminClient.from('notifications').insert({
          type: 'appointment_reminder_24h',
          recipient_id: appt.customer_id,
          channel: 'sms',
          title: 'นัดหมายพรุ่งนี้',
          message: `คุณ${customer.full_name} มีนัดหมายพรุ่งนี้ วันที่ ${appt.appointment_date} เวลา ${appt.start_time} น.`,
          metadata: { appointment_id: appt.id },
          status: 'queued',
        });
        results.sent24h++;
      } catch { results.errors++; }
    }

    // 2. Send 1-hour reminders (appointments in the next hour)
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const todayDate = now.toISOString().split('T')[0];
    const nextHour = oneHourLater.getHours().toString().padStart(2, '0');

    const { data: appointments1h } = await adminClient
      .from('appointments')
      .select('id, customer_id, appointment_date, start_time, status, customer:customers(full_name, phone)')
      .eq('appointment_date', todayDate)
      .gte('start_time', `${nextHour}:00`)
      .lt('start_time', `${nextHour}:59`)
      .in('status', ['confirmed', 'pending']);

    for (const appt of appointments1h || []) {
      const customer = appt.customer as any;
      if (!customer?.phone) continue;

      try {
        await adminClient.from('notifications').insert({
          type: 'appointment_reminder_1h',
          recipient_id: appt.customer_id,
          channel: 'sms',
          title: 'นัดหมายอีก 1 ชั่วโมง',
          message: `คุณ${customer.full_name} มีนัดหมายวันนี้เวลา ${appt.start_time} น. กรุณามาถึงก่อนเวลา 10 นาที`,
          metadata: { appointment_id: appt.id },
          status: 'queued',
        });
        results.sent1h++;
      } catch { results.errors++; }
    }

    console.log(`[Cron Reminders] 24h: ${results.sent24h}, 1h: ${results.sent1h}, errors: ${results.errors}`);

    return NextResponse.json({ success: true, ...results, timestamp: now.toISOString() });
  } catch (error) {
    console.error('[Cron Reminders] Error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
