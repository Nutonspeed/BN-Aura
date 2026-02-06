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
 * GET /api/products
 * List products for the current clinic
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
  const category = searchParams.get('category');
  const searchTerm = searchParams.get('q');

  let query = supabase
    .from('inventory_products')
    .select('*')
    .eq('clinic_id', clinicData.clinic_id)
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});

/**
 * POST /api/products
 * Create a new product for the clinic
 */
export const POST = withErrorHandling(async (request: Request) => {
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

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, ['name', 'cost_price', 'sale_price']);
      
      if (body.cost_price !== undefined) {
        const err = APIValidator.validateNumber(body.cost_price, 'cost_price', { min: 0 });
        if (err) validationErrors.push(err);
      }

      if (body.sale_price !== undefined) {
        const err = APIValidator.validateNumber(body.sale_price, 'sale_price', { min: 0 });
        if (err) validationErrors.push(err);
      }

      if (body.stock_quantity !== undefined) {
        const err = APIValidator.validateNumber(body.stock_quantity, 'stock_quantity', { integer: true });
        if (err) validationErrors.push(err);
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  const { data: newProduct, error: insertError } = await supabase
    .from('inventory_products')
    .insert({
      ...data,
      clinic_id: clinicData.clinic_id
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newProduct, {
    meta: { action: 'product_created' }
  });
});
