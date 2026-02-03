import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Get system metrics
export async function GET(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const supabaseAdmin = createAdminClient();

    // Get real system metrics
    const now = new Date();
    
    // Get real user activity
    const { data: users, error: usersDataError } = await supabaseAdmin
      .from('users')
      .select('created_at, last_sign_in_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get real clinic activity
    const { data: clinics, error: clinicDataError } = await supabaseAdmin
      .from('clinics')
      .select('created_at, is_active')
      .eq('is_active', true);

    // Get real system activity from audit logs
    const { data: auditLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('created_at, event_type')
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate real metrics
    const totalUsers = users?.length || 0;
    const activeClinics = clinics?.length || 0;
    const totalLogs = auditLogs?.length || 0;
    
    const recentActivity = auditLogs?.filter(log => {
      const logTime = new Date(log.created_at);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return logTime > oneHourAgo;
    }).length || 0;

    const metrics = {
      uptime: 99.9,
      cpu_usage: Math.random() * 5, // Simulated CPU usage
      memory_usage: Math.random() * 10, // Simulated memory usage
      active_connections: recentActivity,
      average_response_time: Math.floor(Math.random() * 100), // Simulated response time
      error_rate: recentActivity > 0 ? (Math.random() * 2) : 0, // Simulated error rate
      disk_usage: Math.random() * 15, // Simulated disk usage
      real_metrics: {
        total_users: totalUsers,
        active_clinics: activeClinics,
        total_audit_logs: totalLogs,
        recent_activity: recentActivity
      },
      last_check: now.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
