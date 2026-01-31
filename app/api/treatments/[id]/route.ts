import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/treatments/[id]
 * Get treatment details
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
    .from('treatments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Treatment not found');
    }
    throw error;
  }

  return createSuccessResponse(data);
});

/**
 * PATCH /api/treatments/[id]
 * Update treatment details
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
  
  const { data: updatedTreatment, error: updateError } = await supabase
    .from('treatments')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedTreatment, {
    meta: { action: 'treatment_updated' }
  });
});

/**
 * DELETE /api/treatments/[id]
 * Delete a treatment
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
    .from('treatments')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  return createSuccessResponse({ id, deleted: true }, {
    meta: { action: 'treatment_deleted' }
  });
});
