import { NextRequest, NextResponse } from 'next/server';
import { MobileAnalysisDashboard } from '@/lib/sales/mobileAnalysisDashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'stats';
    const salesRepId = searchParams.get('salesRepId') || 'SALES-001';

    switch (reportType) {
      case 'stats':
        return NextResponse.json({ success: true, data: MobileAnalysisDashboard.getDashboardStats(salesRepId) });

      case 'schedule':
        return NextResponse.json({ success: true, data: MobileAnalysisDashboard.getTodaySchedule(salesRepId) });

      case 'actions':
        return NextResponse.json({ success: true, data: MobileAnalysisDashboard.getQuickActions() });

      case 'workflow':
        return NextResponse.json({ success: true, data: MobileAnalysisDashboard.getAnalysisWorkflow() });

      case 'advantage':
        return NextResponse.json({ success: true, data: MobileAnalysisDashboard.getMobilityAdvantage() });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
