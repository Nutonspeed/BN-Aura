import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify Super Admin access
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminData || adminData.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, fullName, role, tier } = body;

    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json({
        error: 'Missing required fields: email, fullName'
      }, { status: 400 });
    }

    // Create admin client for privileged operations
    const adminClient = createAdminClient();

    // Generate temporary password
    const tempPassword = `Admin${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}!`;
    
    console.log(`🔐 Creating user: ${email} with role: ${role}`);

    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json({ 
        error: 'Failed to create authentication user',
        details: authError?.message 
      }, { status: 500 });
    }

    const userId = authData.user.id;

    // Step 2: Create public.users record
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: role || 'free_user',
        tier: tier || 'free',
        is_active: true
      })
      .select('*')
      .single();

    if (userError) {
      console.error('User record creation error:', userError);
      // Cleanup: Delete auth user if user record creation fails
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ 
        error: 'Failed to create user record',
        details: userError.message 
      }, { status: 500 });
    }

    console.log(`✅ User created successfully: ${email}`);

    return NextResponse.json({
      success: true,
      data: userData,
      tempPassword: tempPassword,
      message: `User "${fullName}" created successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Super Admin create user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
