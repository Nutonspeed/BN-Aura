import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

// Cache for security metrics (5 minutes TTL)
const securityCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function getSecurityMetrics(adminClient: any, timeRange: string = '24h') {
  // Disable cache for testing - always get fresh data
  // const cacheKey = `security_metrics_${timeRange}`;
  // const cached = securityCache.get(cacheKey);
  // 
  // if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  //   return cached.data;
  // }

  // Calculate time range filter
  const timeRangeMap = {
    '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
    '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  };
  
  const timeFilter = timeRangeMap[timeRange as keyof typeof timeRangeMap] || timeRangeMap['24h'];
  const timeFilterISO = timeFilter.toISOString();

  try {
    // Get total users
    const { count: totalUsers } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active sessions from audit logs (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: activeSessionData } = await adminClient
      .from('audit_logs')
      .select('user_id')
      .eq('action', 'INSERT')
      .gte('created_at', thirtyMinutesAgo);
    
    const activeSessions = activeSessionData ? [...new Set(activeSessionData.map((s: { user_id: string }) => s.user_id))].length : 0;

    // Get failed login attempts from audit logs
    const { count: failedLogins } = await adminClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'UPDATE')
      .eq('event_type', 'security_event')
      .gte('created_at', timeFilterISO);

    // Get security alerts from audit logs
    const { count: securityAlerts } = await adminClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'security_event')
      .gte('created_at', timeFilterISO);

    // Get 2FA enabled users from user metadata
    const { data: usersWith2FA } = await adminClient
      .from('users')
      .select('id, metadata')
      .eq('is_active', true);
    
    const twoFactorEnabled = usersWith2FA ? usersWith2FA.filter((u: { metadata?: { two_factor_enabled?: boolean } }) => 
      u.metadata?.two_factor_enabled === true
    ).length : 0;

    // Get password strength from user metadata
    const { data: usersWithPasswords } = await adminClient
      .from('users')
      .select('id, metadata')
      .eq('is_active', true);
    
    const strongPasswords = usersWithPasswords ? usersWithPasswords.filter((u: { metadata?: { password_strength?: string } }) => 
      u.metadata?.password_strength === 'strong'
    ).length : 0;
    
    const mediumPasswords = usersWithPasswords ? usersWithPasswords.filter((u: { metadata?: { password_strength?: string } }) => 
      u.metadata?.password_strength === 'medium'
    ).length : 0;
    
    const weakPasswords = usersWithPasswords ? usersWithPasswords.filter((u: { metadata?: { password_strength?: string } }) => 
      u.metadata?.password_strength === 'weak'
    ).length : 0;

    const passwordStrength = {
      strong: strongPasswords,
      medium: mediumPasswords,
      weak: Math.max(0, weakPasswords)
    };

    // Get security incidents
    const { data: incidents } = await adminClient
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'security_event')
      .gte('created_at', timeFilterISO)
      .order('created_at', { ascending: false });

    const activeIncidents = incidents?.filter((i: any) => i.description.includes('active') || i.description.includes('detected')).length || 0;
    const resolvedIncidents = incidents?.filter((i: any) => i.description.includes('resolved')).length || 0;

    const metrics = {
      totalUsers: totalUsers || 0,
      activeSessions,
      failedLogins: failedLogins || 0,
      suspiciousActivities: failedLogins || 0, // Use failed logins as suspicious activities
      securityAlerts,
      passwordStrength,
      twoFactorEnabled,
      activeIncidents,
      resolvedIncidents
    };

    // Cache disabled for testing
    // securityCache.set(cacheKey, { data: metrics, timestamp: Date.now() });

    return metrics;
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    throw error;
  }
}

async function getSecurityEvents(adminClient: any, timeRange: string = '24h') {
  const timeRangeMap = {
    '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
    '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  };
  
  const timeFilter = timeRangeMap[timeRange as keyof typeof timeRangeMap] || timeRangeMap['24h'];
  const timeFilterISO = timeFilter.toISOString();

  try {
    // Get recent security events from audit logs
    const { data: events } = await adminClient
      .from('audit_logs')
      .select(`
        *,
        users!audit_logs_user_id_fkey (
          email,
          full_name
        )
      `)
      .gte('created_at', timeFilterISO)
      .order('created_at', { ascending: false })
      .limit(50);

    // Transform events to expected format
    const transformedEvents = events?.map((event: any) => {
      let eventType = 'login';
      let status = 'success';
      
      if (event.description.includes('Failed')) {
        status = 'failed';
      } else if (event.description.includes('suspicious') || event.description.includes('unusual')) {
        eventType = 'suspicious';
        status = 'warning';
      } else if (event.description.includes('2FA') || event.description.includes('two-factor')) {
        eventType = '2fa_enabled';
      } else if (event.description.includes('attack') || event.description.includes('breach')) {
        eventType = 'security_alert';
        status = 'critical';
      }

      return {
        id: event.id,
        type: eventType,
        user: event.users?.full_name || 'System',
        email: event.users?.email || 'system@bnaura.com',
        ip: event.ip_address || '192.168.1.1',
        location: 'Unknown', // In real app, use IP geolocation
        timestamp: event.created_at,
        status,
        details: event.description
      };
    }) || [];

    return transformedEvents;
  } catch (error) {
    console.error('Error fetching security events:', error);
    throw error;
  }
}

async function getSecurityAlerts(adminClient: any, timeRange: string = '24h') {
  // Simulated alerts - in real app, fetch from dedicated alerts table
  const alerts = [
    {
      id: '1',
      type: 'brute_force',
      severity: 'high',
      title: 'Brute Force Attack Detected',
      description: 'Multiple failed login attempts from IP 192.168.1.50',
      affectedUsers: 3,
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      status: 'investigating'
    },
    {
      id: '2',
      type: 'unusual_access',
      severity: 'medium',
      title: 'Unusual Access Pattern',
      description: 'User accessing from multiple locations simultaneously',
      affectedUsers: 1,
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      status: 'active'
    },
    {
      id: '3',
      type: 'phishing',
      severity: 'low',
      title: 'Phishing Attempt Reported',
      description: 'User reported suspicious email claiming to be from BN-Aura',
      affectedUsers: 0,
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      status: 'resolved'
    }
  ];

  return alerts;
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
    const type = searchParams.get('type') || 'metrics';
    const timeRange = searchParams.get('timeRange') || '24h';

    switch (type) {
      case 'metrics':
        const metrics = await getSecurityMetrics(adminClient, timeRange);
        return successResponse({ metrics });
      
      case 'events':
        const events = await getSecurityEvents(adminClient, timeRange);
        return successResponse({ events });
      
      case 'alerts':
        const alerts = await getSecurityAlerts(adminClient, timeRange);
        return successResponse({ alerts });
      
      default:
        return errorResponse('Invalid type parameter', 400);
    }
  } catch (error) {
    console.error('Security API error:', error);
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
    const { action, alertId } = body;

    if (action === 'updateAlertStatus' && alertId) {
      // In real app, update alert status in database
      // For now, just return success
      return successResponse({ message: 'Alert status updated successfully' });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    console.error('Security API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
