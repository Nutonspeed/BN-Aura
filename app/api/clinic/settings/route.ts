import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

// Simple in-memory cache for user clinic data (5 minutes TTL)
const userClinicCache = new Map<string, { clinic_id: string, role: string, expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUserClinicData(userId: string) {
  const cached = userClinicCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }

  const adminClient = createAdminClient();
  const { data: staffData, error: staffError } = await adminClient
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (staffError || !staffData) {
    throw new Error('User is not associated with a clinic');
  }

  const clinicData = {
    clinic_id: staffData.clinic_id,
    role: staffData.role,
    expires: Date.now() + CACHE_TTL
  };
  
  userClinicCache.set(userId, clinicData);
  return clinicData;
}

/**
 * GET /api/clinic/settings
 * Get current clinic settings
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  // Get clinic_id for the current user (with caching)
  let clinicData;
  try {
    clinicData = await getUserClinicData(user.id);
  } catch (error) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const adminClient = createAdminClient();
  const { data: clinic, error: clinicError } = await adminClient
    .from('clinics')
    .select('*')
    .eq('id', clinicData.clinic_id)
    .maybeSingle();

  if (clinicError) {
    console.error('Clinic settings GET error:', clinicError);
    return createErrorResponse(APIErrorCode.INTERNAL_SERVER_ERROR, 'Failed to fetch clinic settings');
  }

  if (!clinic) {
    return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Clinic not found');
  }

  return createSuccessResponse(clinic);
});

/**
 * PATCH /api/clinic/settings
 * Update clinic settings
 */
export const PATCH = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  // Get clinic_id and check permissions (with caching)
  let clinicData;
  try {
    clinicData = await getUserClinicData(user.id);
  } catch (error) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  if (!['clinic_owner', 'clinic_admin'].includes(clinicData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions to update clinic settings');
  }

  const body = await request.json();
  
  // Validating basic structure
  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };

  if (body.display_name) updateData.display_name = body.display_name;
  if (body.metadata) updateData.metadata = body.metadata;

  const adminClient = createAdminClient();
  const { data: updatedClinic, error: updateError } = await adminClient
    .from('clinics')
    .update(updateData)
    .eq('id', clinicData.clinic_id)
    .select()
    .single();

  if (updateError) {
    console.error('Clinic settings PATCH error:', updateError);
    return createErrorResponse(APIErrorCode.INTERNAL_SERVER_ERROR, 'Failed to update clinic settings');
  }

  return createSuccessResponse(updatedClinic, {
    meta: { action: 'clinic_settings_updated' }
  });
});
