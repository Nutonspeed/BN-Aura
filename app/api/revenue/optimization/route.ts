import { NextRequest, NextResponse } from 'next/server';
import { RevenueOptimizationEngine } from '@/lib/revenue/revenueOptimizationEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'metrics';

    switch (reportType) {
      case 'metrics':
        const metrics = RevenueOptimizationEngine.getRevenueMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          growth: metrics.growthRate > 0 ? 'Growing' : 'Declining'
        });

      case 'upsell':
        const upsell = RevenueOptimizationEngine.getUpsellOpportunities();
        const totalPotential = upsell.reduce((sum, o) => sum + o.potentialMRR, 0);
        return NextResponse.json({ 
          success: true, 
          data: upsell, 
          count: upsell.length,
          totalPotentialMRR: totalPotential
        });

      case 'expansion':
        const expansion = RevenueOptimizationEngine.getExpansionMetrics();
        return NextResponse.json({ success: true, data: expansion });

      case 'tiers':
        const tiers = RevenueOptimizationEngine.getTierAnalysis();
        return NextResponse.json({ success: true, data: tiers });

      case 'forecast':
        const forecast = RevenueOptimizationEngine.getRevenueForecast();
        return NextResponse.json({ success: true, data: forecast });

      case 'executive':
        const execMetrics = RevenueOptimizationEngine.getRevenueMetrics();
        const execUpsell = RevenueOptimizationEngine.getUpsellOpportunities();
        const execForecast = RevenueOptimizationEngine.getRevenueForecast();
        return NextResponse.json({
          success: true,
          data: {
            headline: 'Revenue Optimization: Strong Growth',
            currentMRR: `THB ${execMetrics.mrr.toLocaleString()}`,
            growthRate: `${execMetrics.growthRate}%`,
            upsellPipeline: execUpsell.length,
            pipelineValue: `THB ${execUpsell.reduce((s, o) => s + o.potentialMRR, 0).toLocaleString()}`,
            yearEndTarget: `THB ${execForecast.yearEndTarget.mrr.toLocaleString()}`,
            confidence: `${execForecast.yearEndTarget.confidence}%`
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
