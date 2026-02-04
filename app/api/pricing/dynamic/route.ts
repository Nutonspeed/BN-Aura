import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List dynamic pricing rules or calculate price
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const dateTime = searchParams.get('datetime');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // If calculating price for specific service/datetime
    if (serviceId && dateTime) {
      const date = new Date(dateTime);
      const dayOfWeek = date.getDay();
      const time = date.toTimeString().slice(0, 5);
      const hoursAdvance = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60));

      // Get base price
      const { data: service } = await adminClient
        .from('bookable_services')
        .select('price')
        .eq('id', serviceId)
        .single();

      if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

      let finalPrice = service.price;
      const appliedRules: string[] = [];

      // Get applicable rules
      const { data: rules } = await adminClient
        .from('dynamic_pricing_rules')
        .select('*')
        .eq('clinic_id', staff.clinic_id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      for (const rule of rules || []) {
        let applies = rule.applies_to_all || rule.service_ids?.includes(serviceId);

        if (applies && rule.day_of_week?.length) {
          applies = rule.day_of_week.includes(dayOfWeek);
        }
        if (applies && rule.time_start && rule.time_end) {
          applies = time >= rule.time_start && time <= rule.time_end;
        }
        if (applies && rule.min_advance_hours) {
          applies = hoursAdvance >= rule.min_advance_hours;
        }
        if (applies && rule.max_advance_hours) {
          applies = hoursAdvance <= rule.max_advance_hours;
        }

        if (applies) {
          switch (rule.adjustment_type) {
            case 'percentage':
              finalPrice = finalPrice * (1 + rule.adjustment_value / 100);
              break;
            case 'fixed_increase':
              finalPrice = finalPrice + rule.adjustment_value;
              break;
            case 'fixed_decrease':
              finalPrice = finalPrice - rule.adjustment_value;
              break;
            case 'fixed_price':
              finalPrice = rule.adjustment_value;
              break;
          }
          appliedRules.push(rule.name);
        }
      }

      return NextResponse.json({
        basePrice: service.price,
        finalPrice: Math.max(0, finalPrice),
        appliedRules,
        savings: service.price - finalPrice
      });
    }

    // List all rules
    const { data: rules } = await adminClient
      .from('dynamic_pricing_rules')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .order('priority', { ascending: false });

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error('Dynamic pricing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create dynamic pricing rule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      name, description, ruleType, serviceIds = [], appliesToAll = false,
      adjustmentType, adjustmentValue, dayOfWeek, timeStart, timeEnd,
      dateStart, dateEnd, minAdvanceHours, maxAdvanceHours, priority = 0
    } = body;

    if (!name || !ruleType || !adjustmentType || adjustmentValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).single();
    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: rule, error } = await adminClient
      .from('dynamic_pricing_rules')
      .insert({
        clinic_id: staff.clinic_id,
        name,
        description,
        rule_type: ruleType,
        service_ids: serviceIds,
        applies_to_all: appliesToAll,
        adjustment_type: adjustmentType,
        adjustment_value: adjustmentValue,
        day_of_week: dayOfWeek,
        time_start: timeStart,
        time_end: timeEnd,
        date_start: dateStart,
        date_end: dateEnd,
        min_advance_hours: minAdvanceHours,
        max_advance_hours: maxAdvanceHours,
        priority,
        is_active: true
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Create pricing rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
