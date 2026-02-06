import { NextRequest, NextResponse } from 'next/server';
import { AdvancedSecurityCompliance } from '@/lib/security/advancedSecurityCompliance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'frameworks';

    switch (reportType) {
      case 'frameworks':
        const frameworks = AdvancedSecurityCompliance.getComplianceFrameworks();
        return NextResponse.json({
          success: true,
          data: frameworks,
          summary: {
            total: frameworks.length,
            certified: frameworks.filter(f => f.status === 'certified').length
          }
        });

      case 'metrics':
        const metrics = AdvancedSecurityCompliance.getSecurityMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'pdpa':
        const pdpa = AdvancedSecurityCompliance.getPDPACompliance();
        return NextResponse.json({ success: true, data: pdpa });

      case 'controls':
        const controls = AdvancedSecurityCompliance.getSecurityControls();
        return NextResponse.json({ 
          success: true, 
          data: controls,
          implemented: controls.filter(c => c.status === 'implemented').length
        });

      case 'executive':
        const executive = AdvancedSecurityCompliance.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
