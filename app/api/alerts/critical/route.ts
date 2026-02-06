import { NextRequest, NextResponse } from 'next/server';
import { CriticalAlerts } from '@/lib/notifications/criticalAlerts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'active';
    const clinicId = searchParams.get('clinicId');

    switch (action) {
      case 'active':
        return getActiveAlerts();
        
      case 'clinic':
        if (!clinicId) {
          return NextResponse.json({ error: 'clinicId required' }, { status: 400 });
        }
        return getClinicAlerts(clinicId);
        
      case 'stats':
        return getAlertStats();
        
      case 'test':
        return triggerTestAlert(clinicId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Critical Alerts API error:', error);
    return NextResponse.json(
      { error: 'Critical alerts API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, userId, actionDescription } = body;

    switch (action) {
      case 'acknowledge':
        return acknowledgeAlert(alertId, userId);
        
      case 'mark-action-taken':
        return markActionTaken(alertId, actionDescription);
        
      case 'simulate-critical':
        return simulateCriticalScenario(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Critical Alerts POST error:', error);
    return NextResponse.json(
      { error: 'Critical alerts POST failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getActiveAlerts() {
  const activeAlerts = CriticalAlerts.getActiveAlerts();
  
  return NextResponse.json({
    success: true,
    data: activeAlerts,
    totalActive: activeAlerts.length,
    summary: {
      urgent: activeAlerts.filter(a => a.severity === 'urgent').length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      warning: activeAlerts.filter(a => a.severity === 'warning').length
    }
  });
}

async function getClinicAlerts(clinicId: string) {
  const clinicAlerts = CriticalAlerts.getClinicAlerts(clinicId);
  
  return NextResponse.json({
    success: true,
    data: clinicAlerts,
    clinicId,
    totalAlerts: clinicAlerts.length
  });
}

async function getAlertStats() {
  const stats = CriticalAlerts.getAlertStats();
  
  return NextResponse.json({
    success: true,
    data: stats,
    generatedAt: new Date().toISOString()
  });
}

async function triggerTestAlert(clinicId?: string | null) {
  const testClinicId = clinicId || 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';
  
  // Simulate critical quota scenario (96% usage)
  const alert = await CriticalAlerts.checkQuotaLevels(
    testClinicId,
    'Test Clinic (Critical Alert)',
    96,
    100
  );
  
  return NextResponse.json({
    success: true,
    message: 'Test critical alert triggered',
    alert: alert,
    testScenario: 'Simulated 96% quota usage'
  });
}

async function acknowledgeAlert(alertId: string, userId: string) {
  const success = CriticalAlerts.acknowledgeAlert(alertId, userId);
  
  if (!success) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Alert acknowledged successfully',
    alertId,
    acknowledgedBy: userId
  });
}

async function markActionTaken(alertId: string, actionDescription: string) {
  const success = CriticalAlerts.markActionTaken(alertId, actionDescription);
  
  if (!success) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Action recorded successfully',
    alertId,
    action: actionDescription
  });
}

async function simulateCriticalScenario(body: any) {
  const { clinicId, scenario = 'critical' } = body;
  
  let usage, quota, alertType;
  
  switch (scenario) {
    case 'urgent':
      usage = 99;
      quota = 100;
      alertType = 'Urgent (99% usage)';
      break;
    case 'critical':
      usage = 96;
      quota = 100;
      alertType = 'Critical (96% usage)';
      break;
    case 'warning':
      usage = 85;
      quota = 100;
      alertType = 'Warning (85% usage)';
      break;
    default:
      usage = 96;
      quota = 100;
      alertType = 'Critical (96% usage)';
  }
  
  const alert = await CriticalAlerts.checkQuotaLevels(
    clinicId || 'test-clinic-simulation',
    'Simulated Test Clinic',
    usage,
    quota
  );
  
  return NextResponse.json({
    success: true,
    message: `Simulated ${scenario} alert created`,
    alert: alert,
    scenario: {
      type: alertType,
      usage,
      quota,
      utilizationRate: Math.round((usage / quota) * 100)
    }
  });
}
