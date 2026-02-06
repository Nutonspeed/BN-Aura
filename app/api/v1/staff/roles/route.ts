import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * M1.2: Role & Permission Engine API
 * Micro-module for role assignment and permission matrix
 */

// Role definitions with permissions
const ROLE_PERMISSIONS = {
  super_admin: [
    'manage_clinics',
    'manage_global_settings',
    'view_all_analytics',
    'manage_system_users',
    'manage_subscriptions'
  ],
  clinic_owner: [
    'manage_clinic_staff',
    'manage_clinic_settings',
    'view_clinic_analytics',
    'manage_treatments',
    'manage_inventory',
    'manage_appointments'
  ],
  clinic_admin: [
    'manage_staff_schedules',
    'view_clinic_reports',
    'manage_appointments',
    'manage_customers',
    'view_inventory'
  ],
  clinic_staff: [
    'view_appointments',
    'manage_customer_treatments',
    'view_treatment_protocols',
    'update_customer_records'
  ],
  sales_staff: [
    'manage_leads',
    'create_proposals',
    'view_sales_reports',
    'manage_customer_communications',
    'view_commission_reports'
  ]
} as const;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const staffId = searchParams.get('staff_id');

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'permissions':
        // Get available permissions for roles
        return NextResponse.json({
          success: true,
          data: ROLE_PERMISSIONS
        });

      case 'staff_role':
        if (!staffId) {
          return NextResponse.json({ error: 'Missing staff_id parameter' }, { status: 400 });
        }

        // Get specific staff role and permissions
        const { data: staffRole, error: roleError } = await supabase
          .from('clinic_staff')
          .select(`
            id,
            role,
            is_active,
            users (
              id,
              email,
              full_name
            )
          `)
          .eq('id', staffId)
          .single();

        if (roleError) {
          console.error('Error fetching staff role:', roleError);
          return NextResponse.json({ error: 'Failed to fetch staff role' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: {
            staff: staffRole,
            permissions: ROLE_PERMISSIONS[staffRole.role as keyof typeof ROLE_PERMISSIONS] || []
          }
        });

      case 'role_matrix':
        // Get role assignment matrix for clinic
        const clinicId = searchParams.get('clinic_id');
        if (!clinicId) {
          return NextResponse.json({ error: 'Missing clinic_id parameter' }, { status: 400 });
        }

        const { data: staffMatrix, error: matrixError } = await supabase
          .from('clinic_staff')
          .select(`
            id,
            role,
            is_active,
            created_at,
            users (
              id,
              email,
              full_name
            )
          `)
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (matrixError) {
          console.error('Error fetching role matrix:', matrixError);
          return NextResponse.json({ error: 'Failed to fetch role matrix' }, { status: 500 });
        }

        // Add permissions to each staff member
        const matrixWithPermissions = staffMatrix.map(staff => ({
          ...staff,
          permissions: ROLE_PERMISSIONS[staff.role as keyof typeof ROLE_PERMISSIONS] || []
        }));

        return NextResponse.json({
          success: true,
          data: matrixWithPermissions
        });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Role management GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      staff_id,
      new_role,
      reason
    } = body;

    // Validate required fields
    if (!staff_id || !new_role) {
      return NextResponse.json({
        error: 'Missing required fields: staff_id, new_role'
      }, { status: 400 });
    }

    // Validate role exists
    if (!(new_role in ROLE_PERMISSIONS)) {
      return NextResponse.json({
        error: 'Invalid role specified'
      }, { status: 400 });
    }

    // Verify user has permission to update roles
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's role to check permissions
    const { data: currentUserRole } = await supabase
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    // Only clinic_owner and super_admin can change roles
    if (!currentUserRole || !['clinic_owner', 'super_admin'].includes(currentUserRole.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to change roles' }, { status: 403 });
    }

    // Get current staff info before update
    const { data: currentStaff, error: getError } = await supabase
      .from('clinic_staff')
      .select(`
        id,
        role,
        user_id,
        users (
          full_name,
          email
        )
      `)
      .eq('id', staff_id)
      .single();

    if (getError || !currentStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Update staff role
    const { data: updatedStaff, error: updateError } = await supabase
      .from('clinic_staff')
      .update({
        role: new_role,
        updated_at: new Date().toISOString()
      })
      .eq('id', staff_id)
      .select(`
        id,
        role,
        is_active,
        updated_at,
        users (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating staff role:', updateError);
      return NextResponse.json({ error: 'Failed to update staff role' }, { status: 500 });
    }

    // Log role change for audit trail
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'role_change',
        table_name: 'clinic_staff',
        record_id: staff_id,
        old_values: { role: currentStaff.role },
        new_values: { role: new_role },
        changed_by: user.id,
        reason: reason || 'Role assignment change',
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.warn('Failed to log role change:', logError);
    }

    return NextResponse.json({
      success: true,
      data: {
        staff: updatedStaff,
        old_role: currentStaff.role,
        new_role: new_role,
        permissions: ROLE_PERMISSIONS[new_role as keyof typeof ROLE_PERMISSIONS] || []
      },
      message: `Role updated from ${currentStaff.role} to ${new_role}`
    });

  } catch (error) {
    console.error('Role management PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
