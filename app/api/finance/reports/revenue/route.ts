import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/finance/reports/revenue
 * Get revenue reports for clinic
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
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();
  const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

  const clinicId = staffData.clinic_id;

  // Get payment transactions revenue
  const { data: payments, error: paymentsError } = await supabase
    .from('payment_transactions')
    .select('amount, payment_method, payment_date, status, currency')
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date');

  if (paymentsError) throw paymentsError;

  // Get subscription revenue (if any)
  const { data: subscriptions, error: subsError } = await supabase
    .from('clinic_subscriptions')
    .select('amount, currency, billing_cycle, created_at, status')
    .eq('clinic_id', clinicId)
    .eq('status', 'active')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (subsError) console.warn('Subscription revenue fetch error:', subsError);

  // Get expense data (if expenses table exists)
  const { data: expenses, error: expensesError } = await supabase
    .from('clinic_expenses')
    .select('amount, category, description, expense_date, currency')
    .eq('clinic_id', clinicId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date');

  if (expensesError && expensesError.code !== 'PGRST116') { // Table might not exist
    console.warn('Expenses fetch error:', expensesError);
  }

  // Calculate revenue by period
  const revenueByPeriod = calculateRevenueByPeriod(payments || [], subscriptions || [], groupBy, startDate, endDate);

  // Calculate revenue by payment method
  const revenueByMethod = calculateRevenueByMethod(payments || []);

  // Calculate total revenue metrics
  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const subscriptionRevenue = subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const netProfit = totalRevenue + subscriptionRevenue - totalExpenses;

  // Calculate growth metrics (compare with previous period)
  const previousPeriodStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime()));
  const previousPeriodEnd = new Date(startDate);

  const { data: previousPayments } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('payment_date', previousPeriodStart.toISOString())
    .lt('payment_date', previousPeriodEnd.toISOString());

  const previousRevenue = previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Expense breakdown by category
  const expensesByCategory = calculateExpensesByCategory(expenses || []);

  return createSuccessResponse({
    summary: {
      totalRevenue,
      subscriptionRevenue,
      totalExpenses,
      netProfit,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      currency: 'THB',
      period: { startDate, endDate }
    },
    revenueByPeriod,
    revenueByMethod,
    expensesByCategory,
    transactionCount: payments?.length || 0,
    averageTransactionValue: payments?.length ? totalRevenue / payments.length : 0
  });
});

/**
 * Calculate revenue grouped by time period
 */
function calculateRevenueByPeriod(payments: any[], subscriptions: any[], groupBy: string, startDate: string, endDate: string) {
  const periods: Record<string, number> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Initialize periods
  const current = new Date(start);
  while (current <= end) {
    let key = '';
    if (groupBy === 'day') {
      key = current.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(current);
      weekStart.setDate(current.getDate() - current.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = current.toISOString().split('T')[0];
    }

    periods[key] = 0;

    if (groupBy === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (groupBy === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (groupBy === 'month') {
      current.setMonth(current.getMonth() + 1);
    }
  }

  // Add payment revenue
  payments.forEach(payment => {
    const date = new Date(payment.payment_date);
    let key = '';

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (key && periods.hasOwnProperty(key)) {
      periods[key] += payment.amount || 0;
    }
  });

  // Add subscription revenue (prorated)
  subscriptions.forEach(sub => {
    const date = new Date(sub.created_at);
    let key = '';

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (key && periods.hasOwnProperty(key)) {
      periods[key] += sub.amount || 0;
    }
  });

  return Object.entries(periods).map(([period, revenue]) => ({
    period,
    revenue: Math.round(revenue * 100) / 100
  }));
}

/**
 * Calculate revenue by payment method
 */
function calculateRevenueByMethod(payments: any[]) {
  const methods: Record<string, { revenue: number; count: number }> = {};

  payments.forEach(payment => {
    const method = payment.payment_method || 'UNKNOWN';
    if (!methods[method]) {
      methods[method] = { revenue: 0, count: 0 };
    }
    methods[method].revenue += payment.amount || 0;
    methods[method].count += 1;
  });

  return Object.entries(methods).map(([method, data]) => ({
    method,
    revenue: Math.round(data.revenue * 100) / 100,
    count: data.count,
    average: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0
  }));
}

/**
 * Calculate expenses by category
 */
function calculateExpensesByCategory(expenses: any[]) {
  const categories: Record<string, number> = {};

  expenses.forEach(expense => {
    const category = expense.category || 'Other';
    categories[category] = (categories[category] || 0) + (expense.amount || 0);
  });

  return Object.entries(categories).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100
  }));
}
