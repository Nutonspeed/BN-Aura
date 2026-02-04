import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List tips
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('tips')
      .select('*, customer:customers(full_name)')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    if (staffId) query = query.eq('staff_id', staffId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: tips } = await query.limit(100);

    // Calculate totals
    const total = tips?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const undistributed = tips?.filter(t => !t.distributed).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    return NextResponse.json({ tips: tips || [], total, undistributed });
  } catch (error) {
    console.error('Tips API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add tip
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { staffId, amount, customerId, appointmentId, transactionId, paymentMethod, notes } = body;

    if (!staffId || !amount) {
      return NextResponse.json({ error: 'staffId and amount required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const { data: tip, error } = await adminClient
      .from('tips')
      .insert({
        clinic_id: staff.clinic_id,
        staff_id: staffId,
        amount,
        customer_id: customerId,
        appointment_id: appointmentId,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        notes
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to add tip' }, { status: 500 });

    return NextResponse.json({ success: true, tip });
  } catch (error) {
    console.error('Add tip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
