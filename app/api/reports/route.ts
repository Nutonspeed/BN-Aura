import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/reports
 * Get aggregated clinic reports and revenue data
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'revenue_summary';
  const startDate = searchParams.get('startDate') || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();

  if (type === 'clinic_overview') {
    // 1. Monthly Revenue & Trend
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const { data: currentRevenueData } = await supabase
      .from('pos_transactions')
      .select('total_amount')
      .eq('clinic_id', staffData.clinic_id)
      .eq('payment_status', 'paid')
      .gte('created_at', startOfCurrentMonth);
    
    const { data: lastRevenueData } = await supabase
      .from('pos_transactions')
      .select('total_amount')
      .eq('clinic_id', staffData.clinic_id)
      .eq('payment_status', 'paid')
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth);
    
    const monthlyRevenue = currentRevenueData?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
    const lastMonthlyRevenue = lastRevenueData?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
    const revenueTrend = lastMonthlyRevenue > 0 ? ((monthlyRevenue - lastMonthlyRevenue) / lastMonthlyRevenue) * 100 : 0;

    // 2. Total Scans & Monthly Trend
    const { count: totalScans } = await supabase
      .from('skin_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id);

    const { count: currentMonthScans } = await supabase
      .from('skin_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id)
      .gte('created_at', startOfCurrentMonth);

    const { count: lastMonthScans } = await supabase
      .from('skin_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id)
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth);
    
    const scanTrend = (lastMonthScans || 0) > 0 ? (( (currentMonthScans || 0) - (lastMonthScans || 0) ) / lastMonthScans!) * 100 : 0;

    // 3. Active Customers & Trend
    const { count: activeCustomers } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id)
      .eq('status', 'active');

    // 4. Today's Appointments
    const today = new Date().toISOString().split('T')[0];
    const { count: todayAppointments } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id)
      .eq('appointment_date', today);

    return createSuccessResponse({
      monthlyRevenue,
      revenueTrend: revenueTrend.toFixed(1),
      totalScans: totalScans || 0,
      scanTrend: scanTrend.toFixed(1),
      activeCustomers: activeCustomers || 0,
      todayAppointments: todayAppointments || 0
    });
  }

  if (type === 'stock_alerts') {
    const { data: lowStock } = await supabase
      .from('inventory_products')
      .select('id, name, stock_quantity, min_stock_level')
      .eq('clinic_id', staffData.clinic_id)
      .filter('stock_quantity', 'lte', 'min_stock_level')
      .order('stock_quantity', { ascending: true })
      .limit(5);

    return createSuccessResponse(lowStock || []);
  }

  if (type === 'sales_overview') {
    // 1. New Leads
    const { count: newLeads } = await supabase
      .from('sales_leads')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id)
      .eq('status', 'new');

    // 2. Conversion Rate (Won / Total)
    const { data: leadStats } = await supabase
      .from('sales_leads')
      .select('status')
      .eq('clinic_id', staffData.clinic_id);
    
    const totalLeads = leadStats?.length || 0;
    const wonLeads = leadStats?.filter(l => l.status === 'won').length || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // 3. AI Proposals Sent
    const { count: proposalsSent } = await supabase
      .from('sales_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id);

    return createSuccessResponse({
      newLeads: newLeads || 0,
      conversionRate,
      proposalsSent: proposalsSent || 0
    });
  }

  if (type === 'beautician_overview') {
    // 1. Today's Throughput (Completed / Total)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTasks } = await supabase
      .from('customer_treatment_journeys')
      .select('journey_status')
      .eq('assigned_beautician_id', user.id)
      .gte('created_at', today);
    
    const totalCases = todayTasks?.length || 0;
    const completedCases = todayTasks?.filter(t => t.journey_status === 'completed' || t.journey_status === 'follow_up').length || 0;

    return createSuccessResponse({
      completedCases,
      totalCases,
      onDuty: true // Can be linked to a real attendance system later
    });
  }

  if (type === 'customer_overview') {
    // 1. Latest Skin Health Score
    const { data: latestAnalysis } = await supabase
      .from('skin_analyses')
      .select('overall_score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 2. Active Treatments
    const { count: activeTreatments } = await supabase
      .from('customer_treatment_journeys')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', (await supabase.from('customers').select('id').eq('user_id', user.id).single()).data?.id)
      .or('journey_status.eq.treatment_planned,journey_status.eq.in_progress');

    // 3. Next Appointment
    const { data: nextAppointment } = await supabase
      .from('appointments')
      .select('appointment_date')
      .eq('customer_id', (await supabase.from('customers').select('id').eq('user_id', user.id).single()).data?.id)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(1)
      .single();

    return createSuccessResponse({
      skinScore: latestAnalysis?.overall_score || 0,
      activeTreatments: activeTreatments || 0,
      nextSessionDate: nextAppointment?.appointment_date || null
    });
  }

  if (type === 'revenue_summary') {
    // Aggregated revenue over time
    const { data, error } = await supabase
      .from('pos_transactions')
      .select('created_at, total_amount, payment_status')
      .eq('clinic_id', staffData.clinic_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('payment_status', 'paid');

    if (error) throw error;

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    data.forEach(txn => {
      const date = new Date(txn.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(txn.total_amount);
    });

    const chartData = Object.entries(dailyRevenue)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return createSuccessResponse({
      chartData,
      totalRevenue: data.reduce((acc, curr) => acc + Number(curr.total_amount), 0),
      transactionCount: data.length
    });
  }

  if (type === 'top_treatments') {
    const { data, error } = await supabase
      .from('pos_transaction_items')
      .select(`
        item_name,
        total,
        quantity,
        transaction:pos_transactions!inner(clinic_id, created_at, payment_status)
      `)
      .eq('transaction.clinic_id', staffData.clinic_id)
      .eq('item_type', 'TREATMENT')
      .eq('transaction.payment_status', 'paid')
      .gte('transaction.created_at', startDate)
      .lte('transaction.created_at', endDate);

    if (error) throw error;

    const treatmentStats: Record<string, { name: string, count: number, revenue: number }> = {};
    data.forEach(item => {
      if (!treatmentStats[item.item_name]) {
        treatmentStats[item.item_name] = { name: item.item_name, count: 0, revenue: 0 };
      }
      treatmentStats[item.item_name].count += item.quantity;
      treatmentStats[item.item_name].revenue += Number(item.total);
    });

    return createSuccessResponse(Object.values(treatmentStats).sort((a, b) => b.revenue - a.revenue));
  }

  if (type === 'staff_performance') {
    const { data, error } = await supabase
      .from('pos_transactions')
      .select(`
        total_amount,
        creator:users!pos_transactions_created_by_fkey(id, full_name)
      `)
      .eq('clinic_id', staffData.clinic_id)
      .eq('payment_status', 'paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    const staffStats: Record<string, { name: string, sales: number, count: number }> = {};
    data.forEach((txn: any) => {
      const staffName = txn.creator?.full_name || 'System';
      if (!staffStats[staffName]) {
        staffStats[staffName] = { name: staffName, sales: 0, count: 0 };
      }
      staffStats[staffName].sales += Number(txn.total_amount);
      staffStats[staffName].count += 1;
    });

    return createSuccessResponse(Object.values(staffStats).sort((a, b) => b.sales - a.sales));
  }

  return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Invalid report type');
});
