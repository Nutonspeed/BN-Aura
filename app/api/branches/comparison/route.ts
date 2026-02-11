/**
 * Multi-Branch Comparison API
 * GET - Compare branch performance metrics side-by-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();

    // Get user's clinic
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Unauthorized — owner/admin only' }, { status: 403 });
    }

    // Get all branches for this clinic
    const { data: branches } = await adminClient
      .from('branches')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .eq('is_active', true)
      .order('branch_name');

    if (!branches || branches.length === 0) {
      return NextResponse.json({
        success: true,
        data: { branches: [], comparison: null, message: 'ยังไม่มีสาขา' },
      });
    }

    const branchIds = branches.map(b => b.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch transactions for this clinic (pos_transactions has no branch_id)
    const { data: transactions } = await adminClient
      .from('pos_transactions')
      .select('clinic_id, total_amount, created_at')
      .eq('clinic_id', staff.clinic_id)
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo);

    // Fetch appointments per branch
    const { data: appointments } = await adminClient
      .from('appointments')
      .select('branch_id, status, created_at')
      .in('branch_id', branchIds)
      .gte('created_at', thirtyDaysAgo);

    // Fetch staff count for this clinic (clinic_staff has no branch_id)
    const { data: branchStaff } = await adminClient
      .from('clinic_staff')
      .select('id, is_active')
      .eq('clinic_id', staff.clinic_id)
      .eq('is_active', true);

    // Build comparison data
    // pos_transactions has no branch_id, so distribute revenue proportionally
    const totalRevenue = (transactions || []).reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
    const totalTxCount = (transactions || []).length;
    const totalStaffCount = (branchStaff || []).length;
    const branchCount = branches.length;

    const comparison = branches.map((branch: any) => {
      const branchAppts = (appointments || []).filter((a: any) => a.branch_id === branch.id);
      const totalApptsAll = (appointments || []).length;
      const branchApptRatio = totalApptsAll > 0 ? branchAppts.length / totalApptsAll : 1 / branchCount;
      const revenue = Math.round(totalRevenue * branchApptRatio);
      const txCount = Math.round(totalTxCount * branchApptRatio);
      const staffCount = Math.round(totalStaffCount / branchCount);

      const completedAppts = branchAppts.filter((a: any) => a.status === 'completed').length;
      const cancelledAppts = branchAppts.filter((a: any) => a.status === 'cancelled').length;
      const totalAppts = branchAppts.length;

      return {
        branchId: branch.id,
        branchName: branch.branch_name,
        address: branch.address,
        metrics: {
          revenue,
          transactionCount: txCount,
          avgTransactionValue: txCount > 0 ? Math.round(revenue / txCount) : 0,
          appointmentCount: totalAppts,
          completedAppointments: completedAppts,
          cancelledAppointments: cancelledAppts,
          completionRate: totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0,
          staffCount: staffCount,
          revenuePerStaff: staffCount > 0 ? Math.round(revenue / staffCount) : 0,
        },
      };
    });

    // Rank branches
    const ranked = [...comparison].sort((a, b) => b.metrics.revenue - a.metrics.revenue);
    ranked.forEach((b, i) => (b as any).rank = i + 1);

    return NextResponse.json({
      success: true,
      data: {
        period: '30d',
        branches: ranked,
        totals: {
          totalRevenue: comparison.reduce((s, b) => s + b.metrics.revenue, 0),
          totalTransactions: comparison.reduce((s, b) => s + b.metrics.transactionCount, 0),
          totalAppointments: comparison.reduce((s, b) => s + b.metrics.appointmentCount, 0),
          totalStaff: comparison.reduce((s, b) => s + b.metrics.staffCount, 0),
        },
      },
    });
  } catch (error: any) {
    console.error('[Branch Comparison] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
