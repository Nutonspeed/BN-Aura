import { NextRequest, NextResponse } from 'next/server';
import { ScaledOperationsDashboard } from '@/lib/operations/scaledOperationsDashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';

    switch (reportType) {
      case 'overview':
        const overview = ScaledOperationsDashboard.getOperationsOverview();
        return NextResponse.json({
          success: true,
          data: overview,
          status: { health: overview.systemHealth, alerts: overview.alertsActive }
        });

      case 'clinics':
        const clinics = ScaledOperationsDashboard.getClinicPerformance();
        return NextResponse.json({
          success: true,
          data: clinics,
          summary: {
            healthy: clinics.filter(c => c.status === 'healthy').length,
            warning: clinics.filter(c => c.status === 'warning').length,
            critical: clinics.filter(c => c.status === 'critical').length
          }
        });

      case 'support':
        const support = ScaledOperationsDashboard.getSupportMetrics();
        return NextResponse.json({ success: true, data: support });

      case 'financials':
        const financials = ScaledOperationsDashboard.getFinancialSummary();
        return NextResponse.json({ success: true, data: financials });

      case 'alerts':
        const alerts = ScaledOperationsDashboard.getActiveAlerts();
        return NextResponse.json({ success: true, data: alerts, count: alerts.length });

      case 'executive':
        return NextResponse.json({
          success: true,
          data: {
            headline: 'BN-Aura Operations Performing Above Target',
            keyMetrics: {
              totalClinics: 23,
              mrr: 'THB 189,900',
              satisfaction: '4.5/5.0',
              uptime: '99.85%'
            },
            highlights: [
              'MRR at 95% of target with strong growth trajectory',
              'Customer satisfaction exceeds 4.0 threshold',
              'System uptime exceeds 99.5% SLA',
              'Support SLA compliance at 97.5%'
            ],
            concerns: ['1 clinic below satisfaction threshold'],
            nextActions: [
              'Address Rayong Wellness satisfaction issues',
              'Prepare for Phase 3 General Availability'
            ]
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
