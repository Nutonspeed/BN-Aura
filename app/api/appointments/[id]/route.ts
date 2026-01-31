import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/appointments/[id]
 * Get appointment details
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
    .from('appointments')
    .select(`
      *,
      customer:customers(id, full_name, nickname, phone),
      staff:users!appointments_staff_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Appointment not found');
    }
    throw error;
  }

  return createSuccessResponse(data);
});

/**
 * PATCH /api/appointments/[id]
 * Update appointment details
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
  
  const { data: updatedAppointment, error: updateError } = await supabase
    .from('appointments')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedAppointment, {
    meta: { action: 'appointment_updated' }
  });
});

/**
 * DELETE /api/appointments/[id]
 * Delete an appointment
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
    .from('appointments')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  return createSuccessResponse({ id, deleted: true }, {
    meta: { action: 'appointment_deleted' }
  });
});
