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

  const getLegacyPoints = async (params: { userId: string; clinicId?: string }) => {
    let legacyQuery = supabase
      .from('loyalty_points')
      .select('points')
      .eq('user_id', params.userId);

    if (params.clinicId) {
      legacyQuery = legacyQuery.eq('clinic_id', params.clinicId);
    }

    const { data: legacyRow, error: legacyError } = await legacyQuery.single();
    if (legacyError && legacyError.code !== 'PGRST116') throw legacyError;
    return legacyRow?.points || 0;
  };

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
    
    const { data: profileRow, error: profileError } = await supabase
      .from('loyalty_profiles')
      .select('available_points')
      .eq('customer_id', customerId)
      .eq('clinic_id', customer.clinic_id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    if (profileRow) {
      return createSuccessResponse({ points: profileRow.available_points || 0 });
    }

    const legacyPoints = await getLegacyPoints({ userId: customer.user_id, clinicId: customer.clinic_id });
    return createSuccessResponse({ points: legacyPoints });
  } else {
    // Current user checking their own points
    // Prefer loyalty_profiles (new system)
    if (clinicId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, clinic_id')
        .eq('user_id', user.id)
        .eq('clinic_id', clinicId)
        .single();

      if (customer?.id) {
        const { data: profileRow, error: profileError } = await supabase
          .from('loyalty_profiles')
          .select('available_points')
          .eq('customer_id', customer.id)
          .eq('clinic_id', clinicId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (profileRow) {
          return createSuccessResponse({ points: profileRow.available_points || 0 });
        }
      }

      const legacyPoints = await getLegacyPoints({ userId: user.id, clinicId });
      return createSuccessResponse({ points: legacyPoints });
    }

    // If clinicId not specified, try newest profile of this user's customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('id, clinic_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (customer?.id && customer.clinic_id) {
      const { data: profileRow, error: profileError } = await supabase
        .from('loyalty_profiles')
        .select('available_points')
        .eq('customer_id', customer.id)
        .eq('clinic_id', customer.clinic_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (profileRow) {
        return createSuccessResponse({ points: profileRow.available_points || 0 });
      }
    }

    const legacyPoints = await getLegacyPoints({ userId: user.id });
    return createSuccessResponse({ points: legacyPoints });
  }
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

  // Get customer user_id and clinic
  const { data: customer } = await supabase
    .from('customers')
    .select('id, user_id, clinic_id')
    .eq('id', data.customerId)
    .eq('clinic_id', staffData.clinic_id)
    .single();

  if (!customer?.user_id) {
    return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Customer node not found');
  }

  // Update loyalty_profiles (new system)
  const { data: profileRow, error: profileError } = await supabase
    .from('loyalty_profiles')
    .select('available_points, total_points')
    .eq('customer_id', customer.id)
    .eq('clinic_id', staffData.clinic_id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') throw profileError;

  const currentAvailable = profileRow?.available_points || 0;
  const currentTotal = profileRow?.total_points || 0;
  const newAvailable = currentAvailable + data.points;
  const newTotal = currentTotal + Math.max(0, data.points);

  const { data: updatedProfile, error: profileUpsertError } = await supabase
    .from('loyalty_profiles')
    .upsert({
      customer_id: customer.id,
      clinic_id: staffData.clinic_id,
      available_points: newAvailable,
      total_points: newTotal,
      referral_code: (profileRow as any)?.referral_code,
      updated_at: new Date().toISOString()
    }, { onConflict: 'customer_id, clinic_id' })
    .select('*')
    .single();

  if (profileUpsertError) throw profileUpsertError;

  // Also keep legacy table in sync if it exists (compat)
  const { data: legacyRow } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', customer.user_id)
    .eq('clinic_id', staffData.clinic_id)
    .single();

  const legacyNewPoints = (legacyRow?.points || 0) + data.points;
  await supabase
    .from('loyalty_points')
    .upsert({
      user_id: customer.user_id,
      clinic_id: staffData.clinic_id,
      points: legacyNewPoints,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, clinic_id' });

  return createSuccessResponse({ points: updatedProfile.available_points || 0 });
});
