import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      clinicId = staffData?.clinic_id;
    }

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID is required' }, { status: 400 });
    }

    const { data: quota } = await supabase
      .from('clinic_quotas')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('quota_type', 'ai_scan')
      .eq('is_active', true)
      .maybeSingle();

    const { data: clinic } = await supabase
      .from('clinics')
      .select('subscription_tier')
      .eq('id', clinicId)
      .maybeSingle();

    const monthlyQuota = quota?.quota_limit || 100;
    const currentUsage = quota?.quota_used || 0;

    return NextResponse.json({
      success: true,
      quota: {
        clinicId,
        plan: clinic?.subscription_tier || 'professional',
        monthlyQuota,
        currentUsage,
        remaining: Math.max(0, monthlyQuota - currentUsage),
        resetDate: quota?.last_reset_date
          ? new Date(new Date(quota.last_reset_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        overage: Math.max(0, currentUsage - monthlyQuota),
        overageRate: 60
      }
    });

  } catch (error) {
    console.error('Quota error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { clinicId, scanType } = body;

    if (!clinicId || !scanType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: quota } = await supabase
      .from('clinic_quotas')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('quota_type', 'ai_scan')
      .eq('is_active', true)
      .maybeSingle();

    const monthlyQuota = quota?.quota_limit || 100;
    const currentUsage = quota?.quota_used || 0;
    const remaining = Math.max(0, monthlyQuota - currentUsage);

    if (remaining <= 0) {
      return NextResponse.json({
        error: 'Cannot perform scan',
        message: '\u0e40\u0e01\u0e34\u0e19\u0e42\u0e04\u0e27\u0e15\u0e32\u0e41\u0e25\u0e49\u0e27 \u0e08\u0e30\u0e40\u0e2a\u0e35\u0e22\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22 \u0e3f60 \u0e15\u0e48\u0e2d\u0e04\u0e23\u0e31\u0e49\u0e07',
        quotaExceeded: true,
        remainingQuota: 0,
        willIncurCharge: true,
        estimatedCost: 60
      }, { status: 403 });
    }

    if (quota) {
      await supabase
        .from('clinic_quotas')
        .update({ quota_used: currentUsage + 1, updated_at: new Date().toISOString() })
        .eq('id', quota.id);
    }

    return NextResponse.json({
      success: true,
      remainingQuota: remaining - 1,
      quotaExceeded: false,
      willIncurCharge: false
    });

  } catch (error) {
    console.error('Quota POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
