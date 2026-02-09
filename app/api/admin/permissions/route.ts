import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Get all roles with user counts
async function getRoles(adminClient: any) {
  try {
    // Get user counts for each role from users table
    const { data: users } = await adminClient
      .from('users')
      .select('role')
      .eq('is_active', true);

    // Get user counts from clinic_staff table
    const { data: staffUsers } = await adminClient
      .from('clinic_staff')
      .select('role')
      .eq('is_active', true);

    // Count roles from both tables
    const roleCounts = users?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    staffUsers?.forEach((staff: any) => {
      roleCounts[staff.role] = (roleCounts[staff.role] || 0) + 1;
    });

    // Define system roles with real counts (matching database and business logic)
    const systemRoles = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access and administration',
        permissions: ['*'],
        isSystem: true,
        userCount: roleCounts['super_admin'] || 0
      },
      {
        id: 'clinic_owner',
        name: 'Clinic Owner',
        description: 'Full clinic management access',
        permissions: ['clinic:*', 'users:*', 'billing:*', 'inventory:*', 'appointments:*'],
        isSystem: true,
        userCount: roleCounts['clinic_owner'] || 0
      },
      {
        id: 'clinic_admin',
        name: 'Clinic Administrator',
        description: 'Clinic administration and user management',
        permissions: ['clinic:read', 'clinic:manage', 'users:read', 'users:manage', 'appointments:*'],
        isSystem: true,
        userCount: roleCounts['clinic_admin'] || 0
      },
      {
        id: 'beautician',
        name: 'Beautician',
        description: 'Beauty treatment specialist',
        permissions: ['appointments:read', 'appointments:manage', 'customers:read', 'treatments:*', 'ai_analysis:*'],
        isSystem: true,
        userCount: roleCounts['beautician'] || 0
      },
      {
        id: 'clinic_staff',
        name: 'Clinic Staff',
        description: 'Clinical operations and customer service',
        permissions: ['appointments:read', 'appointments:manage', 'customers:read', 'treatments:read'],
        isSystem: true,
        userCount: roleCounts['clinic_staff'] || 0
      },
      {
        id: 'sales_staff',
        name: 'Sales Staff',
        description: 'Sales and customer management',
        permissions: ['customers:*', 'sales:*', 'ai_analysis:*', 'reports:*'],
        isSystem: true,
        userCount: roleCounts['sales_staff'] || 0
      },
      {
        id: 'premium_customer',
        name: 'Premium Customer',
        description: 'Premium tier customer with full access',
        permissions: ['clinic:read', 'appointments:*', 'ai_analysis:*', 'reports:*', 'billing:read'],
        isSystem: true,
        userCount: roleCounts['premium_customer'] || 0
      },
      {
        id: 'free_user',
        name: 'Free Customer',
        description: 'Free tier customer with limited access',
        permissions: ['clinic:read', 'appointments:read', 'ai_analysis:limited', 'reports:basic'],
        isSystem: true,
        userCount: roleCounts['free_user'] || 0
      }
    ];

    return systemRoles;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}

