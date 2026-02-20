/**
 * API Route for Workflow E2E Testing
 * Phase 7: Cross-Role Workflow Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWorkflowE2ETests } from '@/lib/testing/workflowE2ETester';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting Phase 7 E2E Workflow Tests...');
    
    const results = await runWorkflowE2ETests();
    
    // Calculate summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;
    
    const summary = {
      total,
      passed,
      failed,
      successRate: total > 0 ? (passed / total * 100).toFixed(1) : '0',
      status: failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'
    };

    return NextResponse.json({
      success: failed === 0,
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error running E2E tests:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run E2E tests',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
