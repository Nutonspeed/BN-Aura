import { NextRequest, NextResponse } from 'next/server';
import { EnterpriseOperationsCenter } from '@/lib/operations/enterpriseOperationsCenter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'snapshot';

    switch (reportType) {
      case 'snapshot':
        const snapshot = EnterpriseOperationsCenter.getOperationsSnapshot();
        return NextResponse.json({
          success: true,
          data: snapshot,
          status: { health: snapshot.systemHealth, incidents: snapshot.activeIncidents }
        });

      case 'capacity':
        const capacity = EnterpriseOperationsCenter.getCapacityMetrics();
        return NextResponse.json({ success: true, data: capacity });

      case 'incidents':
        const incidents = EnterpriseOperationsCenter.getActiveIncidents();
        return NextResponse.json({ success: true, data: incidents, count: incidents.length });

      case 'executive':
        const executive = EnterpriseOperationsCenter.getExecutiveDashboard();
        return NextResponse.json({ success: true, data: executive });

      case 'sla':
        const sla = EnterpriseOperationsCenter.getSLACompliance();
        return NextResponse.json({ success: true, data: sla });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
