import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';


export async function POST(request: NextRequest) {
  try {
    const events = await request.json();

    const adminClient = createAdminClient();

    for (const event of events) {
      const { email, event: eventType, sg_message_id, timestamp } = event;

      // Find recipient by email or message ID
      const { data: recipient } = await adminClient
        .from('email_campaign_recipients')
        .select('id, campaign_id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!recipient) continue;

      const updates: Record<string, unknown> = {};
      const eventTime = new Date(timestamp * 1000).toISOString();

      switch (eventType) {
        case 'delivered':
          updates.status = 'sent';
          updates.sent_at = eventTime;
          break;
        case 'open':
          updates.status = 'opened';
          updates.opened_at = eventTime;
          break;
        case 'click':
          updates.status = 'clicked';
          updates.clicked_at = eventTime;
          break;
        case 'bounce':
        case 'dropped':
          updates.status = 'bounced';
          updates.bounced_at = eventTime;
          break;
        case 'unsubscribe':
          updates.unsubscribed_at = eventTime;
          // Add to unsubscribe list
          await adminClient.from('email_unsubscribes').upsert({
            email,
            unsubscribed_at: eventTime,
          }, { onConflict: 'email' });
          break;
        case 'spamreport':
          updates.status = 'bounced';
          // Add to unsubscribe
          await adminClient.from('email_unsubscribes').upsert({
            email,
            reason: 'spam_report',
            unsubscribed_at: eventTime,
          }, { onConflict: 'email' });
          break;
      }

      if (Object.keys(updates).length > 0) {
        await adminClient
          .from('email_campaign_recipients')
          .update(updates)
          .eq('id', recipient.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
