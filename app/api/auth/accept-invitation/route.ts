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
    const { token, password, full_name } = body;

    if (!token || !password) {
      return NextResponse.json({ 
        error: 'Missing required fields: token, password' 
      }, { status: 400 });
    }

    // 1. Validate invitation token
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation token' 
      }, { status: 400 });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 400 });
    }

    // 2. Create auth user
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || invitation.email.split('@')[0],
        role: invitation.invited_role,
        clinic_id: invitation.clinic_id
      }
    });

    if (createAuthError) {
      console.error('Error creating auth user:', createAuthError);
      return NextResponse.json({ 
        error: `Failed to create user: ${createAuthError.message}` 
      }, { status: 400 });
    }

    const userId = authUser.user.id;
    const userName = full_name || invitation.email.split('@')[0];

    // 3. Create public.users record
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: invitation.email,
        full_name: userName,
        role: 'free_user', // Base role, actual role is in clinic_staff
        tier: 'free',
        clinic_id: invitation.clinic_id,
        is_active: true
      });

    if (usersError) {
      console.error('Error creating users record:', usersError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ 
        error: `Failed to create user profile: ${usersError.message}` 
      }, { status: 500 });
    }

    // 4. Insert clinic_staff record
    const { error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        user_id: userId,
        clinic_id: invitation.clinic_id,
        role: invitation.invited_role,
        is_active: true,
        joined_at: new Date().toISOString()
      });

    if (staffError) {
      console.error('Error creating clinic_staff record:', staffError);
      // Rollback
      await supabaseAdmin.from('users').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ 
        error: `Failed to create staff record: ${staffError.message}` 
      }, { status: 500 });
    }

    // 5. Mark invitation as accepted
    await supabaseAdmin
      .from('invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        email: invitation.email,
        role: invitation.invited_role,
        clinic_id: invitation.clinic_id
      },
      message: 'Invitation accepted successfully. You can now login.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
      }, { status: 400 });
    }

    // Validate token and return invitation details
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .select('email, invited_role, clinic_id, expires_at, status')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid invitation token' 
      }, { status: 400 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `Invitation is ${invitation.status}` 
      }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 400 });
    }

    // Get clinic name
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('display_name')
      .eq('id', invitation.clinic_id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.invited_role,
        clinic_name: clinic?.display_name?.th || clinic?.display_name?.en || 'Unknown Clinic',
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
