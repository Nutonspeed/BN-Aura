import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/clinic/settings
 * Get current clinic settings
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
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', staffData.clinic_id)
    .single();

  if (clinicError) throw clinicError;

  return createSuccessResponse(clinic);
});

/**
 * PATCH /api/clinic/settings
 * Update clinic settings
 */
export const PATCH = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  // Get clinic_id and check permissions
  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffData || !['clinic_owner', 'clinic_admin'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions to update clinic settings');
  }

  const body = await request.json();
  
  // Validating basic structure
  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };

  if (body.display_name) updateData.display_name = body.display_name;
  if (body.metadata) updateData.metadata = body.metadata;

  const { data: updatedClinic, error: updateError } = await supabase
    .from('clinics')
    .update(updateData)
    .eq('id', staffData.clinic_id)
    .select()
    .single();

  if (updateError) throw updateError;

  return createSuccessResponse(updatedClinic, {
    meta: { action: 'clinic_settings_updated' }
  });
});
