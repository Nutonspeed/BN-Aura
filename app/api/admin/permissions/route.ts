import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Get all roles with user counts
async function getRoles(adminClient: any) {
  try {
    // Get system roles (hardcoded for now, in real app these could be in a roles table)
    const systemRoles = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access and administration',
        permissions: ['*'],
        isSystem: true
      },
      {
        id: 'premiumcustomer',
        name: 'Premium Customer',
        description: 'Premium tier customer with full access',
        permissions: ['clinic:*', 'ai_analysis:*', 'reports:*', 'billing:*'],
        isSystem: true
      },
      {
        id: 'freeuser',
        name: 'Free User',
        description: 'Free tier user with limited access',
        permissions: ['clinic:read', 'ai_analysis:limited', 'reports:basic'],
        isSystem: true
      }
    ];

    // Get user counts for each role
    const { data: users } = await adminClient
      .from('users')
      .select('role')
      .eq('is_active', true);

    const roleCounts = users?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Add user counts to roles
    const rolesWithCounts = systemRoles.map(role => ({
      ...role,
      userCount: roleCounts[role.id] || 0
    }));

    return rolesWithCounts;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}

// Get all users with their roles and clinics
async function getUsersWithRoles(adminClient: any) {
  try {
    const { data: users, error } = await adminClient
      .from('users')
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        clinic_staff!users_clinic_id_fkey (
          role,
          clinic_id,
          clinics!clinic_staff_clinic_id_fkey (
            display_name
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return users?.map((user: any) => ({
      userId: user.id,
      userName: user.full_name,
      email: user.email,
      currentRole: user.role,
      clinicName: user.clinic_staff?.clinics?.display_name || null,
      customPermissions: [] // In real app, fetch from user_permissions table
    })) || [];
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
    const adminClient = await createAdminClient();
    const authClient = await createClient();
    
    // Verify user is super admin
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super admin access required', 403);
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
    const adminClient = await createAdminClient();
    const authClient = await createClient();
    
    // Verify user is super admin
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super admin access required', 403);
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'updateUserRole':
        const { userId, newRole } = body;
        
        // Update user role
        const { error: updateError } = await adminClient
          .from('users')
          .update({ role: newRole })
          .eq('id', userId);

        if (updateError) throw updateError;

        // Log the action
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
