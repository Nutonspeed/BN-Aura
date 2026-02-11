import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/appointments
 * List appointments for the current clinic
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  console.log('Appointments API - User ID:', user.id);

  // Get clinic_id and role for the current user
  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (staffError) {
    console.error('Staff Error:', staffError);
    return createErrorResponse(APIErrorCode.FORBIDDEN, `User is not associated with a clinic: ${staffError.message}`);
  }

  if (!staffData) {
    console.error('No staff data found for user:', user.id);
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  console.log('Clinic ID:', staffData.clinic_id);
  console.log('User Role:', staffData.role);

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');

  console.log('Query params:', { date, status, customerId });

  // Choose client based on user role and data access needs
  const useAdminClient = false;
  
  // Use regular client with proper RLS policies
  const dataClient = supabase;
  console.log('Using regular client with RLS policies for role:', staffData.role);

  let query = dataClient
    .from('appointments')
    .select('*')
    .eq('clinic_id', staffData.clinic_id)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) {
    query = query.eq('appointment_date', date);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  console.log('Final query built for clinic:', staffData.clinic_id, 'using admin client:', useAdminClient);

  const { data, error } = await query;

  if (error) {
    console.error('Appointments API Error:', error);
    return createErrorResponse(APIErrorCode.INTERNAL_SERVER_ERROR, `Database error: ${error.message}`);
  }

  console.log('Appointments found:', data?.length || 0);
  console.log('Sample appointment:', data?.[0]);

  return createSuccessResponse(data);
});

/**
 * POST /api/appointments
 * Create a new appointment
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
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, [
        'customer_id', 
        'staff_id', 
        'appointment_date', 
        'start_time', 
        'appointment_type'
      ]);
      
      if (body.customer_id) {
        const err = APIValidator.validateUUID(body.customer_id, 'customer_id');
        if (err) validationErrors.push(err);
      }

      if (body.staff_id) {
        const err = APIValidator.validateUUID(body.staff_id, 'staff_id');
        if (err) validationErrors.push(err);
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Generate appointment code if not provided
  let appointmentCode = data.appointment_code;
  if (!appointmentCode) {
    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id);
    
    appointmentCode = `APT-${(count || 0) + 1001}`;
  }

  // Default end time if not provided (assume 1 hour)
  let endTime = data.end_time;
  if (!endTime && data.start_time) {
    const [hours, minutes] = data.start_time.split(':');
    const start = new Date();
    start.setHours(parseInt(hours), parseInt(minutes), 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
  }

  const { data: newAppointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      appointment_code: appointmentCode,
      end_time: endTime,
      status: data.status || 'scheduled'
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newAppointment, {
    meta: { action: 'appointment_created' }
  });
});
