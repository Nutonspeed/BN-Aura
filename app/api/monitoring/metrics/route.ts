import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, resetMetrics } from '@/lib/monitoring/aiPipelineMonitor';

/**
 * GET /api/monitoring/metrics - Get AI pipeline metrics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = getMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Monitoring Metrics] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/metrics - Reset metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirm } = body;
    
    if (confirm !== 'RESET_METRICS') {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Include { "confirm": "RESET_METRICS" } in request body'
        },
        { status: 400 }
      );
    }
    
    resetMetrics();
    
    return NextResponse.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Monitoring Metrics Reset] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}