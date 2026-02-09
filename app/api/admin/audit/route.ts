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

async function getAuditLogs(adminClient: any, filters: any = {}) {
  try {
    let query = adminClient
      .from('audit_logs')
      .select('*');

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name);
    }
    
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    // Order by timestamp descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match expected format
    const transformedLogs = data?.map((log: any) => ({
      id: log?.id || '',
      timestamp: log?.created_at || new Date().toISOString(),
      user_name: 'System', // Default to System if no user join
      user_email: 'system@bnaura.com',
      action: log?.action || 'UNKNOWN',
      table_name: log?.table_name || 'Unknown',
      resource_name: getResourceName(log),
      success: !log?.description?.includes('Failed') && !log?.description?.includes('Error'),
      ip_address: log?.ip_address || 'Unknown',
      event_type: log?.event_type || 'Unknown',
      description: log?.description || '',
      old_values: log?.old_values || null,
      new_values: log?.new_values || null,
      changed_fields: log?.changed_fields || null
    })) || [];

    return transformedLogs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

function getResourceName(log: any): string {
  try {
    // Try to extract resource name from description or values
    if (log?.description) {
      // Look for patterns like "User John Doe" or "Clinic Test Clinic"
      const userMatch = log.description.match(/(?:User|user)\s+([^\s,]+)/i);
      if (userMatch) return userMatch[1];
      
      const clinicMatch = log.description.match(/(?:Clinic|clinic)\s+([^\s,]+)/i);
      if (clinicMatch) return clinicMatch[1];
    }
  
    // Check new_values for resource info
    if (log?.new_values && typeof log.new_values === 'object') {
      if (log.new_values.full_name) return log.new_values.full_name;
      if (log.new_values.display_name) return log.new_values.display_name;
      if (log.new_values.name) return log.new_values.name;
      if (log.new_values.email) return log.new_values.email;
    }
  
    // Fallback to table name
    return log?.table_name || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

async function getAuditStats(adminClient: any, filters: any = {}) {
  try {
    let query = adminClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Apply same filters as logs
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { count: totalCount } = await query;

    // Get successful and failed counts
    const { count: successCount } = await adminClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .not('description', 'ilike', '%Failed%')
      .not('description', 'ilike', '%Error%')
      .gte('created_at', filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filters.dateTo || new Date().toISOString());

    const failedCount = (totalCount || 0) - (successCount || 0);

    // Get top actions
    const { data: topActions } = await adminClient
      .from('audit_logs')
      .select('action')
      .gte('created_at', filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filters.dateTo || new Date().toISOString());

    const actionCounts = topActions?.reduce((acc: any, item: any) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {});

    return {
      total: totalCount || 0,
      successful: successCount || 0,
      failed: failedCount,
      topActions: Object.entries(actionCounts || {})
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }))
    };
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    throw error;
  }
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
    const type = searchParams.get('type') || 'logs';
    
    // Build filters from query params
    const filters: any = {};
    
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action');
    }
    
    if (searchParams.get('table')) {
      filters.table_name = searchParams.get('table');
    }
    
    if (searchParams.get('event_type')) {
      filters.event_type = searchParams.get('event_type');
    }
    
    if (searchParams.get('date_from')) {
      filters.dateFrom = searchParams.get('date_from');
    }
    
    if (searchParams.get('date_to')) {
      filters.dateTo = searchParams.get('date_to');
    }
    
    if (searchParams.get('user_id')) {
      filters.user_id = searchParams.get('user_id');
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }
    
    if (searchParams.get('offset')) {
      filters.offset = parseInt(searchParams.get('offset')!);
    }
    
    // Apply time range preset
    const timeRange = searchParams.get('timeRange') || '7d';
    const timeRangeMap = {
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
    
    if (!filters.dateFrom && timeRange !== 'all') {
      filters.dateFrom = timeRangeMap[timeRange as keyof typeof timeRangeMap]?.toISOString();
    }

    switch (type) {
      case 'logs':
        const logs = await getAuditLogs(adminClient, filters);
        return successResponse({ logs });
      
      case 'stats':
        const stats = await getAuditStats(adminClient, filters);
        return successResponse({ stats });
      
      default:
        return errorResponse('Invalid type parameter', 400);
    }
  } catch (error) {
    console.error('Audit API error:', error);
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

    if (action === 'export') {
      // Get all logs with filters
      const filters = body.filters || {};
      const logs = await getAuditLogs(adminClient, { ...filters, limit: 10000 });
      
      // Convert to CSV format
      const csv = [
        'Timestamp,User,Email,Action,Resource,Status,IP Address,Description',
        ...logs.map((log: any) => [
          new Date(log.timestamp).toLocaleString(),
          `"${log.user_name}"`,
          `"${log.user_email}"`,
          log.action,
          `"${log.resource_name}"`,
          log.success ? 'SUCCESS' : 'FAILED',
          log.ip_address,
          `"${log.description}"`
        ].join(','))
      ].join('\n');

      // Return CSV file
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    console.error('Audit API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
