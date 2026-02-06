import { NextRequest, NextResponse } from 'next/server';
import { CustomerSuccessSystem } from '@/lib/success/customerSuccessSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'metrics';

    switch (reportType) {
      case 'metrics':
        const metrics = CustomerSuccessSystem.getRetentionMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          status: metrics.retentionRate >= 95 ? 'Healthy' : 'Needs Attention'
        });

      case 'health':
        const health = CustomerSuccessSystem.getHealthDashboard();
        return NextResponse.json({ success: true, data: health });

      case 'churn-prevention':
        const actions = CustomerSuccessSystem.getChurnPreventionActions();
        return NextResponse.json({ success: true, data: actions, count: actions.length });

      case 'playbooks':
        const playbooks = CustomerSuccessSystem.getSuccessPlaybooks();
        return NextResponse.json({ success: true, data: playbooks });

      case 'csm-performance':
        const csm = CustomerSuccessSystem.getCSMPerformance();
        return NextResponse.json({ success: true, data: csm });

      case 'executive':
        const execMetrics = CustomerSuccessSystem.getRetentionMetrics();
        const execHealth = CustomerSuccessSystem.getHealthDashboard();
        return NextResponse.json({
          success: true,
          data: {
            headline: 'Customer Success: Strong Retention',
            retentionRate: `${execMetrics.retentionRate}%`,
            nps: execMetrics.nps,
            healthScore: execMetrics.avgHealthScore,
            atRisk: execMetrics.atRiskCount,
            topPerformers: execHealth.topPerformers.length,
            recommendation: 'Focus on 3 critical accounts for rescue'
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
