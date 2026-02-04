import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Get customer's packages
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

    const { data: packages, error } = await adminClient
      .from('customer_packages')
      .select(`
        *,
        package:service_packages(*)
      `)
      .eq('customer_id', targetCustomerId)
      .in('status', ['active', 'exhausted'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Customer packages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Customer packages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Purchase a package for customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, packageId, amountPaid, orderId } = body;

    if (!customerId || !packageId) {
      return NextResponse.json(
        { error: 'customerId and packageId are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch package details
    const { data: servicePackage } = await adminClient
      .from('service_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (!servicePackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Calculate expiry date
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + servicePackage.validity_days);

    // Create customer package
    const { data: customerPackage, error } = await adminClient
      .from('customer_packages')
      .insert({
        customer_id: customerId,
        package_id: packageId,
        clinic_id: servicePackage.clinic_id,
        sessions_remaining: servicePackage.total_sessions,
        sessions_used: 0,
        status: 'active',
        purchase_date: purchaseDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        amount_paid: amountPaid || servicePackage.package_price,
        order_id: orderId
      })
      .select()
      .single();

    if (error) {
      console.error('Customer package creation error:', error);
      return NextResponse.json({ error: 'Failed to purchase package' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customerPackage
    });
  } catch (error) {
    console.error('Customer package purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
