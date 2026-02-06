import { NextRequest, NextResponse } from 'next/server';
import { SecurityPerformanceAudit } from '@/lib/security/securityPerformanceAudit';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'run-security-audit';

    switch (action) {
      case 'run-security-audit':
        const securityResults = SecurityPerformanceAudit.runSecurityAudit();
        
        return NextResponse.json({
          success: true,
          data: securityResults,
          summary: {
            totalAudits: securityResults.length,
            passed: securityResults.filter(r => r.status === 'passed').length,
            warnings: securityResults.filter(r => r.status === 'warning').length,
            failed: securityResults.filter(r => r.status === 'failed').length,
            averageScore: Math.round(securityResults.reduce((sum, r) => sum + r.score, 0) / securityResults.length)
          }
        });

      case 'run-performance-tests':
        const performanceResults = SecurityPerformanceAudit.runPerformanceTests();
        
        return NextResponse.json({
          success: true,
          data: performanceResults,
          summary: {
            totalTests: performanceResults.length,
            passed: performanceResults.filter(r => r.status === 'passed').length,
            warnings: performanceResults.filter(r => r.status === 'warning').length,
            averageResponseTime: Math.round(performanceResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / performanceResults.length),
            averageThroughput: Math.round(performanceResults.reduce((sum, r) => sum + r.throughput, 0) / performanceResults.length)
          }
        });

      case 'comprehensive-audit':
        const securityAudit = SecurityPerformanceAudit.runSecurityAudit();
        const performanceTests = SecurityPerformanceAudit.runPerformanceTests();
        const auditSummary = SecurityPerformanceAudit.generateAuditSummary();
        
        return NextResponse.json({
          success: true,
          data: {
            security: securityAudit,
            performance: performanceTests,
            summary: auditSummary
          },
          recommendations: auditSummary.recommendations,
          status: auditSummary.criticalIssues === 0 && auditSummary.highPriorityIssues <= 2 ? 'production_ready' : 'needs_attention'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Security & Performance Audit failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'status';

    switch (reportType) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            securityStatus: 'Under Review',
            performanceStatus: 'Monitoring',
            lastAuditRun: 'Never',
            nextScheduledAudit: 'On Demand',
            complianceLevel: 'High'
          }
        });

      case 'compliance':
        return NextResponse.json({
          success: true,
          data: {
            gdpr: { status: 'compliant', score: 95 },
            thai_pdpa: { status: 'compliant', score: 92 },
            api_security: { status: 'needs_review', score: 78 },
            data_protection: { status: 'compliant', score: 88 }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get audit status'
    }, { status: 500 });
  }
}
