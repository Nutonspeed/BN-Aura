import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';
import { QUOTA_PLANS } from '@/lib/quota/quotaManager';

/**
 * GET /api/clinic/subscription
 * Get current clinic subscription details
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data: staffData } = await supabase
    .from('clinic_staff')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  if (!staffData) {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'User not associated with a clinic');
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('subscription_tier, max_sales_staff, is_active, created_at')
    .eq('id', staffData.clinic_id)
    .single();

  const { data: quota } = await supabase
    .from('clinic_quotas')
    .select('*')
    .eq('clinic_id', staffData.clinic_id)
    .single();

  const planInfo = QUOTA_PLANS.find(p => p.id === clinic?.subscription_tier);

  return createSuccessResponse({
    tier: clinic?.subscription_tier,
    isActive: clinic?.is_active,
    maxStaff: clinic?.max_sales_staff,
    createdAt: clinic?.created_at,
    quota: quota ? {
      limit: quota.monthly_quota,
      used: quota.current_usage,
      resetDate: quota.reset_date,
      overage: quota.overage
    } : null,
    planDetails: planInfo
  });
});

/**
 * POST /api/clinic/subscription/upgrade
 * Initiate a plan upgrade
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
    .eq('user_id', user.id)
    .single();

  if (!staffData || staffData.role !== 'clinic_owner') {
    return createErrorResponse(APIErrorCode.FORBIDDEN, 'Only owners can upgrade plans');
  }

  const { data, errors } = await validateRequest<{ planId: string }>(
    request,
    (body: any) => {
      const v = [];
      if (!body.planId) v.push({ field: 'planId', message: 'Required', code: 'REQUIRED' });
      return v;
    }
  );

  if (errors.length > 0) return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });

  const targetPlan = QUOTA_PLANS.find(p => p.id === data.planId);
  if (!targetPlan) return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Invalid plan ID');

  // In a real system, this would integrate with Stripe/Omise to create a checkout session
  // For this implementation, we'll simulate a successful upgrade
  
  const { error: clinicUpdate } = await supabase
    .from('clinics')
    .update({ 
      subscription_tier: data.planId,
      updated_at: new Date().toISOString()
    })
    .eq('id', staffData.clinic_id);

  if (clinicUpdate) throw clinicUpdate;

  const { error: quotaUpdate } = await supabase
    .from('clinic_quotas')
    .update({
      plan: data.planId,
      monthly_quota: targetPlan.monthlyQuota,
      overage_rate: targetPlan.scanPrice,
      features: targetPlan.features,
      updated_at: new Date().toISOString()
    })
    .eq('id', staffData.clinic_id);

  if (quotaUpdate) throw quotaUpdate;

  return createSuccessResponse({
    message: `Successfully upgraded to ${targetPlan.name}`,
    plan: targetPlan
  });
});
