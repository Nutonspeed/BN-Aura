import { NextRequest, NextResponse } from 'next/server';
import { getHealthStatus, getMetrics, getAlerts } from '@/lib/monitoring/aiPipelineMonitor';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/monitoring/status - Get comprehensive AI pipeline status
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get AI pipeline metrics
    const metrics = getMetrics();
    const alerts = getAlerts({ activeOnly: true });
    const healthStatus = getHealthStatus();
    
    // Check database connectivity
    let databaseStatus = 'unknown';
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('clinics').select('id').limit(1);
      databaseStatus = error ? 'error' : 'healthy';
    } catch (dbError) {
      databaseStatus = 'error';
    }
    
    // Calculate overall status
    const activeAlerts = alerts.filter(a => a.active);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');
    
    let overallStatus = 'healthy';
    if (criticalAlerts.length > 0) {
      overallStatus = 'critical';
    } else if (highAlerts.length > 0 || databaseStatus === 'error') {
      overallStatus = 'degraded';
    } else if (activeAlerts.length > 0) {
      overallStatus = 'warning';
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        aiPipeline: {
          health: healthStatus,
          metrics: {
            totalOperations: metrics.totalOperations,
            successRate: metrics.successRate,
            averageResponseTime: metrics.averageResponseTime,
            operationsPerSecond: metrics.operationsPerSecond
          },
          alerts: {
            total: activeAlerts.length,
            critical: criticalAlerts.length,
            high: highAlerts.length,
            medium: activeAlerts.filter(a => a.severity === 'medium').length,
            low: activeAlerts.filter(a => a.severity === 'low').length
          }
        },
        services: {
          database: databaseStatus,
          monitoring: 'healthy'
        },
        performance: {
          responseTime: `${responseTime}ms`,
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Monitoring Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}