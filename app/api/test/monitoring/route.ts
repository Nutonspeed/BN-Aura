import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify monitoring system
 */
export async function GET(request: NextRequest) {
  try {
    // Test basic imports
    const { aiMonitor } = await import('@/lib/monitoring/aiPipelineMonitor');
    const { getHealthStatus } = await import('@/lib/monitoring/aiPipelineMonitor');
    
    // Test basic functionality
    const health = getHealthStatus();
    const stats = aiMonitor.getStatistics();
    
    return NextResponse.json({
      success: true,
      data: {
        health: health.status,
        totalOperations: stats.totalOperations,
        errorRate: stats.errorRate,
        avgDuration: stats.avgDuration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Test Monitoring] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
