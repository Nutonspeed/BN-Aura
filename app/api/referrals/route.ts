/**
 * Referral & Affiliate System API
 * GET  - List referrals, stats, or validate a code
 * POST - Create referral code or record a referral
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

function generateReferralCode(prefix = 'REF'): string {
  return `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const code = searchParams.get('code');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    if (action === 'validate' && code) {
      // Validate referral code
      const { data: referral } = await adminClient
        .from('referrals')
        .select('id, referral_code, referrer_customer_id, referred_reward_type, referred_reward_value, status')
        .eq('clinic_id', staff.clinic_id)
        .eq('referral_code', code)
        .eq('status', 'pending')
        .maybeSingle();

      return NextResponse.json({
        success: true,
        valid: !!referral,
        data: referral || null,
      });
    }

    if (action === 'stats') {
      // Referral stats
      const { data: referrals } = await adminClient
        .from('referrals')
        .select('status, referrer_reward_value')
        .eq('clinic_id', staff.clinic_id);

      const total = referrals?.length || 0;
      const completed = referrals?.filter(r => r.status === 'completed' || r.status === 'rewarded').length || 0;
      const pending = referrals?.filter(r => r.status === 'pending').length || 0;
      const totalRewards = referrals?.filter(r => r.status === 'rewarded').reduce((s, r) => s + (r.referrer_reward_value || 0), 0) || 0;

      return NextResponse.json({
        success: true,
        data: { total, completed, pending, conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0, totalRewardsGiven: totalRewards },
      });
    }

    // Default: list referrals
    const { data: referrals } = await adminClient
      .from('referrals')
      .select('*, referrer:customers!referrals_referrer_customer_id_fkey(id, full_name), referred:customers!referrals_referred_customer_id_fkey(id, full_name)')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ success: true, data: referrals || [] });
  } catch (error) {
    console.error('[Referrals] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, referrerCustomerId, referredCustomerId, referralCode, referrerRewardType, referrerRewardValue, referredRewardType, referredRewardValue } = body;

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    if (action === 'generate') {
      // Generate a referral code for a customer
      if (!referrerCustomerId) return NextResponse.json({ error: 'referrerCustomerId required' }, { status: 400 });

      const code = generateReferralCode();

      const { data: referral, error } = await adminClient
        .from('referrals')
        .insert({
          clinic_id: staff.clinic_id,
          referrer_customer_id: referrerCustomerId,
          referral_code: code,
          referrer_reward_type: referrerRewardType || 'points',
          referrer_reward_value: referrerRewardValue || 500,
          referred_reward_type: referredRewardType || 'discount',
          referred_reward_value: referredRewardValue || 10,
          status: 'pending',
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });

      return NextResponse.json({ success: true, data: referral });
    }

    if (action === 'complete') {
      // Complete a referral (when referred customer makes first purchase)
      if (!referralCode || !referredCustomerId) {
        return NextResponse.json({ error: 'referralCode and referredCustomerId required' }, { status: 400 });
      }

      const { data: referral } = await adminClient
        .from('referrals')
        .select('*')
        .eq('clinic_id', staff.clinic_id)
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (!referral) return NextResponse.json({ error: 'Referral not found or already used' }, { status: 404 });

      // Update referral
      const { data: updated } = await adminClient
        .from('referrals')
        .update({
          referred_customer_id: referredCustomerId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', referral.id)
        .select()
        .single();

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'reward') {
      // Mark referral as rewarded
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'referral id required' }, { status: 400 });

      const { data: updated } = await adminClient
        .from('referrals')
        .update({ status: 'rewarded', rewarded_at: new Date().toISOString() })
        .eq('id', id)
        .eq('clinic_id', staff.clinic_id)
        .select()
        .single();

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Invalid action. Use: generate, complete, or reward' }, { status: 400 });
  } catch (error) {
    console.error('[Referrals] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
