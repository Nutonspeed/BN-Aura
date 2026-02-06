import { NextRequest, NextResponse } from 'next/server';
import { SalesCustomerOwnership } from '@/lib/sales/salesCustomerOwnership';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'rules';
    const salesRepId = searchParams.get('salesRepId');

    switch (reportType) {
      case 'rules':
        return NextResponse.json({ success: true, data: SalesCustomerOwnership.getDataIsolationRules() });

      case 'sales-reps':
        return NextResponse.json({ success: true, data: SalesCustomerOwnership.getSalesReps() });

      case 'customers':
        return NextResponse.json({ success: true, data: SalesCustomerOwnership.getCustomerOwnerships() });

      case 'commissions':
        return NextResponse.json({ success: true, data: SalesCustomerOwnership.getCommissionRecords(salesRepId || 'SALES-001') });

      case 'transfer':
        return NextResponse.json({ success: true, data: SalesCustomerOwnership.getTransferWorkflow() });

      case 'structure':
        return NextResponse.json({ success: true, data: SalesCustomerOwnership.getCommissionStructure() });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
