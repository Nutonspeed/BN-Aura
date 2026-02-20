import { createClient } from '@/lib/supabase/server';
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
 * GET /api/customers
 * List customers for the current clinic
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
    clinicData = await getUserClinicData(supabase, user.id);
  } catch (error) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('clinic_id', clinicData.clinic_id)
    .order('created_at', { ascending: false });

  if (searchTerm) {
    query = query.or(`full_name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return createSuccessResponse(data, {
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    },
    meta: {
      clinicId: clinicData.clinic_id,
      searchTerm
    }
  });
});

/**
 * POST /api/customers
 * Create a new customer
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
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, ['full_name']);
      
      if (body.email) {
        const emailErr = APIValidator.validateEmail(body.email);
        if (emailErr) validationErrors.push(emailErr);
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Generate customer code if not provided
  let customerCode = data.customer_code;
  if (!customerCode) {
    const { count } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id);
    
    customerCode = `CUS-${(count || 0) + 101}`;
  }

  const { data: newCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      customer_code: customerCode,
      assigned_sales_id: user.id,
      assignment_date: new Date().toISOString(),
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();

  if (insertError) {
    console.error('Customer insert error:', JSON.stringify(insertError));
    throw insertError;
  }

  return createSuccessResponse(newCustomer, {
    meta: { action: 'customer_created' }
  });
});
