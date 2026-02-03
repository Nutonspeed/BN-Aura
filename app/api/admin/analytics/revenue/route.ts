import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    
    // Verify super admin
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly, yearly

    // Get revenue data from billing_records
    let dateTrunc = 'month';
    let dateFormat = 'YYYY-MM';
    
    switch (period) {
      case 'daily':
        dateTrunc = 'day';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        dateTrunc = 'week';
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'monthly':
        dateTrunc = 'month';
        dateFormat = 'YYYY-MM';
        break;
      case 'yearly':
        dateTrunc = 'year';
        dateFormat = 'YYYY';
        break;
    }

    const { data: revenueData, error: revenueError } = await adminClient
      .rpc('get_revenue_analytics', {
        period_param: period,
        date_format: dateFormat
      });

    if (revenueError) {
      // Fallback to manual calculation if RPC doesn't exist
      const { data: billingRecords } = await adminClient
        .from('billing_records')
        .select('*')
        .eq('status', 'paid')
        .order('billing_period_start', { ascending: true });

      // Group by period
      const groupedData = billingRecords?.reduce((acc: any, record: any) => {
        const period = record.billing_period_start.substring(0, dateFormat.length);
        if (!acc[period]) {
          acc[period] = { period, revenue: 0, subscriptions: 0 };
        }
        acc[period].revenue += parseFloat(record.amount.toString());
        acc[period].subscriptions += 1;
        return acc;
      }, {});

      const revenue = Object.values(groupedData || {});
      return successResponse({ revenue });
    }

    // Calculate MRR and churn
    const { data: currentSubscriptions } = await adminClient
      .from('billing_records')
      .select('*')
      .eq('status', 'paid')
      .gte('billing_period_end', new Date().toISOString());

    const mrr = currentSubscriptions?.reduce((sum: number, record: any) => 
      sum + parseFloat(record.amount.toString()), 0) || 0;

    // Get churn data (simplified)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: churnedSubscriptions } = await adminClient
      .from('billing_records')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', thirtyDaysAgo);

    const churnRate = (currentSubscriptions?.length || 0) > 0 ? 
      (churnedSubscriptions?.length || 0) / (currentSubscriptions?.length || 0) * 100 : 0;

    return successResponse({
      revenue: revenueData || [],
      metrics: {
        mrr,
        churn_rate: churnRate,
        total_subscriptions: currentSubscriptions?.length || 0,
        churned_subscriptions: churnedSubscriptions?.length || 0
      }
    });
  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
