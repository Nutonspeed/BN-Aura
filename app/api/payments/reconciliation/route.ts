import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/payments/reconciliation
 * Get payment reconciliation report for clinic
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
  const status = searchParams.get('status'); // pending, completed, failed, refunded, disputed

  // Get payment transactions
  let query = supabase
    .from('payment_transactions')
    .select(`
      *,
      created_by_user:users!payment_transactions_created_by_fkey(full_name),
      updated_by_user:users!payment_transactions_updated_by_fkey(full_name)
    `)
    .eq('clinic_id', staffData.clinic_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: payments, error: paymentsError } = await query;

  if (paymentsError) throw paymentsError;

  // Calculate reconciliation summary
  const summary = {
    totalTransactions: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    completedAmount: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    failedAmount: payments
      .filter(p => p.status === 'failed')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    refundedAmount: payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.refund_amount || p.amount || 0), 0),
    disputedAmount: payments
      .filter(p => p.status === 'disputed')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    statusBreakdown: {
      pending: payments.filter(p => p.status === 'pending').length,
      completed: payments.filter(p => p.status === 'completed').length,
      failed: payments.filter(p => p.status === 'failed').length,
      refunded: payments.filter(p => p.status === 'refunded').length,
      disputed: payments.filter(p => p.status === 'disputed').length,
      cancelled: payments.filter(p => p.status === 'cancelled').length
    },
    methodBreakdown: {
      cash: payments.filter(p => p.payment_method === 'CASH').length,
      card: payments.filter(p => p.payment_method === 'CARD').length,
      promptpay: payments.filter(p => p.payment_method === 'PROMPTPAY').length,
      transfer: payments.filter(p => p.payment_method === 'TRANSFER').length,
      points: payments.filter(p => p.payment_method === 'POINTS').length
    }
  };

  // Get recent reconciliation events (notifications)
  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .eq('clinic_id', staffData.clinic_id)
    .like('type', 'reconciliation_%')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(50);

  if (notificationsError) {
    console.warn('Failed to fetch reconciliation notifications:', notificationsError);
  }

  return createSuccessResponse({
    summary,
    payments,
    reconciliationEvents: notifications || [],
    dateRange: { startDate, endDate }
  });
});
