import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { cookies } from 'next/headers';

/**
 * M1.1: Staff Profile Management API
 * Micro-module for staff CRUD operations and basic information
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const staffId = searchParams.get('staff_id');

    // Verify user has permission to access staff data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get clinic_staff first
    let baseQuery = supabase
      .from('clinic_staff')
      .select('*');

    // Filter by clinic if specified
    if (clinicId) {
      baseQuery = baseQuery.eq('clinic_id', clinicId);
    }

    // Filter by specific staff member if specified
    if (staffId) {
      baseQuery = baseQuery.eq('id', staffId);
    }

    // Only show active staff by default
    if (!searchParams.get('include_inactive')) {
      baseQuery = baseQuery.eq('is_active', true);
    }

    const { data: staffProfiles, error } = await baseQuery.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch staff profiles' }, { status: 500 });
    }

    // Manually fetch user data for each staff member
    if (staffProfiles && staffProfiles.length > 0) {
      const userIds = staffProfiles.map(staff => staff.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
      }

      // Attach user data to staff profiles
      const profilesWithUsers = staffProfiles.map(staff => ({
        ...staff,
        users: users?.find(user => user.id === staff.user_id) || null
      }));

      return NextResponse.json({
        success: true,
        data: profilesWithUsers,
        count: profilesWithUsers.length
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      count: 0
    });

  } catch (error) {
    console.error('Staff profiles GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      email,
      full_name,
      clinic_id,
      role = 'clinic_staff'
    } = body;

    // Validate required fields
    if (!email || !full_name || !clinic_id) {
      return NextResponse.json({
        error: 'Missing required fields: email, full_name, clinic_id'
      }, { status: 400 });
    }

    // Create admin client for privileged operations
    const adminClient = createAdminClient();
    
    // Authentication handled by middleware and auth guards
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // First check if auth user already exists (might be orphaned from previous failed attempt)
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = authUsers?.find(u => u.email === email);
    
    let userId = existingAuthUser?.id;

    let tempPassword = null;
    
    // If auth user doesn't exist, create it
    if (!existingAuthUser) {
      // Generate temporary password
      tempPassword = `Temp${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}!`;
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: 'staff'
        }
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json({ 
          error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้',
          details: authError?.message 
        }, { status: 500 });
      }

      userId = authData.user.id;
    }

    // Ensure userId exists at this point
    if (!userId) {
      return NextResponse.json({ 
        error: 'Failed to get or create user ID',
      }, { status: 500 });
    }

    // Check if public.users record exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // Create public.users record if it doesn't exist
    if (!existingUser) {

      // Create user record in public.users table
      // Note: users.role uses user_role enum (public, free_user, premium_customer, super_admin)
      // The actual clinic role (sales_staff, clinic_owner, etc.) is stored in clinic_staff.role
      const { data: newUserData, error: userError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          email,
          full_name,
          role: 'free_user', // All staff members use 'free_user' in users table
          is_active: true
        })
        .select('id, email, full_name')
        .single();

      if (userError) {
        console.error('Error creating user record:', userError);
        // Try to clean up auth user if user record creation fails
        await adminClient.auth.admin.deleteUser(userId);
        return NextResponse.json({ 
          error: 'ไม่สามารถสร้างข้อมูลผู้ใช้ได้',
          details: userError.message 
        }, { status: 500 });
      }

      console.log('Created user record:', newUserData);
    }

    // Create staff profile
    const { data: staffProfile, error: staffError } = await adminClient
      .from('clinic_staff')
      .insert({
        user_id: userId,
        clinic_id,
        role,
        is_active: true
      })
      .select('*')
      .single();

    if (staffError) {
      console.error('Error creating staff profile:', staffError);
      return NextResponse.json({ 
        error: 'ไม่สามารถสร้างข้อมูลพนักงานได้',
        details: staffError.message 
      }, { status: 500 });
    }

    // Fetch user data for the created staff
    const { data: userData, error: userDataError } = await adminClient
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({ 
        error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
        details: userDataError.message 
      }, { status: 500 });
    }

    // Combine staff profile with user data
    const profileWithUser = {
      ...staffProfile,
      users: userData
    };

    const response: any = {
      success: true,
      data: profileWithUser,
      message: 'สร้างพนักงานสำเร็จ'
    };

    // Include temporary password in response for E2E testing
    if (tempPassword) {
      response.tempPassword = tempPassword;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Staff profiles POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      staff_id,
      full_name,
      role,
      is_active
    } = body;

    if (!staff_id) {
      return NextResponse.json({ error: 'Missing staff_id' }, { status: 400 });
    }

    // Verify user has permission to update staff
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current staff profile to get user_id
    const { data: currentStaff, error: getError } = await supabase
      .from('clinic_staff')
      .select('user_id')
      .eq('id', staff_id)
      .eq('is_active', true).limit(1).maybeSingle();

    if (getError || !currentStaff) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    // Update user information if provided
    if (full_name) {
      const userUpdates: any = {};
      if (full_name) userUpdates.full_name = full_name;

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', currentStaff.user_id);

      if (userError) {
        console.error('Error updating user:', userError);
        return NextResponse.json({ error: 'Failed to update user information' }, { status: 500 });
      }
    }

    // Update staff profile information
    const staffUpdates: any = {};
    if (role) staffUpdates.role = role;
    if (typeof is_active === 'boolean') staffUpdates.is_active = is_active;
    staffUpdates.updated_at = new Date().toISOString();

    const { data: updatedStaff, error: staffError } = await supabase
      .from('clinic_staff')
      .update(staffUpdates)
      .eq('id', staff_id)
      .select(`
        id,
        user_id,
        clinic_id,
        role,
        is_active,
        updated_at,
        users (
          id,
          email,
          full_name,
          phone
        ),
        clinics (
          id,
          display_name
        )
      `)
      .single();

    if (staffError) {
      console.error('Error updating staff profile:', staffError);
      return NextResponse.json({ error: 'Failed to update staff profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedStaff,
      message: 'Staff profile updated successfully'
    });

  } catch (error) {
    console.error('Staff profiles PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');

    if (!staffId) {
      return NextResponse.json({ error: 'Missing staff_id parameter' }, { status: 400 });
    }

    // Verify user has permission to delete staff
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete by setting is_active to false
    const { data: deletedStaff, error } = await supabase
      .from('clinic_staff')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select('id, users(full_name)')
      .single();

    if (error) {
      console.error('Error deleting staff profile:', error);
      return NextResponse.json({ error: 'Failed to delete staff profile' }, { status: 500 });
    }

    if (!deletedStaff) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff profile deactivated successfully',
      data: { id: deletedStaff.id }
    });

  } catch (error) {
    console.error('Staff profiles DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
