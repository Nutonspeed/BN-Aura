import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


// GET: List inventory alerts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const alertType = searchParams.get('type');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('inventory_alerts')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    if (status !== 'all') query = query.eq('status', status);
    if (alertType) query = query.eq('alert_type', alertType);

    const { data: alerts } = await query.limit(100);

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Inventory alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Acknowledge/resolve alert
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json({ error: 'alertId and action required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (action === 'acknowledge') {
      updateData.acknowledged_by = user.id;
      updateData.acknowledged_at = new Date().toISOString();
    } else if (action === 'resolve') {
      updateData.status = 'resolved';
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: alert, error } = await adminClient
      .from('inventory_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
