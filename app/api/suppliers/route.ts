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
 * GET /api/suppliers
 * List suppliers for the current clinic
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
  const searchTerm = searchParams.get('q');

  let query = supabase
    .from('suppliers')
    .select('*')
    .eq('clinic_id', staffData.clinic_id)
    .order('name', { ascending: true });

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});

/**
 * POST /api/suppliers
 * Create a new supplier
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
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (!staffData || !['clinic_owner', 'clinic_admin'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const v = APIValidator.validateRequired(body, ['name']);
      if (body.email) {
        const emailErr = APIValidator.validateEmail(body.email);
        if (emailErr) v.push(emailErr);
      }
      return v;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  const { data: newSupplier, error: insertError } = await supabase
    .from('suppliers')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newSupplier);
});
