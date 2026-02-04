import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, phone, nickname, date_of_birth, gender, customer_type, source, notes } = await request.json();

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: authDataUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authDataUser?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authDataUser.user;

    const { data: staffData, error: staffError } = await supabase
      .from('clinic_staff')
      .select('role, clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (staffError) {
      console.error('Staff lookup error:', staffError);
      return NextResponse.json({ error: 'Failed to verify staff role' }, { status: 500 });
    }

    if (!staffData || staffData.role !== 'sales_staff') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const user_id = user.id;
    const clinic_id = staffData.clinic_id;

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate default password for customer
    const defaultPassword = 'Customer2024!';

    // Create customer with admin client (bypass RLS)
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm for customers created by staff
      user_metadata: {
        full_name: full_name,
        phone: phone || null,
        created_by: user_id,
        sales_staff_id: user_id
      }
    });

    if (createError) {
      console.error('Create customer error:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // Create user record (use adminClient to bypass RLS)
    const { error: userInsertError } = await adminClient
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        full_name: full_name,
        role: 'free_user',
        tier: 'free',
        clinic_id: clinic_id,
        metadata: {
          phone: phone || null,
          nickname: nickname || null,
          date_of_birth: date_of_birth || null,
          gender: gender || 'other',
          customer_type: customer_type || 'regular',
          source: source || 'walk_in',
          notes: notes || null,
          created_by: user_id,
          sales_staff_id: user_id,
          clinic_id: clinic_id
        }
      }, {
        onConflict: 'id'
      });

    if (userInsertError) {
      console.error('User insert error:', userInsertError);
      // Cleanup auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create customer account' },
        { status: 500 }
      );
    }

    // Create CRM customer record as source of truth for ownership
    const { error: customerInsertError } = await adminClient
      .from('customers')
      .insert({
        user_id: authData.user.id,
        clinic_id: clinic_id,
        assigned_sales_id: user_id,
        full_name: full_name,
        email,
        phone: phone || null,
        metadata: {
          nickname: nickname || null,
          date_of_birth: date_of_birth || null,
          gender: gender || 'other',
          customer_type: customer_type || 'regular',
          source: source || 'walk_in',
          notes: notes || null
        }
      });

    if (customerInsertError) {
      console.error('Customer insert error:', customerInsertError);
      // Cleanup auth user + profile record
      await adminClient.auth.admin.deleteUser(authData.user.id);
      await adminClient.from('users').delete().eq('id', authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create customer record' },
        { status: 500 }
      );
    }

    // Note: ownership is enforced via customers.assigned_sales_id (production source of truth)

    // Create lead record (use adminClient to bypass RLS)
    const { error: leadError } = await adminClient
      .from('sales_leads')
      .insert({
        name: full_name,
        email,
        phone: phone || null,
        sales_user_id: user_id,
        status: 'new',
        score: 0,
        source: source || 'direct_creation',
        clinic_id: clinic_id,
        created_at: new Date().toISOString()
      });

    if (leadError) {
      console.error('Lead creation error:', leadError);
      // Don't fail, just log - table might not exist yet
    }

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customer: {
        id: authData.user.id,
        email,
        full_name: full_name,
        role: 'free_user',
        default_password: defaultPassword
      }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: authDataUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authDataUser?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authDataUser.user;

    const { data: staffData, error: staffError } = await supabase
      .from('clinic_staff')
      .select('role, clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (staffError) {
      console.error('Staff lookup error:', staffError);
      return NextResponse.json({ error: 'Failed to verify staff role' }, { status: 500 });
    }

    if (!staffData || staffData.role !== 'sales_staff') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const user_id = user.id;
    const clinic_id = staffData.clinic_id;

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, user_id, full_name, email, phone, assigned_sales_id, created_at, metadata')
      .eq('clinic_id', clinic_id)
      .eq('assigned_sales_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch customers error:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customers: customers || [],
      total: customers?.length || 0
    });

  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
