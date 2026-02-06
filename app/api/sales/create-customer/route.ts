import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get current user (must be sales staff)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is sales staff
    const { data: staffData, error: staffError } = await supabase
      .from('clinic_staff')
      .select('id, clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_active', true).limit(1).maybeSingle();

    if (staffError || !staffData || staffData.role !== 'sales_staff') {
      return NextResponse.json({ error: 'Only sales staff can create customers' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, phone, notes } = body;

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
        created_by_sales: user.id
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
        clinic_id: staffData.clinic_id,
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

    // 3. Create public.customers record with ownership binding
    const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;
    const { data: customerRecord, error: customersError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: customerId,
        clinic_id: staffData.clinic_id,
        full_name,
        email,
        phone: phone || null,
        customer_code: customerCode,
        assigned_sales_id: user.id, // CRITICAL: Bind to creating sales staff
        assignment_date: new Date().toISOString(),
        notes: notes || null,
        status: 'active',
        source: 'sales_created'
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
        assigned_sales_id: user.id,
        clinic_id: staffData.clinic_id
      },
      message: 'Customer created successfully with ownership binding'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
