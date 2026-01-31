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
 * POST /api/pos/transactions
 * Create a new POS transaction (Sale)
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
    .single();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, [
        'customer_id', 
        'items', 
        'subtotal', 
        'total_amount'
      ]);
      
      if (!Array.isArray(body.items) || body.items.length === 0) {
        validationErrors.push({
          field: 'items',
          message: 'At least one item is required',
          code: 'REQUIRED',
          value: body.items
        });
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // 1. Generate transaction number
  const { count } = await supabase
    .from('pos_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', staffData.clinic_id);
  
  const transactionNumber = `TXN-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${((count || 0) + 1001)}`;

  // 2. Start database transaction (via RPC or manual logic if RPC not available)
  // For now, let's use manual logic since we don't have a complex transaction RPC yet.
  
  const { data: transaction, error: txnError } = await supabase
    .from('pos_transactions')
    .insert({
      clinic_id: staffData.clinic_id,
      customer_id: data.customer_id,
      transaction_number: transactionNumber,
      subtotal: data.subtotal,
      discount_amount: data.discount_amount || 0,
      tax_amount: data.tax_amount || 0,
      total_amount: data.total_amount,
      payment_status: data.payment_status || 'pending',
      notes: data.notes,
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();

  if (txnError) throw txnError;

  // 3. Insert transaction items
  const itemsToInsert = data.items.map((item: any) => ({
    transaction_id: transaction.id,
    item_type: item.item_type, // 'PRODUCT' or 'TREATMENT'
    item_id: item.item_id,
    item_name: item.item_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount || 0,
    total: item.total
  }));

  const { error: itemsError } = await supabase
    .from('pos_transaction_items')
    .insert(itemsToInsert);

  if (itemsError) {
    // Ideally rollback transaction here if it failed
    console.error('Error inserting POS items:', itemsError);
    // Delete transaction if items failed
    await supabase.from('pos_transactions').delete().eq('id', transaction.id);
    throw itemsError;
  }

  // 4. Update stock if items are products
  for (const item of data.items) {
    if (item.item_type === 'PRODUCT') {
      await supabase.from('stock_movements').insert({
        clinic_id: staffData.clinic_id,
        product_id: item.item_id,
        movement_type: 'OUT',
        quantity: item.quantity,
        reference_type: 'SALE',
        reference_id: transaction.id,
        notes: `POS Sale: ${transactionNumber}`,
        created_by: user.id
      });
    }
  }

  return createSuccessResponse(transaction, {
    meta: { action: 'transaction_created', transactionNumber }
  });
});

/**
 * GET /api/pos/transactions
 * List transactions for the current clinic
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
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User is not associated with a clinic');
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');

  let query = supabase
    .from('pos_transactions')
    .select(`
      *,
      customer:customers(id, full_name, nickname, phone),
      items:pos_transaction_items(*)
    `)
    .eq('clinic_id', staffData.clinic_id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('payment_status', status);
  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});
