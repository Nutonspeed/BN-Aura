import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50);

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

  const [transactionsRes, redemptionsRes] = await Promise.all([
    supabase
      .from('point_transactions')
      .select('id, type, amount, description, created_at, reward_id, workflow_id')
      .eq('customer_id', customer.id)
      .eq('clinic_id', customer.clinic_id)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('loyalty_redemptions')
      .select('id, code, status, points_cost, issued_at, applied_at, reward_id, applied_pos_transaction_id')
      .eq('customer_id', customer.id)
      .eq('clinic_id', customer.clinic_id)
      .order('issued_at', { ascending: false })
      .limit(limit)
  ]);

  if (transactionsRes.error) throw transactionsRes.error;
  if (redemptionsRes.error) throw redemptionsRes.error;

  const rewardIds = Array.from(
    new Set((redemptionsRes.data || []).map((r: any) => r.reward_id).filter(Boolean))
  );

  let rewardsById: Record<string, any> = {};
  if (rewardIds.length > 0) {
    const { data: rewards, error: rewardsError } = await supabase
      .from('loyalty_rewards')
      .select('id, name, type, monetary_value')
      .eq('clinic_id', customer.clinic_id)
      .in('id', rewardIds);

    if (!rewardsError && rewards) {
      rewardsById = rewards.reduce((acc: any, r: any) => {
        acc[r.id] = r;
        return acc;
      }, {});
    }
  }

  const redemptions = (redemptionsRes.data || []).map((r: any) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    pointsCost: r.points_cost,
    issuedAt: r.issued_at,
    appliedAt: r.applied_at,
    appliedPosTransactionId: r.applied_pos_transaction_id,
    reward: rewardsById[r.reward_id] || null
  }));

  const transactions = (transactionsRes.data || []).map((t: any) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description,
    createdAt: t.created_at,
    rewardId: t.reward_id,
    workflowId: t.workflow_id
  }));

  return createSuccessResponse({
    transactions,
    redemptions
  });
});
