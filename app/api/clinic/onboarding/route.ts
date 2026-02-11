/**
 * Clinic Onboarding API
 * POST - Save clinic profile, invite staff, add treatments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { profile, staff, treatments } = body;

    const adminClient = createAdminClient();

    // Get user's clinic
    const { data: staffRecord } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staffRecord) {
      return NextResponse.json({ error: 'No clinic found for user' }, { status: 404 });
    }

    const clinicId = staffRecord.clinic_id;

    // 1. Update clinic profile
    if (profile?.name) {
      await adminClient
        .from('clinics')
        .update({
          display_name: { th: profile.name, en: profile.name },
          metadata: {
            phone: profile.phone || '',
            email: profile.email || '',
            address: profile.address || '',
            openTime: profile.openTime || '09:00',
            closeTime: profile.closeTime || '20:00',
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          },
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clinicId);
    }

    // 2. Create staff invitations
    const invitedStaff: string[] = [];
    if (staff && Array.isArray(staff)) {
      for (const member of staff) {
        if (!member.name || !member.email) continue;

        // Check if invitation already exists
        const { data: existing } = await adminClient
          .from('invitations')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('email', member.email)
          .maybeSingle();

        if (!existing) {
          await adminClient.from('invitations').insert({
            clinic_id: clinicId,
            email: member.email,
            role: member.role || 'sales_staff',
            invited_by: user.id,
            status: 'pending',
            metadata: { name: member.name },
          });
          invitedStaff.push(member.email);
        }
      }
    }

    // 3. Add treatments
    const addedTreatments: string[] = [];
    if (treatments && Array.isArray(treatments)) {
      for (const treatment of treatments) {
        if (!treatment.name) continue;

        // Check if treatment exists
        const { data: existing } = await adminClient
          .from('treatments')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('name', treatment.name)
          .maybeSingle();

        if (!existing) {
          await adminClient.from('treatments').insert({
            clinic_id: clinicId,
            name: treatment.name,
            category: treatment.category || 'general',
            base_price: treatment.price || 0,
            duration_minutes: treatment.duration || 30,
            is_active: true,
          });
          addedTreatments.push(treatment.name);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        clinicId,
        profileUpdated: !!profile?.name,
        invitedStaff,
        addedTreatments,
      },
    });
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();

    const { data: staffRecord } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staffRecord) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    const { data: clinic } = await adminClient
      .from('clinics')
      .select('display_name, metadata')
      .eq('id', staffRecord.clinic_id)
      .single();

    const metadata = (clinic?.metadata || {}) as any;

    return NextResponse.json({
      success: true,
      data: {
        completed: !!metadata.onboarding_completed,
        completedAt: metadata.onboarding_completed_at || null,
        clinicName: (clinic?.display_name as any)?.th || '',
      },
    });
  } catch (error) {
    console.error('[Onboarding] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