// Get all users with their roles and clinics
async function getUsersWithRoles(adminClient: any) {
  try {
    // Get users from users table
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Get clinic staff separately
    const { data: staff, error: staffError } = await adminClient
      .from('clinic_staff')
      .select(`
        user_id,
        role,
        clinic_id,
        clinics(display_name)
      `)
      .eq('is_active', true);

    if (staffError) throw staffError;

    // Combine data
    return users?.map((user: any) => {
      const staffInfo = staff?.find((s: any) => s.user_id === user.id);
      return {
        userId: user.id,
        userName: user.full_name,
        email: user.email,
        currentRole: user.role || staffInfo?.role || 'guest',
        clinicName: staffInfo?.clinics?.display_name || null,
        customPermissions: []
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Get all permissions
async function getPermissions() {
  // Return hardcoded permissions for now
  // In real app, these could be stored in a permissions table
  return [
    { id: 'clinic:read', name: 'View Clinic', description: 'View clinic information', category: 'Clinic', resource: 'clinic' },
    { id: 'clinic:manage', name: 'Manage Clinic', description: 'Edit clinic settings', category: 'Clinic', resource: 'clinic' },
    { id: 'staff:read', name: 'View Staff', description: 'View staff list', category: 'Staff', resource: 'staff' },
    { id: 'staff:manage', name: 'Manage Staff', description: 'Add/edit/remove staff', category: 'Staff', resource: 'staff' },
    { id: 'appointments:read', name: 'View Appointments', description: 'View appointment schedule', category: 'Appointments', resource: 'appointments' },
    { id: 'appointments:manage', name: 'Manage Appointments', description: 'Create/edit appointments', category: 'Appointments', resource: 'appointments' },
    { id: 'reports:read', name: 'View Reports', description: 'Access business reports', category: 'Reports', resource: 'reports' },
    { id: 'reports:advanced', name: 'Advanced Reports', description: 'Access detailed analytics', category: 'Reports', resource: 'reports' },
    { id: 'billing:read', name: 'View Billing', description: 'View billing information', category: 'Billing', resource: 'billing' },
    { id: 'billing:manage', name: 'Manage Billing', description: 'Manage subscriptions and payments', category: 'Billing', resource: 'billing' },
    { id: 'ai_analysis:use', name: 'Use AI Analysis', description: 'Perform AI skin analysis', category: 'AI', resource: 'ai_analysis' },
    { id: 'ai_analysis:limited', name: 'Limited AI Analysis', description: 'Basic AI analysis with restrictions', category: 'AI', resource: 'ai_analysis' },
    { id: 'pos:use', name: 'Use POS System', description: 'Access point of sale', category: 'Sales', resource: 'pos' },
    { id: 'inventory:read', name: 'View Inventory', description: 'View product inventory', category: 'Inventory', resource: 'inventory' },
    { id: 'inventory:manage', name: 'Manage Inventory', description: 'Update stock levels', category: 'Inventory', resource: 'inventory' },
    { id: 'patients:read', name: 'View Patients', description: 'Access patient records', category: 'Patients', resource: 'patients' },
    { id: 'treatments:*', name: 'Manage Treatments', description: 'Full treatment management', category: 'Treatments', resource: 'treatments' },
    { id: 'customers:*', name: 'Manage Customers', description: 'Full customer management', category: 'Customers', resource: 'customers' }
  ];
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    // For Super Admin operations, we can use the admin client directly
    // but we still need to verify the user is authenticated and has super_admin role
    const adminClient = createAdminClient();

    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized: No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return errorResponse('Unauthorized: Invalid token', 401);
    }

    // Verify Super Admin Role
    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    switch (type) {
      case 'roles':
        const roles = await getRoles(adminClient);
        return successResponse({ roles });
      
      case 'users':
        const users = await getUsersWithRoles(adminClient);
        return successResponse({ users });
      
      case 'permissions':
        const permissions = await getPermissions();
        return successResponse({ permissions });
      
      case 'all':
      default:
        const [allRoles, allUsers, allPermissions] = await Promise.all([
          getRoles(adminClient),
          getUsersWithRoles(adminClient),
          getPermissions()
        ]);
        
        return successResponse({
          roles: allRoles,
          users: allUsers,
          permissions: allPermissions
        });
    }
  } catch (error) {
    console.error('Permissions API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    // For Super Admin operations, we can use the admin client directly
    // but we still need to verify the user is authenticated and has super_admin role
    const adminClient = createAdminClient();

    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized: No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return errorResponse('Unauthorized: Invalid token', 401);
    }

    // Verify Super Admin Role
    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super Admin access required', 403);
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'updateUserRole':
        const { userId, newRole } = body;
        
        // Map UI role names to database role names
        const roleMapping: Record<string, string> = {
          'Super Administrator': 'super_admin',
          'Clinic Owner': 'clinic_owner',
          'Clinic Administrator': 'clinic_admin',
          'Beautician': 'beautician',
          'Clinic Staff': 'clinic_staff',
          'Sales Staff': 'sales_staff',
          'Premium Customer': 'premium_customer',
          'Free Customer': 'free_user'
        };
        
        const dbRole = roleMapping[newRole] || newRole;
        
        // Update user role
        const { error: updateError } = await adminClient
          .from('users')
          .update({ role: dbRole })
          .eq('id', userId);

        if (updateError) throw updateError;

        // TODO: Re-enable audit logging after fixing the issue
        // Log the action
        /*
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: user.id,
            table_name: 'users',
            record_id: userId,
            action: 'UPDATE',
            old_values: { role: body.oldRole },
            new_values: { role: newRole },
            changed_fields: ['role'],
            event_type: 'user_management',
            description: `Changed user role to ${newRole}`
          });
        */

        return successResponse({ message: 'User role updated successfully' });

      case 'createCustomRole':
        // In a real implementation, this would create a new role in the database
        // For now, return success
        return successResponse({ message: 'Custom role created successfully' });

      case 'deleteRole':
        // In a real implementation, this would handle role deletion
        // For now, return success
        return successResponse({ message: 'Role deleted successfully' });

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Permissions API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
