import { NextRequest, NextResponse } from 'next/server';
import { RegionalExpansionSystem } from '@/lib/expansion/regionalExpansionSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const country = searchParams.get('country');

    switch (reportType) {
      case 'overview':
        const markets = RegionalExpansionSystem.getMarketOverview();
        return NextResponse.json({
          success: true,
          data: markets,
          summary: {
            totalMarkets: markets.length,
            activeMarkets: markets.filter(m => m.status === 'scaling' || m.status === 'active').length,
            totalPotential: markets.reduce((sum, m) => sum + m.targetClinics, 0)
          }
        });

      case 'metrics':
        const metrics = RegionalExpansionSystem.getExpansionMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'localization':
        if (!country) return NextResponse.json({ error: 'Country code required' }, { status: 400 });
        const localization = RegionalExpansionSystem.getLocalizationRequirements(country);
        return NextResponse.json({ success: true, data: localization });

      case 'timeline':
        const timeline = RegionalExpansionSystem.getExpansionTimeline();
        return NextResponse.json({ success: true, data: timeline });

      case 'executive':
        const executive = RegionalExpansionSystem.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
