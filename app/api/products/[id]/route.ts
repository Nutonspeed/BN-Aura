import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/products/[id]
 * Get product details
 */
export const GET = withErrorHandling<{ params: Promise<{ id: string }> }>(async (
  request: Request,
  { params }
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { id } = await params;
  const uuidError = APIValidator.validateUUID(id, 'id');
  if (uuidError) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Invalid ID format', { validationErrors: [uuidError] });
  }

  const { data, error } = await supabase
    .from('inventory_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Product not found');
    }
    throw error;
  }

  return createSuccessResponse(data);
});

/**
 * PATCH /api/products/[id]
 * Update product details
 */
export const PATCH = withErrorHandling<{ params: Promise<{ id: string }> }>(async (
  request: Request,
  { params }
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { id } = await params;
  const uuidError = APIValidator.validateUUID(id, 'id');
  if (uuidError) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Invalid ID format', { validationErrors: [uuidError] });
  }

  const body = await request.json();
  
  const { data: updatedProduct, error: updateError } = await supabase
    .from('inventory_products')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedProduct, {
    meta: { action: 'product_updated' }
  });
});

/**
 * DELETE /api/products/[id]
 * Delete a product
 */
export const DELETE = withErrorHandling<{ params: Promise<{ id: string }> }>(async (
  request: Request,
  { params }
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { id } = await params;
  const uuidError = APIValidator.validateUUID(id, 'id');
  if (uuidError) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Invalid ID format', { validationErrors: [uuidError] });
  }

  const { error: deleteError } = await supabase
    .from('inventory_products')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  return createSuccessResponse({ id, deleted: true }, {
    meta: { action: 'product_deleted' }
  });
});
