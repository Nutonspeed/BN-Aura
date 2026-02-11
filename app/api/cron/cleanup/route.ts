/**
 * Cron Job: Database Cleanup
 * Runs daily — cleans expired OTPs, old notifications, stale sessions
 * Vercel Cron: /api/cron/cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const now = new Date();

  try {
    // 1. Delete expired OTP codes
    await adminClient
      .from('otp_codes')
      .delete()
      .lt('expires_at', now.toISOString());

    // 2. Delete old read notifications (older than 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    await adminClient
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', ninetyDaysAgo);

    // 3. Delete push subscriptions not updated in 60 days
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    await adminClient
      .from('push_subscriptions')
      .delete()
      .lt('updated_at', sixtyDaysAgo);

    console.log('[Cron Cleanup] Completed successfully');

    return NextResponse.json({
      success: true,
      cleaned: ['expired_otps', 'old_notifications', 'stale_push_subscriptions'],
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[Cron Cleanup] Error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
