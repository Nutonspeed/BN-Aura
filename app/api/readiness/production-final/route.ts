import { NextRequest, NextResponse } from 'next/server';
import { ProductionReadinessFinal } from '@/lib/readiness/productionReadinessFinal';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'readiness';

    switch (reportType) {
      case 'readiness':
        const readiness = ProductionReadinessFinal.getProductionReadiness();
        return NextResponse.json({
          success: true,
          data: readiness,
          verdict: readiness.status === 'production_ready' ? 
            '✅ BN-AURA IS PRODUCTION READY' : 
            '⚠️ CONDITIONAL APPROVAL NEEDED'
        });

      case 'executive':
        const executive = ProductionReadinessFinal.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      case 'systems':
        const systems = ProductionReadinessFinal.getSystemsSummary();
        return NextResponse.json({ success: true, data: systems });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
