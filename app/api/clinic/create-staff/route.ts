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

    // Get current user (must be clinic owner or admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is clinic owner or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, clinic_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create staff
    if (userData.role !== 'clinic_owner' && userData.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only clinic owners can create staff' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, phone, role, department, notes } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, full_name, role' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['sales_staff', 'beautician', 'receptionist', 'manager'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      }, { status: 400 });
    }

    // 1. Create auth user for staff
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        department: department || null,
        created_by: user.id
      }
    });

    if (createAuthError) {
      console.error('Error creating auth user:', createAuthError);
      return NextResponse.json({ 
        error: `Failed to create user: ${createAuthError.message}` 
      }, { status: 400 });
    }

    const staffId = authUser.user.id;

    // 2. Create public.users record
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .insert({
        id: staffId,
        email,
        full_name,
        role: 'free_user', // All staff start as free_user
        tier: 'free',
        clinic_id: userData.clinic_id || userData.role === 'super_admin' ? null : userData.clinic_id,
        is_active: true
      });

    if (usersError) {
      console.error('Error creating users record:', usersError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(staffId);
      return NextResponse.json({ 
        error: `Failed to create user profile: ${usersError.message}` 
      }, { status: 500 });
    }

    // 3. Create clinic_staff record
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        user_id: staffId,
        clinic_id: userData.clinic_id || userData.role === 'super_admin' ? null : userData.clinic_id,
        role,
        department: department || null,
        phone: phone || null,
        notes: notes || null,
        is_active: true,
        hire_date: new Date().toISOString(),
        created_by: user.id
      })
      .select('id, role, department')
      .single();

    if (staffError) {
      console.error('Error creating staff record:', staffError);
      // Rollback: delete auth user and users record
      await supabaseAdmin.from('users').delete().eq('id', staffId);
      await supabaseAdmin.auth.admin.deleteUser(staffId);
      return NextResponse.json({ 
        error: `Failed to create staff record: ${staffError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        auth_user_id: staffId,
        staff_id: staffRecord.id,
        email,
        full_name,
        role: staffRecord.role,
        department: staffRecord.department,
        clinic_id: userData.clinic_id
      },
      message: 'Staff created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
