import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/loyalty/points
 * Get loyalty points for a specific customer or current user
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const clinicId = searchParams.get('clinicId');

  let query = supabase
    .from('loyalty_points')
    .select('*');

  if (customerId) {
    // If admin/staff is checking for a customer
    const { data: customer } = await supabase
      .from('customers')
      .select('user_id, clinic_id')
      .eq('id', customerId)
      .single();
    
    if (!customer?.user_id) {
      return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Customer user not found');
    }
    
    query = query.eq('user_id', customer.user_id).eq('clinic_id', customer.clinic_id);
  } else {
    // Current user checking their own points
    query = query.eq('user_id', user.id);
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') throw error;

  return createSuccessResponse(data || { points: 0 });
});

/**
 * POST /api/loyalty/points/adjust
 * Add or subtract points (Staff only)
 */
export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = [];
      if (!body.customerId) validationErrors.push({ field: 'customerId', message: 'Required', code: 'REQUIRED' });
      if (body.points === undefined) validationErrors.push({ field: 'points', message: 'Required', code: 'REQUIRED' });
      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Check permissions (staff/admin)
  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  if (!staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Permissions denied');
  }

  // Get customer user_id
  const { data: customer } = await supabase
    .from('customers')
    .select('user_id')
    .eq('id', data.customerId)
    .eq('clinic_id', staffData.clinic_id)
    .single();

  if (!customer?.user_id) {
    return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Customer node not found');
  }

  // Upsert points
  const { data: currentPoints } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', customer.user_id)
    .eq('clinic_id', staffData.clinic_id)
    .single();

  const newPoints = (currentPoints?.points || 0) + data.points;

  const { data: result, error: upsertError } = await supabase
    .from('loyalty_points')
    .upsert({
      user_id: customer.user_id,
      clinic_id: staffData.clinic_id,
      points: newPoints,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, clinic_id' })
    .select()
    .single();

  if (upsertError) throw upsertError;

  return createSuccessResponse(result);
});
