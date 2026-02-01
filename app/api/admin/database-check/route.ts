import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminClient = await createAdminClient();
    const authClient = await createClient();
    
    // Verify user is super admin
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    // Check required tables
    const requiredTables = [
      'users',
      'clinics',
      'clinic_users',
      'subscriptions',
      'invoices',
      'audit_logs',
      'security_events',
      'support_tickets',
      'ticket_replies',
      'announcements',
      'broadcast_messages',
      'system_settings',
      'user_roles',
      'permissions',
      'user_permissions'
    ];

    const tableStatus: any = {};
    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const { count, error } = await adminClient
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === 'PGRST116') {
            // Table doesn't exist
            missingTables.push(table);
            tableStatus[table] = { exists: false, error: 'Table does not exist' };
          } else {
            tableStatus[table] = { exists: true, error: error.message, count: 0 };
          }
        } else {
          tableStatus[table] = { exists: true, count: count || 0 };
        }
      } catch (err: any) {
        tableStatus[table] = { exists: false, error: err.message };
        missingTables.push(table);
      }
    }

    // Check RLS policies
    const rlsStatus: any = {};
    for (const table of requiredTables) {
      if (tableStatus[table]?.exists) {
        try {
          const { data: policies, error } = await adminClient
            .rpc('get_table_policies', { table_name: table });
          
          rlsStatus[table] = {
            enabled: true,
            policies: policies || [],
            error: error?.message
          };
        } catch (err: any) {
          rlsStatus[table] = {
            enabled: false,
            error: err.message
          };
        }
      }
    }

    // Check functions
    const requiredFunctions = [
      'get_auth_role',
      'get_auth_clinic_id',
      'log_audit_trail',
      'calculate_subscription_metrics',
      'get_user_permissions'
    ];

    const functionStatus: any = {};
    for (const func of requiredFunctions) {
      try {
        const { data, error } = await adminClient
          .rpc('check_function_exists', { function_name: func });
        
        functionStatus[func] = {
          exists: !error && data,
          error: error?.message
        };
      } catch (err: any) {
        functionStatus[func] = {
          exists: false,
          error: err.message
        };
      }
    }

    // Summary
    const summary = {
      totalTables: requiredTables.length,
      existingTables: requiredTables.length - missingTables.length,
      missingTables: missingTables.length,
      tablesReady: missingTables.length === 0
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        tableStatus,
        rlsStatus,
        functionStatus,
        recommendations: missingTables.length > 0 ? [
          'Create missing tables using migration files',
          'Run database setup script',
          'Check migration logs'
        ] : [
          'All required tables exist',
          'Verify RLS policies are correctly configured',
          'Test API endpoints'
        ]
      }
    });
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
