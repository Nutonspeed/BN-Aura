import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    const status = formData.get('SmsStatus') as string;

    const adminClient = createAdminClient();

    // Find clinic by phone number
    const { data: integration } = await adminClient
      .from('social_integrations')
      .select('clinic_id')
      .eq('platform', 'twilio')
      .eq('is_active', true)
      .filter('settings->>phoneNumber', 'eq', to)
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Find or create conversation
    let { data: conversation } = await adminClient
      .from('sms_conversations')
      .select('id')
      .eq('clinic_id', integration.clinic_id)
      .eq('customer_phone', from)
      .single();

    if (!conversation) {
      // Try to find customer
      const { data: customer } = await adminClient
        .from('customers')
        .select('id')
        .eq('clinic_id', integration.clinic_id)
        .eq('phone', from)
        .single();

      const { data: newConversation } = await adminClient
        .from('sms_conversations')
        .insert({
          clinic_id: integration.clinic_id,
          customer_id: customer?.id,
          customer_phone: from,
          status: 'active',
        })
        .select()
        .single();

      conversation = newConversation;
    }

    if (conversation) {
      // Save incoming message
      await adminClient.from('sms_messages').insert({
        conversation_id: conversation.id,
        clinic_id: integration.clinic_id,
        direction: 'inbound',
        content: body,
        status: 'delivered',
        provider_message_id: messageSid,
      });

      // Update conversation
      await adminClient
        .from('sms_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: 1, // Simple increment
        })
        .eq('id', conversation.id);
    }

    // Return TwiML response (empty = no auto-reply)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
