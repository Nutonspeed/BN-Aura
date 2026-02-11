/**
 * Subscription & Billing API
 * GET - List billing plans or current subscription
 * POST - Subscribe/upgrade/downgrade
 * PATCH - Cancel/resume subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';

    const adminClient = createAdminClient();

    // List available plans
    if (action === 'plans') {
      const { data: plans, error } = await adminClient
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, data: plans });
    }

    // Get current subscription for user's clinic
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: 'Not associated with a clinic' }, { status: 403 });
    }

    if (action === 'current') {
      const { data: subscription } = await adminClient
        .from('clinic_subscriptions')
        .select('*, billing_plans(*)')
        .eq('clinic_id', staff.clinic_id)
        .eq('status', 'active')
        .maybeSingle();

      const { data: usage } = await adminClient
        .from('clinic_quotas')
        .select('*')
        .eq('clinic_id', staff.clinic_id);

      return NextResponse.json({
        success: true,
        data: {
          subscription,
          usage: usage || [],
          clinicId: staff.clinic_id,
        }
      });
    }

    // Billing history
    if (action === 'billing') {
      const { data: records } = await adminClient
        .from('billing_records')
        .select('*')
        .eq('clinic_id', staff.clinic_id)
        .order('created_at', { ascending: false })
        .limit(50);

      return NextResponse.json({ success: true, data: records || [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Subscriptions] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle = 'monthly' } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify clinic owner
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Only clinic owners can manage subscriptions' }, { status: 403 });
    }

    // Get plan details
    const { data: plan } = await adminClient
      .from('billing_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Deactivate current subscription
    await adminClient
      .from('clinic_subscriptions')
      .update({ status: 'cancelled', updated_at: now.toISOString(), updated_by: user.id })
      .eq('clinic_id', staff.clinic_id)
      .eq('status', 'active');

    // Create new subscription
    const { data: subscription, error } = await adminClient
      .from('clinic_subscriptions')
      .insert({
        clinic_id: staff.clinic_id,
        billing_plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_date: periodEnd.toISOString(),
        auto_renewal: true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('*, billing_plans(*)')
      .single();

    if (error) throw error;

    // Create billing record
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    await adminClient.from('billing_records').insert({
      clinic_id: staff.clinic_id,
      subscription_tier: plan.plan_code,
      amount: price,
      currency: 'THB',
      status: 'pending',
      billing_period_start: now.toISOString().split('T')[0],
      billing_period_end: periodEnd.toISOString().split('T')[0],
    });

    // Update clinic subscription_tier
    await adminClient
      .from('clinics')
      .update({ subscription_tier: plan.plan_code, updated_at: now.toISOString() })
      .eq('id', staff.clinic_id);

    return NextResponse.json({ success: true, data: subscription });
  } catch (error: any) {
    console.error('[Subscriptions] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const adminClient = createAdminClient();

    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (action === 'cancel') {
      const { data, error } = await adminClient
        .from('clinic_subscriptions')
        .update({ auto_renewal: false, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('clinic_id', staff.clinic_id)
        .eq('status', 'active')
        .select()
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, data, message: 'Auto-renewal cancelled. Subscription active until period end.' });
    }

    if (action === 'resume') {
      const { data, error } = await adminClient
        .from('clinic_subscriptions')
        .update({ auto_renewal: true, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('clinic_id', staff.clinic_id)
        .eq('status', 'active')
        .select()
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, data, message: 'Auto-renewal resumed.' });
    }

    return NextResponse.json({ error: 'Invalid action. Use: cancel, resume' }, { status: 400 });
  } catch (error: any) {
    console.error('[Subscriptions] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
