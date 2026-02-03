import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  validateRequest
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data, errors } = await validateRequest<any>(request, (body: any) => {
    const validationErrors = [];
    if (!body.rewardId) validationErrors.push({ field: 'rewardId', message: 'Required', code: 'REQUIRED' });
    return validationErrors;
  });

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  const idempotencyKey = request.headers.get('Idempotency-Key') || data.idempotencyKey;

  if (!idempotencyKey) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Missing Idempotency-Key', {
      validationErrors: [{ field: 'Idempotency-Key', message: 'Required', code: 'REQUIRED' }]
    });
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, clinic_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!customer?.id || !customer.clinic_id) {
    return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, 'Customer profile not found');
  }

  const { data: result, error } = await supabase
    .rpc('redeem_loyalty_reward', {
      p_customer_id: customer.id,
      p_clinic_id: customer.clinic_id,
      p_reward_id: data.rewardId,
      p_event_key: `redeem:${idempotencyKey}`
    });

  if (error) throw error;

  const row = Array.isArray(result) ? result[0] : result;

  if (!row?.success) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, row?.message || 'Redeem failed', {
      details: { availablePoints: row?.available_points }
    });
  }

  return createSuccessResponse({
    message: row.message,
    availablePoints: row.available_points,
    couponCode: row.coupon_code
  });
});
