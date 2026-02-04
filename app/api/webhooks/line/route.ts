import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLineService } from '@/lib/integrations/line';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // Parse events
    const data = JSON.parse(body);
    const events = data.events || [];

    for (const event of events) {
      await handleLineEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleLineEvent(event: {
  type: string;
  source: { userId: string };
  message?: { type: string; text?: string };
  replyToken?: string;
}) {
  const adminClient = createAdminClient();

  // Find clinic by LINE user
  const { data: booking } = await adminClient
    .from('social_bookings')
    .select('clinic_id, customer_id')
    .eq('platform', 'line')
    .eq('platform_user_id', event.source.userId)
    .single();

  if (!booking) {
    // New user - try to match or create booking record
    return;
  }

  switch (event.type) {
    case 'message':
      if (event.message?.type === 'text') {
        // Save incoming message
        const { data: conversation } = await adminClient
          .from('sms_conversations')
          .select('id')
          .eq('clinic_id', booking.clinic_id)
          .eq('customer_id', booking.customer_id)
          .single();

        if (conversation) {
          await adminClient.from('sms_messages').insert({
            conversation_id: conversation.id,
            clinic_id: booking.clinic_id,
            direction: 'inbound',
            content: event.message.text,
            status: 'delivered',
          });

          // Update conversation
          await adminClient
            .from('sms_conversations')
            .update({
              last_message_at: new Date().toISOString(),
              unread_count: adminClient.rpc('increment', { row_id: conversation.id }),
            })
            .eq('id', conversation.id);
        }
      }
      break;

    case 'follow':
      // User added bot as friend
      const lineService = await createLineService(booking.clinic_id);
      const profile = await lineService.getProfile(event.source.userId);
      
      if (profile) {
        await adminClient
          .from('social_bookings')
          .update({ platform_user_name: profile.displayName })
          .eq('platform_user_id', event.source.userId);
      }
      break;

    case 'unfollow':
      // User blocked bot
      await adminClient
        .from('social_bookings')
        .update({ status: 'cancelled' })
        .eq('platform_user_id', event.source.userId);
      break;
  }
}
