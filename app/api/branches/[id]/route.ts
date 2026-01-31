import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/branches/[id]
 * Get branch details
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
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Branch not found');
    }
    throw error;
  }

  return createSuccessResponse(data);
});

/**
 * PATCH /api/branches/[id]
 * Update branch details
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

  // Check permissions
  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (!staffData || !['clinic_owner', 'clinic_admin'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions');
  }

  const body = await request.json();
  
  const { data: updatedBranch, error: updateError } = await supabase
    .from('branches')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('clinic_id', staffData.clinic_id)
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedBranch);
});

/**
 * DELETE /api/branches/[id]
 * Delete a branch
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
  
  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (!staffData || staffData.role !== 'clinic_owner') {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Only owners can delete branches');
  }

  const { error: deleteError } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)
    .eq('clinic_id', staffData.clinic_id);

  if (deleteError) throw deleteError;

  return createSuccessResponse({ id, deleted: true });
});
