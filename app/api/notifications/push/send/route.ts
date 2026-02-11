/**
 * Push Notification Send API
 * POST - Send push notification to specific user(s)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import webpush from 'web-push';

// Configure VAPID keys (generate with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bn-aura.com';

function isWebPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

if (isWebPushConfigured()) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userId, userIds, title, message, url, icon, data: notifData } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }

    if (!isWebPushConfigured()) {
      // Mock mode
      console.log('[Push] MOCK - Would send:', { userId, userIds, title, message });
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'Push notifications not configured (VAPID keys missing). Notification logged.',
        _mock: true,
      });
    }

    const adminClient = createAdminClient();
    const targetUserIds = userIds || (userId ? [userId] : [user.id]);

    // Get push subscriptions for target users
    const { data: subscriptions } = await adminClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No push subscriptions found for target users',
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/next.svg',
      badge: '/next.svg',
      url: url || '/',
      data: notifData || {},
      timestamp: Date.now(),
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          return { success: true, userId: sub.user_id };
        } catch (error: any) {
          // Remove expired subscriptions (410 Gone)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await adminClient
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { success: false, userId: sub.user_id, error: error.message };
        }
      })
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).success
    ).length;

    return NextResponse.json({
      success: true,
      sent,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('[Push] Send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
