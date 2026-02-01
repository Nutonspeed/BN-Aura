import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Mock system metrics data (in production, get from actual monitoring system)
async function getSystemMetrics() {
  const now = new Date();
  const metrics = [];
  
  // Generate last 24 hours of data (5-minute intervals)
  for (let i = 0; i < 288; i++) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);
    metrics.push({
      timestamp: timestamp.toISOString(),
      cpu: Math.random() * 30 + 30 + Math.sin(i / 24) * 20, // 30-80% with pattern
      memory: Math.random() * 20 + 50 + Math.cos(i / 12) * 15, // 50-85% with pattern
      disk: 65 + Math.random() * 10, // 65-75%
      network_in: Math.random() * 1000000, // bytes
      network_out: Math.random() * 1000000, // bytes
      active_connections: Math.floor(Math.random() * 100 + 100),
      response_time: Math.random() * 200 + 100, // 100-300ms
      error_rate: Math.random() * 0.5 // 0-0.5%
    });
  }
  
  return metrics.reverse(); // Most recent first
}

// Mock system alerts
async function getSystemAlerts() {
  return [
    {
      id: '1',
      type: 'warning' as const,
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 80% for the last 10 minutes',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      resolved: false,
      severity: 'medium' as const
    },
    {
      id: '2',
      type: 'error' as const,
      title: 'Database Connection Failed',
      message: 'Failed to connect to replica database server',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      resolved: true,
      severity: 'high' as const
    },
    {
      id: '3',
      type: 'info' as const,
      title: 'System Update Available',
      message: 'A new system update is available for installation',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      resolved: false,
      severity: 'low' as const
    }
  ];
}

// Mock system logs
async function getSystemLogs() {
  const logs = [];
  const levels = ['debug', 'info', 'warn', 'error'] as const;
  const sources = ['api', 'database', 'auth', 'storage', 'scheduler'];
  
  for (let i = 0; i < 100; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    logs.push({
      id: `log-${i}`,
      level,
      message: generateLogMessage(level, source),
      timestamp: new Date(Date.now() - i * 60 * 1000).toISOString(),
      source,
      metadata: {
        request_id: Math.random().toString(36).substring(7),
        user_id: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 1000)}` : null,
        duration: Math.floor(Math.random() * 1000)
      }
    });
  }
  
  return logs;
}

function generateLogMessage(level: string, source: string): string {
  const messages = {
    debug: {
      api: 'Processing request with parameters',
      database: 'Executing query with index',
      auth: 'Validating JWT token',
      storage: 'Checking file permissions',
      scheduler: 'Running scheduled task'
    },
    info: {
      api: 'Request completed successfully',
      database: 'Connection established',
      auth: 'User logged in',
      storage: 'File uploaded successfully',
      scheduler: 'Task completed'
    },
    warn: {
      api: 'Rate limit approaching',
      database: 'Slow query detected',
      auth: 'Multiple failed attempts',
      storage: 'Storage space low',
      scheduler: 'Task delayed'
    },
    error: {
      api: 'Internal server error',
      database: 'Connection timeout',
      auth: 'Invalid credentials',
      storage: 'File upload failed',
      scheduler: 'Task failed'
    }
  };
  
  return (messages as any)[level]?.[source] || 'System event';
}

// System health check
async function getSystemHealth() {
  return {
    status: 'healthy' as const,
    uptime: 99.9,
    last_check: new Date().toISOString(),
    services: {
      database: 'online' as const,
      api: 'online' as const,
      storage: 'online' as const,
      cache: 'degraded' as const
    }
  };
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
    const type = searchParams.get('type') || 'metrics';

    switch (type) {
      case 'metrics':
        const metrics = await getSystemMetrics();
        return successResponse({ metrics });
      
      case 'alerts':
        const alerts = await getSystemAlerts();
        return successResponse({ alerts });
      
      case 'logs':
        const logs = await getSystemLogs();
        return successResponse({ logs });
      
      case 'health':
        const health = await getSystemHealth();
        return successResponse(health);
      
      default:
        return errorResponse('Invalid type parameter', 400);
    }
  } catch (error) {
    console.error('System monitoring API error:', error);
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
    const { action, type } = body;

    switch (action) {
      case 'resolve':
        if (type === 'alert') {
          // Log the action
          await adminClient
            .from('audit_logs')
            .insert({
              user_id: user.id,
              table_name: 'system_alerts',
              record_id: body.id,
              action: 'UPDATE',
              new_values: { resolved: true },
              event_type: 'system_management',
              description: `Resolved system alert: ${body.id}`
            });
          
          return successResponse({ message: 'Alert resolved successfully' });
        }
        break;
      
      case 'clear':
        if (type === 'logs') {
          // Log the action
          await adminClient
            .from('audit_logs')
            .insert({
              user_id: user.id,
              table_name: 'system_logs',
              action: 'DELETE',
              event_type: 'system_management',
              description: 'Cleared system logs'
            });
          
          return successResponse({ message: 'Logs cleared successfully' });
        }
        break;
      
      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('System monitoring API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
