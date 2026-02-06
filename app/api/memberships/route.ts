import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List memberships for a clinic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const publicView = searchParams.get('public') === 'true';

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    let query = adminClient
      .from('memberships')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true });

    if (publicView) {
      query = query.eq('is_active', true);
    }

    const { data: memberships, error } = await query;

    if (error) {
      console.error('Memberships fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error('Memberships API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new membership plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinicId,
      name,
      description,
      price,
      billingPeriod = 'monthly',
      includedServices = [],
      discountAllServices = 0,
      priorityBooking = false,
      freeConsultations = 0,
      pointsMultiplier = 1.0,
      welcomePoints = 0,
      validityDays,
      badgeColor = '#6366f1'
    } = body;

    const adminClient = createAdminClient();

    // Verify admin access
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const targetClinicId = clinicId || staff.clinic_id;

    const { data: membership, error } = await adminClient
      .from('memberships')
      .insert({
        clinic_id: targetClinicId,
        name,
        description,
        price,
        billing_period: billingPeriod,
        included_services: includedServices,
        discount_all_services: discountAllServices,
        priority_booking: priorityBooking,
        free_consultations: freeConsultations,
        points_multiplier: pointsMultiplier,
        welcome_points: welcomePoints,
        validity_days: validityDays,
        badge_color: badgeColor,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Membership creation error:', error);
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      membership
    });
  } catch (error) {
    console.error('Membership creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
