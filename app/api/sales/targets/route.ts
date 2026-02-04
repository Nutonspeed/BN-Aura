import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/sales/targets
 * Get sales targets for the current staff member or clinic
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || user.id;
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  // Get staff data from database
  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  
  // If no staff data, return empty target (user might be new)
  if (!staffData) {
    return createSuccessResponse({
      target: { target_amount: 0, period_month: month, period_year: year },
      actualSales: 0,
      progress: 0
    });
  }

  // If asking for someone else's target, must be admin/owner
  if (userId !== user.id && !['clinic_owner', 'clinic_admin'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions');
  }

  const { data: target, error } = await supabase
    .from('sales_targets')
    .select('*')
    .eq('user_id', userId)
    .eq('period_month', month)
    .eq('period_year', year)
    .maybeSingle();

  if (error) throw error;

  // Calculate actual progress for the period
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data: commissions } = await supabase
    .from('sales_commissions')
    .select('base_amount')
    .eq('sales_staff_id', userId)
    .eq('payment_status', 'paid')
    .gte('transaction_date', startOfMonth)
    .lte('transaction_date', endOfMonth);

  const actualSales = commissions?.reduce((acc, curr) => acc + Number(curr.base_amount), 0) || 0;

  return createSuccessResponse({
    target: target || { target_amount: 0, period_month: month, period_year: year },
    actualSales,
    progress: target?.target_amount ? (actualSales / Number(target.target_amount)) * 100 : 0
  });
});

/**
 * POST /api/sales/targets
 * Set/Update sales target (Admin/Owner only)
 */
export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (!staffData || !['clinic_owner', 'clinic_admin'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Only clinic owners or admins can set targets');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const v = APIValidator.validateRequired(body, ['userId', 'targetAmount', 'month', 'year']);
      if (body.targetAmount !== undefined) {
        const err = APIValidator.validateNumber(body.targetAmount, 'targetAmount', { min: 0 });
        if (err) v.push(err);
      }
      return v;
    }
  );

  if (errors.length > 0) return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });

  const { data: result, error: upsertError } = await supabase
    .from('sales_targets')
    .upsert({
      clinic_id: staffData.clinic_id,
      user_id: data.userId,
      target_amount: data.targetAmount,
      period_month: data.month,
      period_year: data.year,
      notes: data.notes,
      updated_by: user.id
    }, { onConflict: 'user_id, period_month, period_year' })
    .select()
    .single();

  if (upsertError) throw upsertError;

  return createSuccessResponse(result);
});
