import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, preferred_clinic_code } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, full_name' 
      }, { status: 400 });
    }

    // 1. Create auth user for customer
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'customer',
        self_signup: true
      }
    });

    if (createAuthError) {
      console.error('Error creating auth user:', createAuthError);
      return NextResponse.json({ 
        error: `Failed to create user: ${createAuthError.message}` 
      }, { status: 400 });
    }

    const customerId = authUser.user.id;

    // 2. Create public.users record
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .insert({
        id: customerId,
        email,
        full_name,
        role: 'free_user',
        tier: 'free',
        is_active: true
      });

    if (usersError) {
      console.error('Error creating users record:', usersError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(customerId);
      return NextResponse.json({ 
        error: `Failed to create user profile: ${usersError.message}` 
      }, { status: 500 });
    }

    // 3. Create public.customers record (without assigned sales staff initially)
    let clinicId = null;
    if (preferred_clinic_code) {
      // Try to find clinic by code
      const { data: clinicData } = await supabaseAdmin
        .from('clinics')
        .select('id')
        .eq('clinic_code', preferred_clinic_code)
        .eq('is_active', true)
        .single();
      
      if (clinicData) {
        clinicId = clinicData.id;
      }
    }

    const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;
    const { data: customerRecord, error: customersError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: customerId,
        clinic_id: clinicId,
        full_name,
        email,
        phone: phone || null,
        customer_code: customerCode,
        assigned_sales_id: null, // No sales staff assigned yet
        status: 'active',
        source: 'self_signup'
      })
      .select('id, customer_code')
      .single();

    if (customersError) {
      console.error('Error creating customer record:', customersError);
      // Rollback: delete auth user and users record
      await supabaseAdmin.from('users').delete().eq('id', customerId);
      await supabaseAdmin.auth.admin.deleteUser(customerId);
      return NextResponse.json({ 
        error: `Failed to create customer record: ${customersError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        auth_user_id: customerId,
        customer_id: customerRecord.id,
        customer_code: customerRecord.customer_code,
        email,
        full_name,
        clinic_id: clinicId
      },
      message: 'Customer signup successful. Please wait for clinic staff to assign you a sales advisor.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
