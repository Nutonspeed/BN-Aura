import { NextRequest, NextResponse } from 'next/server';
import { CriticalAlerts } from '@/lib/notifications/criticalAlerts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    
    let alerts;
    if (clinicId) {
      alerts = CriticalAlerts.getClinicAlerts(clinicId);
    } else {
      alerts = CriticalAlerts.getActiveAlerts();
    }
    
    const stats = CriticalAlerts.getAlertStats();
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, userId } = body;
    
    if (action === 'acknowledge' && alertId) {
      const result = CriticalAlerts.acknowledgeAlert(alertId, userId || 'system');
      return NextResponse.json({ success: result, message: result ? 'Alert acknowledged' : 'Alert not found' });
    }
    
    if (action === 'action_taken' && alertId) {
      const result = CriticalAlerts.markActionTaken(alertId, body.actionDescription || 'Action completed');
      return NextResponse.json({ success: result, message: result ? 'Action recorded' : 'Alert not found' });
    }
    
    if (action === 'test_alert') {
      const alert = await CriticalAlerts.checkQuotaLevels(
        body.clinicId || 'test-clinic',
        body.clinicName || 'Test Clinic',
        body.currentUsage || 95,
        body.monthlyQuota || 100
      );
      return NextResponse.json({ success: true, alert });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing alert action:', error);
    return NextResponse.json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}
