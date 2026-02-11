import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


// GET: Get staff performance metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const period = searchParams.get('period') || 'month';

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    if (period === 'week') {
      periodStart = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'quarter') {
      periodStart = new Date(now.setMonth(now.getMonth() - 3));
    } else {
      periodStart = new Date(now.setMonth(now.getMonth() - 1));
    }

    let query = adminClient
      .from('staff_performance')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .gte('period_start', periodStart.toISOString().split('T')[0])
      .order('total_revenue', { ascending: false });

    if (staffId) query = query.eq('staff_id', staffId);

    const { data: performance } = await query;

    return NextResponse.json({ performance: performance || [] });
  } catch (error) {
    console.error('Staff performance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Calculate staff performance
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { staffId, periodStart, periodEnd } = body;

    const adminClient = createAdminClient();
    const { data: staffRecord } = await adminClient.from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staffRecord || !['clinic_owner', 'clinic_admin'].includes(staffRecord.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get appointments
    const { data: appointments } = await adminClient
      .from('appointments')
      .select('status, total_amount')
      .eq('clinic_id', staffRecord.clinic_id)
      .eq('staff_id', staffId)
      .gte('date', periodStart)
      .lte('date', periodEnd);

    const total = appointments?.length || 0;
    const completed = appointments?.filter(a => a.status === 'completed').length || 0;
    const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0;
    const noShow = appointments?.filter(a => a.status === 'no_show').length || 0;
    const revenue = appointments?.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0;

    // Get reviews
    const { data: reviews } = await adminClient
      .from('customer_reviews')
      .select('rating')
      .eq('staff_id', staffId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    const avgRating = reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

    // Get commissions
    const { data: commissions } = await adminClient
      .from('commission_records')
      .select('commission_amount')
      .eq('staff_id', staffId)
      .gte('transaction_date', periodStart)
      .lte('transaction_date', periodEnd);

    const commissionEarned = commissions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

    // Calculate performance score (0-100)
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const performanceScore = Math.min(100, completionRate * 0.4 + (avgRating || 3) * 10 + Math.min(revenue / 1000, 20));

    const { data: performance, error } = await adminClient
      .from('staff_performance')
      .upsert({
        clinic_id: staffRecord.clinic_id,
        staff_id: staffId,
        period_start: periodStart,
        period_end: periodEnd,
        total_appointments: total,
        completed_appointments: completed,
        cancelled_appointments: cancelled,
        no_show_appointments: noShow,
        total_revenue: revenue,
        average_rating: avgRating,
        total_reviews: reviews?.length || 0,
        commission_earned: commissionEarned,
        performance_score: performanceScore,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'clinic_id,staff_id,period_start,period_end' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to calculate performance' }, { status: 500 });

    return NextResponse.json({ success: true, performance });
  } catch (error) {
    console.error('Performance calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
