/**
 * Clinic Self-Registration API
 * POST - Register a new clinic (self-service onboarding)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinicName,
      clinicNameTh,
      address,
      phone,
      email,
      website,
      subscriptionTier = 'free',
      specialties = [],
      region = 'central',
    } = body;

    if (!clinicName) {
      return NextResponse.json({ error: 'clinicName is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if user already owns a clinic
    const { data: existing } = await adminClient
      .from('clinics')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: 'คุณมีคลินิกอยู่แล้ว กรุณาติดต่อ support หากต้องการสร้างคลินิกเพิ่ม',
        clinicId: existing.id,
      }, { status: 409 });
    }

    // Create clinic
    const { data: clinic, error: clinicError } = await adminClient
      .from('clinics')
      .insert({
        display_name: { en: clinicName, th: clinicNameTh || clinicName },
        address,
        phone,
        email: email || user.email,
        website,
        subscription_tier: subscriptionTier,
        is_active: true,
        owner_user_id: user.id,
        created_by: user.id,
        metadata: { specialties, region, onboarding_status: 'started' },
      })
      .select()
      .single();

    if (clinicError) {
      console.error('[Clinic Register] Error:', clinicError);
      return NextResponse.json({ error: 'Failed to create clinic' }, { status: 500 });
    }

    // Add owner as clinic_staff with clinic_owner role
    await adminClient.from('clinic_staff').insert({
      clinic_id: clinic.id,
      user_id: user.id,
      role: 'clinic_owner',
      is_active: true,
    });

    // Create default AI quota
    await adminClient.from('clinic_quotas').upsert({
      clinic_id: clinic.id,
      quota_type: 'ai_analysis',
      total_quota: subscriptionTier === 'enterprise' ? 10000 : subscriptionTier === 'professional' ? 1000 : 100,
      used_quota: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'clinic_id,quota_type' });

    // Update user role to clinic_owner
    await adminClient
      .from('users')
      .update({ role: 'clinic_owner', clinic_id: clinic.id })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        clinicId: clinic.id,
        clinicName: clinic.display_name,
        subscriptionTier,
        onboardingSteps: [
          { step: 1, title: 'ข้อมูลคลินิก', status: 'completed' },
          { step: 2, title: 'เพิ่มพนักงาน', status: 'pending', href: '/clinic/staff' },
          { step: 3, title: 'ตั้งค่าทรีทเมนต์', status: 'pending', href: '/clinic/treatments' },
          { step: 4, title: 'ตั้งค่าสินค้า', status: 'pending', href: '/clinic/inventory' },
          { step: 5, title: 'เชื่อมต่อ LINE/Payment', status: 'pending', href: '/clinic/settings/integrations' },
        ],
      },
    });
  } catch (error: any) {
    console.error('[Clinic Register] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
