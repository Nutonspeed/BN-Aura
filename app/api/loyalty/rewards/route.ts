import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

const tierRank: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5
};

export const GET = withErrorHandling(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
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

  const { data: profile } = await supabase
    .from('loyalty_profiles')
    .select('current_tier, available_points')
    .eq('customer_id', customer.id)
    .eq('clinic_id', customer.clinic_id)
    .single();

  const currentTier = (profile?.current_tier || 'bronze') as string;
  const currentRank = tierRank[currentTier] || 1;

  const { data: rewards, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('clinic_id', customer.clinic_id)
    .eq('is_active', true)
    .order('points_cost', { ascending: true });

  if (error) throw error;

  const availablePoints = profile?.available_points || 0;

  const filtered = (rewards || []).filter((r: any) => {
    if (!r.tier_requirement) return true;
    const reqRank = tierRank[r.tier_requirement] || 1;
    return currentRank >= reqRank;
  });

  return createSuccessResponse({
    availablePoints,
    currentTier,
    rewards: filtered
  });
});
