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
