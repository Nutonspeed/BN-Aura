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
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

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
      .single();

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
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email: email.toLowerCase().trim(),
        role,
        clinic_id: profile.clinic_id,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata: {
          full_name: fullName.trim(),
          invited_at: new Date().toISOString(),
          invited_by_name: user.user_metadata?.full_name || user.email
        }
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
        role: invitation.role,
        invitationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/accept-invitation?token=${invitation.invitation_token}`,
        expiresAt: invitation.expires_at
      });
      
      console.log('✅ Invitation email sent successfully:', {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role
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
        role: invitation.role,
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

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

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
        role,
        status,
        created_at,
        expires_at,
        metadata
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
