import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Authenticate user
    console.log('Attempting login for email:', email);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Auth result:', { authData: authData?.user?.id, error: authError?.message });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Get user role and clinic info
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, full_name, clinic_id')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('User error:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get clinic staff info if applicable
    let staffData = null;
    if (userData.role !== 'super_admin') {
      const { data: staff, error: staffError } = await supabaseAdmin
        .from('clinic_staff')
        .select('clinic_id, role')
        .eq('user_id', authData.user.id)
        .eq('is_active', true).limit(1).maybeSingle();

      if (!staffError) {
        staffData = staff;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: userData.role,
        full_name: userData.full_name,
        clinic_id: userData.clinic_id || staffData?.clinic_id,
        staff_role: staffData?.role
      },
      session: authData.session,
      staff: staffData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
