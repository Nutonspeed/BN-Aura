/**
 * AI Business Intelligence API
 * GET - Revenue forecast, churn prediction, staff KPIs, insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    const adminClient = createAdminClient();

    // Get staff clinic
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const clinicId = staff.clinic_id;

    switch (type) {
      case 'revenue-forecast':
        return NextResponse.json({ success: true, data: await getRevenueForecast(adminClient, clinicId) });
      case 'churn-prediction':
        return NextResponse.json({ success: true, data: await getChurnPrediction(adminClient, clinicId) });
      case 'staff-kpi':
        return NextResponse.json({ success: true, data: await getStaffKPIs(adminClient, clinicId) });
      case 'overview':
      default:
        const [revenue, churn, kpis] = await Promise.all([
          getRevenueForecast(adminClient, clinicId),
          getChurnPrediction(adminClient, clinicId),
          getStaffKPIs(adminClient, clinicId),
        ]);
        return NextResponse.json({
          success: true,
          data: { revenueForecast: revenue, churnPrediction: churn, staffKPIs: kpis },
        });
    }
  } catch (error) {
    console.error('[AI BI] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getRevenueForecast(adminClient: any, clinicId: string) {
  // Get last 6 months of POS transactions
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: transactions } = await adminClient
    .from('pos_transactions')
    .select('total_amount, created_at')
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true });

  // Group by month
  const monthlyRevenue: Record<string, number> = {};
  (transactions || []).forEach((t: any) => {
    const month = new Date(t.created_at).toISOString().slice(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (t.total_amount || 0);
  });

  const months = Object.keys(monthlyRevenue).sort();
  const values = months.map(m => monthlyRevenue[m]);

  // Simple linear regression forecast
  const n = values.length;
  if (n < 2) {
    return { historical: monthlyRevenue, forecast: [], trend: 'insufficient_data', growthRate: 0 };
  }

  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
  const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Forecast next 3 months
  const forecast: Record<string, number> = {};
  for (let i = 1; i <= 3; i++) {
    const futureMonth = new Date();
    futureMonth.setMonth(futureMonth.getMonth() + i);
    const key = futureMonth.toISOString().slice(0, 7);
    forecast[key] = Math.max(0, Math.round(intercept + slope * (n + i - 1)));
  }

  const avgRevenue = sumY / n;
  const growthRate = avgRevenue > 0 ? (slope / avgRevenue) * 100 : 0;

  return {
    historical: monthlyRevenue,
    forecast,
    trend: slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable',
    growthRate: Math.round(growthRate * 10) / 10,
    avgMonthlyRevenue: Math.round(avgRevenue),
  };
}

async function getChurnPrediction(adminClient: any, clinicId: string) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Get all customers
  const { data: customers } = await adminClient
    .from('customers')
    .select('id, full_name, email, created_at')
    .eq('clinic_id', clinicId);

  if (!customers || customers.length === 0) {
    return { atRisk: [], churnRate: 0, totalCustomers: 0 };
  }

  // Get recent appointments per customer
  const { data: recentAppointments } = await adminClient
    .from('appointments')
    .select('customer_id, appointment_date')
    .eq('clinic_id', clinicId)
    .gte('appointment_date', sixMonthsAgo.toISOString().split('T')[0]);

  // Map last visit per customer
  const lastVisit: Record<string, string> = {};
  (recentAppointments || []).forEach((a: any) => {
    if (!lastVisit[a.customer_id] || a.appointment_date > lastVisit[a.customer_id]) {
      lastVisit[a.customer_id] = a.appointment_date;
    }
  });

  // Identify at-risk customers (no visit in 3+ months)
  const atRisk = customers
    .filter((c: any) => {
      const last = lastVisit[c.id];
      return !last || new Date(last) < threeMonthsAgo;
    })
    .map((c: any) => ({
      id: c.id,
      name: c.full_name,
      email: c.email,
      lastVisit: lastVisit[c.id] || null,
      riskLevel: !lastVisit[c.id] ? 'high' : 'medium',
      daysSinceVisit: lastVisit[c.id]
        ? Math.floor((Date.now() - new Date(lastVisit[c.id]).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

  return {
    atRisk: atRisk.slice(0, 20),
    churnRate: customers.length > 0 ? Math.round((atRisk.length / customers.length) * 100) : 0,
    totalCustomers: customers.length,
    activeCustomers: customers.length - atRisk.length,
    atRiskCount: atRisk.length,
  };
}

async function getStaffKPIs(adminClient: any, clinicId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get staff
  const { data: staffMembers } = await adminClient
    .from('clinic_staff')
    .select('id, user_id, role, users(full_name)')
    .eq('clinic_id', clinicId)
    .eq('is_active', true);

  if (!staffMembers || staffMembers.length === 0) {
    return { staff: [], period: '30d' };
  }

  // Get appointments per staff
  const { data: appointments } = await adminClient
    .from('appointments')
    .select('staff_id, status, created_at')
    .eq('clinic_id', clinicId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Get POS transactions per staff
  const { data: transactions } = await adminClient
    .from('pos_transactions')
    .select('staff_id, total_amount, created_at')
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const staffKPIs = staffMembers.map((s: any) => {
    const staffAppointments = (appointments || []).filter((a: any) => a.staff_id === s.id);
    const staffTransactions = (transactions || []).filter((t: any) => t.staff_id === s.id);
    const totalRevenue = staffTransactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

    return {
      id: s.id,
      name: (s.users as any)?.full_name || 'Unknown',
      role: s.role,
      appointmentsCount: staffAppointments.length,
      completedAppointments: staffAppointments.filter((a: any) => a.status === 'completed').length,
      revenue: totalRevenue,
      transactionsCount: staffTransactions.length,
      avgTransactionValue: staffTransactions.length > 0 ? Math.round(totalRevenue / staffTransactions.length) : 0,
    };
  });

  return {
    staff: staffKPIs.sort((a: any, b: any) => b.revenue - a.revenue),
    period: '30d',
    totalRevenue: staffKPIs.reduce((sum: number, s: any) => sum + s.revenue, 0),
    totalAppointments: staffKPIs.reduce((sum: number, s: any) => sum + s.appointmentsCount, 0),
  };
}
