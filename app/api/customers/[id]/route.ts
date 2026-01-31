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
 * GET /api/customers/[id]
 * Get customer details
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
    .from('customers')
    .select('*, skin_analyses(*), sales_commissions(*), customer_treatment_journeys(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Customer not found');
    }
    throw error;
  }

  return createSuccessResponse(data);
});

/**
 * PATCH /api/customers/[id]
 * Update customer details
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
  
  const { data: updatedCustomer, error: updateError } = await supabase
    .from('customers')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedCustomer, {
    meta: { action: 'customer_updated' }
  });
});

/**
 * DELETE /api/customers/[id]
 * Delete a customer
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
    .from('customers')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  return createSuccessResponse({ id, deleted: true }, {
    meta: { action: 'customer_deleted' }
  });
});
