import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

// Simple in-memory cache for user clinic data (5 minutes TTL)
const userClinicCache = new Map<string, { clinic_id: string, role: string, expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUserClinicData(supabase: any, userId: string) {
  const cached = userClinicCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }

  const { data: staffData, error: staffError } = await supabase
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
 * GET /api/treatments
 * List treatments for the current clinic
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  // Get clinic_id and role for the current user (with caching)
  let clinicData;
  try {
    clinicData = await getUserClinicData(supabase, user.id);
  } catch (error) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const activeOnly = searchParams.get('activeOnly') === 'true';

  console.log('Treatments API - User Role:', clinicData.role);
  console.log('Treatments API - Clinic ID:', clinicData.clinic_id);

  // Choose client based on user role and data access needs
  const useAdminClient = false;
  
  // Use regular client with proper RLS policies
  const dataClient = supabase;
  console.log('Using regular client with RLS policies for role:', clinicData.role);
  
  let query = dataClient
    .from('treatments')
    .select('*')
    .eq('clinic_id', clinicData.clinic_id)
    .order('category', { ascending: true })
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  console.log('Final query built for clinic:', clinicData.clinic_id, 'using admin client:', useAdminClient);

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

  // Get clinic_id for the current user (handle multiple clinic_staff records)
  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

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
