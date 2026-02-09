import { requireAuth } from '@/lib/auth/withAuth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { sendInvitationEmail } from '@/lib/email/emailService';
import { staffInviteLimiter } from '@/lib/middleware/rateLimiter';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await staffInviteLimiter(request, '/api/staff/invite');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  try {
    // For user-specific operations, we need to verify the JWT token
    const { createClient } = await import('@/lib/supabase/client');
    const { createAdminClient } = await import('@/lib/supabase/admin');
    
    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' }, 
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info using admin client
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' }, 
        { status: 401 }
      );
    }

    // Create a regular client for database operations
    const supabase = await createClient();

    const body = await request.json();
    const { email, fullName, role } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Get user's clinic_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('clinic_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.clinic_id) {
      return NextResponse.json(
        { error: 'Unable to determine clinic association' }, 
        { status: 403 }
      );
    }

    // Check if user has permission to invite (clinic_owner or clinic_admin)
    const { data: staffRole, error: staffError } = await supabase
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('clinic_id', profile.clinic_id)
      .eq('is_active', true).limit(1).maybeSingle();

    if (staffError || !staffRole || !['clinic_owner', 'clinic_admin'].includes(staffRole.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite staff' }, 
        { status: 403 }
      );
    }

    // Check if user is already invited or exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('clinic_id', profile.clinic_id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Pending invitation already exists for this email' }, 
        { status: 409 }
      );
    }

    // Create invitation
    // Generate unique token for invitation
    const invitationToken = crypto.randomUUID();
    
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email: email.toLowerCase().trim(),
        invited_role: role,
        clinic_id: profile.clinic_id,
        token: invitationToken,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' }, 
        { status: 500 }
      );
    }

    // Get clinic information for email
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('display_name')
      .eq('id', profile.clinic_id)
      .single();

    // Get inviter's information
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Determine clinic name (with fallback)
    const clinicName = clinic?.display_name?.en || 
                      clinic?.display_name?.th || 
                      'Your Clinic';

    // Determine inviter name (with multiple fallbacks)
    const inviterName = inviterProfile?.full_name ||
                       user.user_metadata?.full_name ||
                       user.email?.split('@')[0] ||
                       'Admin';

    // Send email invitation
    try {
      await sendInvitationEmail({
        email: invitation.email,
        clinicName,
        inviterName,
        role: invitation.invited_role,
        invitationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/accept-invitation?token=${invitation.token}`,
        expiresAt: invitation.expires_at
      });
      
      console.log('✅ Invitation email sent successfully:', {
        id: invitation.id,
        email: invitation.email,
        role: invitation.invited_role
      });
    } catch (emailError) {
      console.warn('⚠️ Email sending failed, but invitation was created:', emailError);
      // Continue with success response even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.invited_role,
        status: invitation.status
      }
    });

  } catch (error) {
    console.error('Error in staff invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // For user-specific operations, we need to verify the JWT token
    const { createClient } = await import('@/lib/supabase/client');
    const { createAdminClient } = await import('@/lib/supabase/admin');
    
    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' }, 
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info using admin client
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' }, 
        { status: 401 }
      );
    }

    // Create a regular client for database operations
    const supabase = await createClient();

    // Get user's clinic_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.clinic_id) {
      return NextResponse.json(
        { error: 'Unable to determine clinic association' }, 
        { status: 403 }
      );
    }

    // Get pending invitations for the clinic
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        invited_role,
        status,
        created_at,
        expires_at,
        token
      `)
      .eq('clinic_id', profile.clinic_id)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || []
    });

  } catch (error) {
    console.error('Error in staff invite GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
