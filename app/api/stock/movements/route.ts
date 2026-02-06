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
 * GET /api/stock/movements
 * List stock movements for the current clinic
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
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const type = searchParams.get('type'); // IN, OUT, ADJUST, TRANSFER

  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      product:inventory_products(id, name, sku),
      creator:users!stock_movements_created_by_fkey(id, full_name)
    `)
    .eq('clinic_id', staffData.clinic_id)
    .order('created_at', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (type) {
    query = query.eq('movement_type', type);
  }

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});

/**
 * POST /api/stock/movements
 * Record a new stock movement
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
      const validationErrors = APIValidator.validateRequired(body, [
        'product_id', 
        'movement_type', 
        'quantity'
      ]);
      
      if (body.product_id) {
        const err = APIValidator.validateUUID(body.product_id, 'product_id');
        if (err) validationErrors.push(err);
      }

      if (body.quantity !== undefined) {
        const err = APIValidator.validateNumber(body.quantity, 'quantity', { integer: true });
        if (err) validationErrors.push(err);
      }

      if (body.movement_type && !['IN', 'OUT', 'ADJUST', 'TRANSFER'].includes(body.movement_type)) {
        validationErrors.push({
          field: 'movement_type',
          message: 'Invalid movement type. Must be IN, OUT, ADJUST, or TRANSFER',
          code: 'INVALID_ENUM',
          value: body.movement_type
        });
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  const { data: newMovement, error: insertError } = await supabase
    .from('stock_movements')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      created_by: user.id
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newMovement, {
    meta: { action: 'stock_movement_recorded' }
  });
});
