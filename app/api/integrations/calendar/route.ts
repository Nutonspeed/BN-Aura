/**
 * Google Calendar Sync API
 * GET  - Get sync status / list synced events
 * POST - Create calendar event from appointment
 * PATCH - Update sync settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// GET: Sync status or list events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Check if Google Calendar integration is configured
    const { data: integration } = await adminClient
      .from('social_integrations')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    if (!integration) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          setupUrl: '/clinic/settings/integrations',
          instructions: {
            steps: [
              '1. ไปที่ Google Cloud Console สร้าง OAuth 2.0 credentials',
              '2. เปิดใช้งาน Google Calendar API',
              '3. ตั้งค่า redirect URI: /api/integrations/calendar/callback',
              '4. ใส่ Client ID และ Client Secret ในหน้าตั้งค่า',
            ],
          },
        },
      });
    }

    // Get upcoming synced appointments
    const { data: appointments } = await adminClient
      .from('appointments')
      .select('id, customer_id, service_name, start_time, end_time, status, metadata')
      .eq('clinic_id', staff.clinic_id)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        lastSync: integration.updated_at,
        calendarId: integration.metadata?.calendar_id || 'primary',
        upcomingEvents: (appointments || []).map((a: any) => ({
          id: a.id,
          title: a.service_name,
          start: a.start_time,
          end: a.end_time,
          status: a.status,
          synced: !!a.metadata?.google_event_id,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Calendar] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Sync appointment to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { appointmentId, action = 'sync' } = await request.json();
    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Get integration credentials
    const { data: integration } = await adminClient
      .from('social_integrations')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    if (!integration?.access_token) {
      return NextResponse.json({
        error: 'Google Calendar not connected',
        setupUrl: '/clinic/settings/integrations',
      }, { status: 400 });
    }

    // Get appointment
    const { data: appointment } = await adminClient
      .from('appointments')
      .select('*, customer:customers(full_name, phone)')
      .eq('id', appointmentId)
      .eq('clinic_id', staff.clinic_id)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (action === 'sync') {
      // Create Google Calendar event
      const calendarEvent = {
        summary: `${appointment.service_name} - ${appointment.customer?.full_name || 'ลูกค้า'}`,
        description: `นัดหมาย: ${appointment.service_name}\nลูกค้า: ${appointment.customer?.full_name}\nโทร: ${appointment.customer?.phone || '-'}`,
        start: {
          dateTime: appointment.start_time,
          timeZone: 'Asia/Bangkok',
        },
        end: {
          dateTime: appointment.end_time || new Date(new Date(appointment.start_time).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Bangkok',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      try {
        const calendarId = integration.metadata?.calendar_id || 'primary';
        const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEvent),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error('[Calendar] Google API error:', errBody);
          return NextResponse.json({ error: 'Failed to create calendar event', details: errBody }, { status: 502 });
        }

        const googleEvent = await res.json();

        // Update appointment with Google event ID
        await adminClient
          .from('appointments')
          .update({
            metadata: {
              ...appointment.metadata,
              google_event_id: googleEvent.id,
              google_event_link: googleEvent.htmlLink,
              synced_at: new Date().toISOString(),
            },
          })
          .eq('id', appointmentId);

        return NextResponse.json({
          success: true,
          data: {
            googleEventId: googleEvent.id,
            eventLink: googleEvent.htmlLink,
            synced: true,
          },
        });
      } catch (fetchError: any) {
        console.error('[Calendar] Fetch error:', fetchError);
        return NextResponse.json({ error: 'Google Calendar API unreachable' }, { status: 502 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Calendar] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
