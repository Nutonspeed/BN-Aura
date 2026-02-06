import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Get customer analytics (CLV, segments)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    const sortBy = searchParams.get('sort') || 'lifetime_value';

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('customer_analytics')
      .select('*, customer:customers(id, full_name, phone, email)')
      .eq('clinic_id', staff.clinic_id)
      .order(sortBy, { ascending: false })
      .limit(100);

    if (segment) query = query.eq('customer_segment', segment);

    const { data: analytics } = await query;

    // Get segment summary
    const { data: segments } = await adminClient
      .from('customer_analytics')
      .select('customer_segment')
      .eq('clinic_id', staff.clinic_id);

    const segmentCounts: Record<string, number> = {};
    segments?.forEach(s => {
      segmentCounts[s.customer_segment || 'unknown'] = (segmentCounts[s.customer_segment || 'unknown'] || 0) + 1;
    });

    return NextResponse.json({ analytics: analytics || [], segmentCounts });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Calculate/update customer analytics
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { customerId } = body;

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Calculate CLV from transactions
    const { data: transactions } = await adminClient
      .from('pos_transactions')
      .select('total_amount, created_at')
      .eq('clinic_id', staff.clinic_id)
      .eq('customer_id', customerId)
      .eq('status', 'completed');

    const totalSpend = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
    const totalVisits = transactions?.length || 0;
    const avgOrderValue = totalVisits > 0 ? totalSpend / totalVisits : 0;

    const dates = transactions?.map(t => new Date(t.created_at)).sort((a, b) => a.getTime() - b.getTime()) || [];
    const firstVisit = dates[0];
    const lastVisit = dates[dates.length - 1];
    const daysSinceLast = lastVisit ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    // Calculate segment
    let segment = 'new';
    if (daysSinceLast > 180) segment = 'lost';
    else if (daysSinceLast > 90) segment = 'dormant';
    else if (daysSinceLast > 60) segment = 'at_risk';
    else if (totalVisits >= 10 && totalSpend >= 50000) segment = 'vip';
    else if (totalVisits >= 5) segment = 'loyal';
    else if (totalVisits >= 2) segment = 'promising';

    // Calculate churn risk
    const churnRisk = Math.min(daysSinceLast / 180, 1);

    const { data: analytics, error } = await adminClient
      .from('customer_analytics')
      .upsert({
        clinic_id: staff.clinic_id,
        customer_id: customerId,
        lifetime_value: totalSpend,
        total_visits: totalVisits,
        total_spend: totalSpend,
        average_order_value: avgOrderValue,
        first_visit_date: firstVisit?.toISOString().split('T')[0],
        last_visit_date: lastVisit?.toISOString().split('T')[0],
        days_since_last_visit: daysSinceLast,
        churn_risk_score: churnRisk,
        customer_segment: segment,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'clinic_id,customer_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update analytics' }, { status: 500 });

    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error('Analytics calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
