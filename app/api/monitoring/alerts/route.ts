import { NextRequest, NextResponse } from 'next/server';
import { getAlerts, createAlert, clearAlerts, clearAlert } from '@/lib/monitoring/aiPipelineMonitor';

/**
 * GET /api/monitoring/alerts - Get AI pipeline alerts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const alerts = getAlerts({ severity, activeOnly });
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Monitoring Alerts] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/alerts - Create a custom alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, severity, metadata } = body;
    
    if (!type || !message || !severity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, message, severity'
        },
        { status: 400 }
      );
    }
    
    const alert = createAlert(type, message, severity, metadata);
    
    return NextResponse.json({
      success: true,
      data: {
        alert,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Monitoring Alerts Create] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring/alerts - Clear alerts
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const all = searchParams.get('all') === 'true';
    
    if (all) {
      clearAlerts();
      return NextResponse.json({
        success: true,
        message: 'All alerts cleared',
        timestamp: new Date().toISOString()
      });
    }
    
    if (alertId) {
      clearAlert(alertId);
      return NextResponse.json({
        success: true,
        message: `Alert ${alertId} cleared`,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Either provide ?id=<alert-id> or ?all=true to clear alerts'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Monitoring Alerts Clear] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}