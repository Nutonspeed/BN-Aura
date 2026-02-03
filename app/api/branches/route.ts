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
 * GET /api/branches
 * List branches for the current clinic
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  
  // TODO: Temporarily skip auth check for testing
  // const { data: { user } } = await supabase.auth.getUser();
  // 
  // if (!user) {
  //   return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  // }
  
  // Use hardcoded user for testing (sales2.test@bntest.com)
  const user = { id: 'f2d3667d-7ca9-454e-b483-83dffb7e5981' };

  // TODO: Use hardcoded clinic_id for testing
  const staffData = { 
    clinic_id: 'd1e8ce74-3beb-4502-85c9-169fa0909647'
  };

  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('*')
    .eq('clinic_id', staffData.clinic_id)
    .order('branch_name', { ascending: true });

  if (branchesError) throw branchesError;

  return createSuccessResponse(branches);
});

/**
 * POST /api/branches
 * Create a new branch
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
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, ['branch_name', 'address', 'city', 'province']);
      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Generate branch code if not provided
  let branchCode = data.branch_code;
  if (!branchCode) {
    const { count } = await supabase
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id);
    
    branchCode = `BR-${(count || 0) + 101}`;
  }

  const { data: newBranch, error: insertError } = await supabase
    .from('branches')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      branch_code: branchCode,
      is_active: data.is_active ?? true
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newBranch);
});
