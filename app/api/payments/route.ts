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
 * POST /api/payments
 * Record a payment for a transaction
 */
export const POST = withErrorHandling(async (request: Request) => {
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

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, [
        'transaction_id',
        'amount',
        'payment_method'
      ]);
      
      if (body.amount !== undefined) {
        const err = APIValidator.validateNumber(body.amount, 'amount', { min: 0 });
        if (err) validationErrors.push(err);
      }

      const allowedMethods = ['CASH', 'CARD', 'PROMPTPAY', 'TRANSFER', 'POINTS'];
      if (body.payment_method && !allowedMethods.includes(body.payment_method)) {
        validationErrors.push({
          field: 'payment_method',
          message: `Invalid payment method. Allowed: ${allowedMethods.join(', ')}`,
          code: 'INVALID_ENUM',
          value: body.payment_method
        });
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Record payment transaction
  const { data: payment, error: paymentError } = await supabase
    .from('payment_transactions')
    .insert({
      clinic_id: staffData.clinic_id,
      transaction_type: 'POS_SALE',
      amount: data.amount,
      currency: 'THB',
      payment_method: data.payment_method,
      status: 'completed',
      payment_date: new Date().toISOString(),
      metadata: {
        pos_transaction_id: data.transaction_id,
        ...data.metadata
      },
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // 2. Award Loyalty Points (Based on Clinic Settings)
  // Get clinic settings for loyalty rate
  const { data: clinic } = await supabase
    .from('clinics')
    .select('metadata')
    .eq('id', staffData.clinic_id)
    .single();

  const loyaltyConfig = clinic?.metadata?.loyalty;
  const earnRate = loyaltyConfig?.earn_rate || 100; // Default 1 point per 100 THB
  const isAutoAward = loyaltyConfig?.auto_award !== false; // Default true

  if (isAutoAward) {
    const pointsToAward = Math.floor(data.amount / earnRate);
    if (pointsToAward > 0) {
      // Get customer's user_id from POS transaction
      const { data: txnData } = await supabase
        .from('pos_transactions')
        .select('customer_id')
        .eq('id', data.transaction_id)
        .single();

      if (txnData?.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('user_id')
          .eq('id', txnData.customer_id)
          .single();

        if (customer?.user_id) {
          // Upsert points
          const { data: currentPoints } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('user_id', customer.user_id)
            .eq('clinic_id', staffData.clinic_id)
            .single();

          await supabase
            .from('loyalty_points')
            .upsert({
              user_id: customer.user_id,
              clinic_id: staffData.clinic_id,
              points: (currentPoints?.points || 0) + pointsToAward,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, clinic_id' });
        }
      }
    }
  }

  // 3. Update POS transaction status if it's fully paid
  // (In a more complex system, we'd check the sum of all payments for this txn)
  const { error: updateError } = await supabase
    .from('pos_transactions')
    .update({ 
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', data.transaction_id);

  if (updateError) console.error('Error updating POS transaction status:', updateError);

  return createSuccessResponse(payment, {
    meta: { action: 'payment_recorded' }
  });
});

/**
 * GET /api/payments
 * List payments for the current clinic
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
  const transactionId = searchParams.get('transactionId');

  let query = supabase
    .from('payment_transactions')
    .select('*')
    .eq('clinic_id', staffData.clinic_id)
    .order('created_at', { ascending: false });

  if (transactionId) {
    query = query.filter('metadata->>pos_transaction_id', 'eq', transactionId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return createSuccessResponse(data);
});
