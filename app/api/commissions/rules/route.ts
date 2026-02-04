import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List commission rules
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');

    const adminClient = createAdminClient();

    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .single();

    const targetClinicId = clinicId || staff?.clinic_id;

    if (!targetClinicId) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const { data: rules, error } = await adminClient
      .from('commission_rules')
      .select('*')
      .eq('clinic_id', targetClinicId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Commission rules fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Commission rules API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a commission rule
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
      ruleType,
      appliesToRoles = [],
      appliesToStaffIds = [],
      appliesToServiceIds = [],
      minTransactionAmount,
      calculationType,
      percentage,
      fixedAmount,
      tieredRates,
      effectiveFrom,
      effectiveUntil,
      priority = 0
    } = body;

    if (!name || !ruleType || !calculationType) {
      return NextResponse.json(
        { error: 'name, ruleType, and calculationType are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .single();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const targetClinicId = clinicId || staff.clinic_id;

    const { data: rule, error } = await adminClient
      .from('commission_rules')
      .insert({
        clinic_id: targetClinicId,
        name,
        description,
        rule_type: ruleType,
        applies_to_roles: appliesToRoles,
        applies_to_staff_ids: appliesToStaffIds,
        applies_to_service_ids: appliesToServiceIds,
        min_transaction_amount: minTransactionAmount,
        calculation_type: calculationType,
        percentage,
        fixed_amount: fixedAmount,
        tiered_rates: tieredRates,
        effective_from: effectiveFrom || new Date().toISOString().split('T')[0],
        effective_until: effectiveUntil,
        priority,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Commission rule creation error:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Commission rule creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
