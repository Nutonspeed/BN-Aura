import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// WARNING: This endpoint should only be enabled in development!
// It allows password resets without authentication for testing purposes.

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Not available in production'
    }, { status: 403 });
  }

  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email and new password are required'
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get user by email
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users'
      }, { status: 500 });
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Password reset successfully for ${email}`,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Bulk reset for all test users
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Not available in production'
    }, { status: 403 });
  }

  const testUsers = [
    { email: 'nuttapong161@gmail.com', role: 'Super Admin' },
    { email: 'clinicadmin2024@10minutemail.com', role: 'Clinic Admin' },
    { email: 'salesstaff3@test.com', role: 'Sales Staff 3' },
    { email: 'salesstaff4@test.com', role: 'Sales Staff 4' },
    { email: 'salesstaff5@test.com', role: 'Sales Staff 5' }
  ];

  const newPassword = 'Test1234!';
  const results = [];

  try {
    const supabase = createAdminClient();

    for (const testUser of testUsers) {
      const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
      
      if (!fetchError) {
        const user = users.find(u => u.email === testUser.email);
        
        if (user) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
          );

          results.push({
            email: testUser.email,
            role: testUser.role,
            success: !updateError,
            error: updateError?.message || null
          });
        } else {
          results.push({
            email: testUser.email,
            role: testUser.role,
            success: false,
            error: 'User not found'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Bulk password reset completed',
        password: newPassword,
        results
      }
    });

  } catch (error) {
    console.error('Bulk password reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
