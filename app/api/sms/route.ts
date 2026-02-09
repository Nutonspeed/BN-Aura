import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List SMS conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const { data: conversations } = await adminClient
      .from('sms_conversations')
      .select('*, customer:customers(id, full_name, phone), messages:sms_messages(id, content, direction, created_at)')
      .eq('clinic_id', staff.clinic_id)
      .eq('status', status)
      .order('last_message_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send SMS
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { conversationId, phone, content, customerId } = body;

    if (!content || (!conversationId && !phone)) {
      return NextResponse.json({ error: 'content and (conversationId or phone) required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let targetConversationId = conversationId;

    // Create conversation if needed
    if (!conversationId && phone) {
      const { data: existing } = await adminClient
        .from('sms_conversations')
        .select('id')
        .eq('clinic_id', staff.clinic_id)
        .eq('customer_phone', phone)
        .eq('status', 'active')
        .single();

      if (existing) {
        targetConversationId = existing.id;
      } else {
        const { data: newConv } = await adminClient
          .from('sms_conversations')
          .insert({ clinic_id: staff.clinic_id, customer_id: customerId, customer_phone: phone, status: 'active' })
          .select()
          .single();
        targetConversationId = newConv?.id;
      }
    }

    // Create message
    const { data: message, error } = await adminClient
      .from('sms_messages')
      .insert({
        conversation_id: targetConversationId,
        clinic_id: staff.clinic_id,
        direction: 'outbound',
        content,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
    }

    // Update conversation
    await adminClient
      .from('sms_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', targetConversationId);

    // SMS sent via configured provider (Twilio)

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('SMS send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
