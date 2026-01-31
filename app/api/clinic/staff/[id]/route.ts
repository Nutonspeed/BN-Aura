import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * PATCH /api/clinic/staff/[id]
 * Update staff member role or status
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

  // Check if current user is owner or admin of the same clinic
  const { data: currentUserStaff } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserStaff || !['clinic_owner', 'clinic_admin'].includes(currentUserStaff.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions to manage staff');
  }

  const body = await request.json();
  const { role, is_active } = body;

  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };

  if (role) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: updatedStaff, error: updateError } = await supabase
    .from('clinic_staff')
    .update(updateData)
    .eq('id', id)
    .eq('clinic_id', currentUserStaff.clinic_id) // Ensure same clinic
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedStaff, {
    meta: { action: 'staff_updated' }
  });
});

/**
 * DELETE /api/clinic/staff/[id]
 * Remove a staff member from the clinic
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
  
  const { data: currentUserStaff } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserStaff || currentUserStaff.role !== 'clinic_owner') {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Only clinic owners can remove staff');
  }

  const { error: deleteError } = await supabase
    .from('clinic_staff')
    .delete()
    .eq('id', id)
    .eq('clinic_id', currentUserStaff.clinic_id);

  if (deleteError) throw deleteError;

  return createSuccessResponse({ id, removed: true }, {
    meta: { action: 'staff_removed' }
  });
});
