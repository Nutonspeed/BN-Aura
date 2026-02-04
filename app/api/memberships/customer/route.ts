import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Get customer's membership
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    const adminClient = createAdminClient();

    let targetCustomerId = customerId;

    // If no customer_id provided, get current user's customer record
    if (!customerId) {
      const { data: customer } = await adminClient
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      targetCustomerId = customer.id;
    }

    const { data: memberships, error } = await adminClient
      .from('customer_memberships')
      .select(`
        *,
        membership:memberships(*)
      `)
      .eq('customer_id', targetCustomerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Customer memberships fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error('Customer memberships API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Subscribe customer to a membership
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      membershipId,
      paymentMethod,
      autoRenew = true
    } = body;

    if (!customerId || !membershipId) {
      return NextResponse.json(
        { error: 'customerId and membershipId are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch membership details
    const { data: membership } = await adminClient
      .from('memberships')
      .select('*')
      .eq('id', membershipId)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check if customer already has this membership
    const { data: existing } = await adminClient
      .from('customer_memberships')
      .select('id')
      .eq('customer_id', customerId)
      .eq('membership_id', membershipId)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Customer already has this membership' },
        { status: 409 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    let endDate: Date | null = null;
    let nextBillingDate: Date | null = null;

    if (membership.validity_days) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + membership.validity_days);
    }

    if (membership.billing_period !== 'one_time') {
      nextBillingDate = new Date();
      switch (membership.billing_period) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'yearly':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }
    }

    // Create customer membership
    const { data: customerMembership, error } = await adminClient
      .from('customer_memberships')
      .insert({
        customer_id: customerId,
        membership_id: membershipId,
        clinic_id: membership.clinic_id,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0] || null,
        next_billing_date: nextBillingDate?.toISOString().split('T')[0] || null,
        payment_method: paymentMethod,
        auto_renew: autoRenew
      })
      .select()
      .single();

    if (error) {
      console.error('Customer membership creation error:', error);
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
    }

    // Award welcome points if applicable
    if (membership.welcome_points > 0) {
      await adminClient
        .from('point_transactions')
        .insert({
          customer_id: customerId,
          clinic_id: membership.clinic_id,
          points: membership.welcome_points,
          type: 'earn',
          source: 'membership_welcome',
          reference_id: customerMembership.id,
          description: `Welcome bonus for ${membership.name?.en || 'membership'}`
        });
    }

    return NextResponse.json({
      success: true,
      customerMembership
    });
  } catch (error) {
    console.error('Customer membership creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
