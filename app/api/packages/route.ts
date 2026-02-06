import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List service packages for a clinic
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
      .from('service_packages')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true });

    if (publicView) {
      query = query.eq('is_active', true);
    }

    const { data: packages, error } = await query;

    if (error) {
      console.error('Packages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Packages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new service package
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
      regularPrice,
      packagePrice,
      services,
      totalSessions,
      validityDays = 365,
      imageUrl,
      featured = false
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

    const { data: servicePackage, error } = await adminClient
      .from('service_packages')
      .insert({
        clinic_id: targetClinicId,
        name,
        description,
        regular_price: regularPrice,
        package_price: packagePrice,
        services,
        total_sessions: totalSessions,
        validity_days: validityDays,
        image_url: imageUrl,
        featured,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Package creation error:', error);
      return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      package: servicePackage
    });
  } catch (error) {
    console.error('Package creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
