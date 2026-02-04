import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

// GET: List webhooks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const { data: webhooks } = await adminClient
      .from('webhooks')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ webhooks: webhooks || [] });
  } catch (error) {
    console.error('Webhooks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, url, events = [], headers = {}, retryCount = 3, timeoutSeconds = 30 } = body;

    if (!name || !url || !events.length) {
      return NextResponse.json({ error: 'name, url, and events required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).single();
    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');

    const { data: webhook, error } = await adminClient
      .from('webhooks')
      .insert({
        clinic_id: staff.clinic_id,
        name,
        url,
        secret,
        events,
        headers,
        retry_count: retryCount,
        timeout_seconds: timeoutSeconds,
        is_active: true
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });

    return NextResponse.json({ success: true, webhook });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');
    if (!webhookId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const adminClient = createAdminClient();

    const { error } = await adminClient.from('webhooks').delete().eq('id', webhookId);
    if (error) return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
