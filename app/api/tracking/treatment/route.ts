import { NextRequest, NextResponse } from 'next/server';
import { TreatmentTracking } from '@/lib/tracking/treatmentTracking';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'records';
    const customerId = searchParams.get('customerId') || 'CUST-001';
    const salesRepId = searchParams.get('salesRepId') || 'SALES-001';

    switch (reportType) {
      case 'records':
        return NextResponse.json({ success: true, data: TreatmentTracking.getTreatmentRecords(customerId) });

      case 'comparison':
        return NextResponse.json({ success: true, data: TreatmentTracking.getProgressComparison('TR-001') });

      case 'followups':
        return NextResponse.json({ success: true, data: TreatmentTracking.getFollowupSchedule(salesRepId) });

      case 'protocol':
        return NextResponse.json({ success: true, data: TreatmentTracking.getFollowupProtocol() });

      case 'metrics':
        return NextResponse.json({ success: true, data: TreatmentTracking.getTrackingMetrics() });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
