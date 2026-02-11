/**
 * Monitoring & Alerting API
 * GET - System health dashboard with DB perf, quota alerts, uptime
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check') || 'all';
    const adminClient = createAdminClient();
    const startTime = Date.now();

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'unknown',
    };

    // Database connectivity & performance
    if (check === 'all' || check === 'database') {
      const dbStart = Date.now();
      const { data, error } = await adminClient
        .from('clinics')
        .select('id', { count: 'exact', head: true });
      const dbLatency = Date.now() - dbStart;

      results.database = {
        status: error ? 'error' : 'healthy',
        latencyMs: dbLatency,
        error: error?.message || null,
      };
    }

    // AI Quota alerts — clinics near limit
    if (check === 'all' || check === 'quotas') {
      const { data: quotas } = await adminClient
        .from('clinic_quotas')
        .select('clinic_id, quota_type, total_quota, used_quota')
        .gt('used_quota', 0);

      const alerts: any[] = [];
      (quotas || []).forEach((q: any) => {
        const usage = q.total_quota > 0 ? (q.used_quota / q.total_quota) * 100 : 0;
        if (usage >= 80) {
          alerts.push({
            clinicId: q.clinic_id,
            quotaType: q.quota_type,
            usagePercent: Math.round(usage),
            used: q.used_quota,
            total: q.total_quota,
            severity: usage >= 95 ? 'critical' : 'warning',
          });
        }
      });

      results.quotaAlerts = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        alerts,
      };
    }

    // Active clinics & users count
    if (check === 'all' || check === 'stats') {
      const [clinicsRes, usersRes, staffRes] = await Promise.all([
        adminClient.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
        adminClient.from('users').select('id', { count: 'exact', head: true }),
        adminClient.from('clinic_staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      results.stats = {
        activeClinics: clinicsRes.count || 0,
        totalUsers: usersRes.count || 0,
        activeStaff: staffRes.count || 0,
      };
    }

    // External services status
    if (check === 'all' || check === 'services') {
      results.services = {
        supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        omise: process.env.OMISE_SECRET_KEY ? 'configured' : 'missing',
        line: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'configured' : 'missing',
        sms: (process.env.THAI_SMS_PLUS_API_KEY || process.env.TWILIO_ACCOUNT_SID) ? 'configured' : 'missing',
        sentry: process.env.SENTRY_DSN ? 'configured' : 'missing',
        resend: process.env.RESEND_API_KEY ? 'configured' : 'missing',
        gemini: process.env.GOOGLE_AI_API_KEY ? 'configured' : 'missing',
      };
    }

    // Recent errors from audit log
    if (check === 'all' || check === 'errors') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentErrors, count } = await adminClient
        .from('audit_log')
        .select('id, action, details, created_at', { count: 'exact' })
        .gte('created_at', oneDayAgo)
        .ilike('action', '%error%')
        .order('created_at', { ascending: false })
        .limit(10);

      results.recentErrors = {
        last24h: count || 0,
        latest: recentErrors || [],
      };
    }

    results.responseTimeMs = Date.now() - startTime;

    const isHealthy = results.database?.status !== 'error';

    return NextResponse.json({
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      data: results,
    }, { status: isHealthy ? 200 : 503 });
  } catch (error: any) {
    console.error('[Monitoring] Error:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
