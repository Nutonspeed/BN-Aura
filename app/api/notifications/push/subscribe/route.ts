import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    const userId = request.headers.get('x-user-id');

    // Store subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    console.log('[Push] Subscription saved for user:', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push] Subscribe error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
