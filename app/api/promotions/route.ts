/**
 * Promotions API
 * GET  - List promotions for clinic
 * POST - Create a new promotion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = adminClient
      .from('promotions')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: promotions } = await query;

    return NextResponse.json({ success: true, data: promotions || [] });
  } catch (error) {
    console.error('[Promotions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, discountValue, minPurchase, maxDiscount, code, usageLimit, startsAt, endsAt, applicableTreatments } = body;

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    // Generate code if not provided
    const promoCode = code || `PROMO-${Date.now().toString(36).toUpperCase()}`;

    const { data: promo, error } = await adminClient
      .from('promotions')
      .insert({
        clinic_id: staff.clinic_id,
        name,
        description: description || '',
        type: type || 'percentage',
        discount_value: discountValue || 0,
        min_purchase: minPurchase || 0,
        max_discount: maxDiscount || null,
        code: promoCode,
        usage_limit: usageLimit || null,
        starts_at: startsAt || new Date().toISOString(),
        ends_at: endsAt || null,
        applicable_treatments: applicableTreatments || [],
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Promotions] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: promo });
  } catch (error) {
    console.error('[Promotions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
