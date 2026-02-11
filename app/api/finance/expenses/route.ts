import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  APIValidator,
  validateRequest
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

export interface ExpenseData {
  clinic_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  payment_method?: string;
  vendor?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
}

/**
 * POST /api/finance/expenses
 * Create a new expense record
 */
export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  // Only clinic owners and managers can create expenses
  if (!['clinic_owner', 'clinic_manager'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions to create expenses');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, [
        'category', 'description', 'amount', 'expense_date'
      ]);

      if (body.amount !== undefined) {
        const err = APIValidator.validateNumber(body.amount, 'amount', { min: 0 });
        if (err) validationErrors.push(err);
      }

      const allowedCategories = [
        'supplies', 'equipment', 'marketing', 'rent', 'utilities', 'salaries',
        'insurance', 'maintenance', 'software', 'training', 'travel', 'other'
      ];
      if (body.category && !allowedCategories.includes(body.category)) {
        validationErrors.push({
          field: 'category',
          message: `Invalid category. Allowed: ${allowedCategories.join(', ')}`,
          code: 'INVALID_ENUM',
          value: body.category
        });
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  const expenseData: ExpenseData = {
    clinic_id: staffData.clinic_id,
    category: data.category,
    description: data.description,
    amount: data.amount,
    currency: data.currency || 'THB',
    expense_date: data.expense_date,
    payment_method: data.payment_method,
    vendor: data.vendor,
    receipt_url: data.receipt_url,
    metadata: data.metadata || {}
  };

  const { data: expense, error: expenseError } = await supabase
    .from('clinic_expenses')
    .insert({
      ...expenseData,
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  return createSuccessResponse(expense, {
    meta: { action: 'expense_created' }
  });
});

/**
 * GET /api/finance/expenses
 * List expenses for clinic
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
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('clinic_expenses')
    .select(`
      *,
      created_by_user:users!clinic_expenses_created_by_fkey(full_name),
      updated_by_user:users!clinic_expenses_updated_by_fkey(full_name)
    `)
    .eq('clinic_id', staffData.clinic_id)
    .order('expense_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) query = query.gte('expense_date', startDate);
  if (endDate) query = query.lte('expense_date', endDate);
  if (category) query = query.eq('category', category);

  const { data: expenses, error: expensesError, count } = await query;

  if (expensesError) throw expensesError;

  // Calculate summary
  const totalAmount = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const categoryBreakdown = expenses?.reduce((acc, exp) => {
    const cat = exp.category || 'other';
    acc[cat] = (acc[cat] || 0) + (exp.amount || 0);
    return acc;
  }, {} as Record<string, number>) || {};

  return createSuccessResponse({
    expenses: expenses || [],
    summary: {
      totalAmount,
      totalCount: count || 0,
      categoryBreakdown
    },
    pagination: {
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    }
  });
});
