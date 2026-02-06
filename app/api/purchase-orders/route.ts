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
 * GET /api/purchase-orders
 * List purchase orders for the current clinic
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data: staffData, error: staffError } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const supplierId = searchParams.get('supplierId');

  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      supplier:suppliers(id, name),
      creator:users!purchase_orders_created_by_fkey(id, full_name)
    `)
    .eq('clinic_id', staffData.clinic_id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});

/**
 * POST /api/purchase-orders
 * Create a new purchase order
 */
export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id, role')
    .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

  if (!staffData || !['clinic_owner', 'clinic_admin'].includes(staffData.role)) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Insufficient permissions');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const v = APIValidator.validateRequired(body, ['supplier_id', 'total_amount']);
      if (body.supplier_id) {
        const err = APIValidator.validateUUID(body.supplier_id, 'supplier_id');
        if (err) v.push(err);
      }
      return v;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Generate PO number
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', staffData.clinic_id);
  
  const poNumber = `PO-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${((count || 0) + 1001)}`;

  const { data: newPO, error: insertError } = await supabase
    .from('purchase_orders')
    .insert({
      ...data,
      clinic_id: staffData.clinic_id,
      po_number: poNumber,
      status: data.status || 'draft',
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(newPO);
});
