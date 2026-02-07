import { NextRequest, NextResponse } from 'next/server';
import { QuotaMonitor } from '@/lib/monitoring/quotaMonitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const timeRange = parseInt(searchParams.get('timeRange') || '3600000'); // Default 1 hour
    const format = (searchParams.get('format') || 'json') as 'json' | 'prometheus';

    switch (action) {
      case 'dashboard':
        return getDashboardData(timeRange);
        
      case 'health':
        return getHealthStatus();
        
      case 'metrics':
        return getMetrics(format);
        
      case 'alerts':
        return getAlerts();
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Monitoring API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getDashboardData(timeRange: number) {
  const dashboardData = QuotaMonitor.getDashboardData(timeRange);
  
  return NextResponse.json({
    success: true,
    data: dashboardData,
    generatedAt: new Date().toISOString()
  });
}

async function getHealthStatus() {
  const healthStatus = QuotaMonitor.getHealthStatus();
  
  // Determine HTTP status code based on health
  const statusCode = healthStatus.status === 'critical' ? 503 : 
                     healthStatus.status === 'warning' ? 206 : 200;
  
  return NextResponse.json(healthStatus, { status: statusCode });
}

async function getMetrics(format: 'json' | 'prometheus') {
  const metrics = QuotaMonitor.exportMetrics(format);
  
  if (format === 'prometheus') {
    // @ts-ignore
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
  
  return NextResponse.json({
    success: true,
      // @ts-ignore - spread type
    ...metrics
  });
}

async function getAlerts() {
  const dashboardData = QuotaMonitor.getDashboardData();
  
  return NextResponse.json({
    success: true,
    alerts: dashboardData.alerts,
    summary: {
      total: dashboardData.alerts.length,
      critical: dashboardData.alerts.filter(a => a.severity === 'critical').length,
      warning: dashboardData.alerts.filter(a => a.severity === 'warning').length
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'record-event':
        return recordCustomEvent(body);
        
      case 'update-threshold':
        return updateAlertThreshold(body);
        
      case 'test-alert':
        return testAlert(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Monitoring POST error:', error);
    return NextResponse.json(
      { error: 'Monitoring POST failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function recordCustomEvent(body: any) {
  const { type, severity, message, clinicId, metadata } = body;
  
  if (!type || !message) {
    return NextResponse.json({ error: 'Missing required fields: type, message' }, { status: 400 });
  }
  
  // Record custom event (this would typically be done through QuotaMonitor methods)
  if (type === 'error') {
    QuotaMonitor.recordError(new Error(message), { clinicId, ...metadata });
  } else if (type === 'billing') {
    QuotaMonitor.recordBilling(clinicId, metadata?.operation || 'custom', metadata?.amount || 0, metadata?.success || true);
  }
  
  return NextResponse.json({
    success: true,
    message: 'Event recorded successfully'
  });
}

async function updateAlertThreshold(body: any) {
  const { metric, threshold, severity } = body;
  
  if (!metric || !threshold || !severity) {
    return NextResponse.json({ error: 'Missing required fields: metric, threshold, severity' }, { status: 400 });
  }
  
  QuotaMonitor.updateAlertThreshold(metric, threshold, severity);
  
  return NextResponse.json({
    success: true,
    message: `Alert threshold updated for ${metric}`
  });
}

async function testAlert(body: any) {
  const { clinicId = 'test-clinic' } = body;
  
  // Simulate a test alert
  QuotaMonitor.recordQuotaUsage(clinicId, 96, 100, { test: true });
  
  return NextResponse.json({
    success: true,
    message: 'Test alert triggered'
  });
}
