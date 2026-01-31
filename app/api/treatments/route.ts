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
 * GET /api/treatments
 * List treatments for the current clinic
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  // Get clinic_id for the current user
  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const activeOnly = searchParams.get('activeOnly') === 'true';

  let query = supabase
    .from('treatments')
    .select('*')
    .or(`clinic_id.eq.${staffData.clinic_id},clinic_id.is.null`) // Global or clinic-specific
    .order('category', { ascending: true })
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});

/**
 * POST /api/treatments
 * Create a new treatment for the clinic
 */
export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  // Get clinic_id for the current user
  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, ['names', 'category', 'price_min']);
      
      if (body.price_min) {
        const err = APIValidator.validateNumber(body.price_min, 'price_min', { min: 0 });
        if (err) validationErrors.push(err);
      }

      if (body.price_max) {
        const err = APIValidator.validateNumber(body.price_max, 'price_max', { min: 0 });
        if (err) validationErrors.push(err);
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  const { data: newTreatment, error: insertError } = await supabase
    .from('treatments')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      is_active: data.is_active !== undefined ? data.is_active : true
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newTreatment, {
    meta: { action: 'treatment_created' }
  });
});
