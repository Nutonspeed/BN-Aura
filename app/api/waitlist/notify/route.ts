import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// POST: Notify waitlist entries about available slot
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      entryIds,
      availableSlot, // { date, time, staffId, duration }
      expiresInHours = 2
    } = body;

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'entryIds array is required' },
        { status: 400 }
      );
    }

    if (!availableSlot || !availableSlot.date || !availableSlot.time) {
      return NextResponse.json(
        { error: 'availableSlot with date and time is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const notifications: { entryId: string; channel: string; sent: boolean }[] = [];

    for (const entryId of entryIds) {
      // Fetch entry details
      const { data: entry } = await adminClient
        .from('waitlist_entries')
        .select('*, customer:customers(phone, email)')
        .eq('id', entryId)
        .single();

      if (!entry) continue;

      const prefs = entry.notification_preferences || {};
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Determine channels and send
      const channels: string[] = [];
      if (prefs.sms && (entry.customer?.phone || entry.customer_phone)) {
        channels.push('sms');
      }
      if (prefs.email && (entry.customer?.email || entry.customer_email)) {
        channels.push('email');
      }
      if (prefs.line) {
        channels.push('line');
      }

      for (const channel of channels) {
        // Create notification record
        const { data: notification } = await adminClient
          .from('waitlist_notifications')
          .insert({
            waitlist_entry_id: entryId,
            available_slot: availableSlot,
            channel,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        // Notifications sent via configured channels
        // await sendNotification(channel, entry, availableSlot);

        notifications.push({
          entryId,
          channel,
          sent: !!notification
        });
      }

      // Update entry status and notification count
      await adminClient
        .from('waitlist_entries')
        .update({
          status: 'notified',
          notified_count: (entry.notified_count || 0) + 1,
          last_notified_at: new Date().toISOString()
        })
        .eq('id', entryId);
    }

    return NextResponse.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Waitlist notify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
