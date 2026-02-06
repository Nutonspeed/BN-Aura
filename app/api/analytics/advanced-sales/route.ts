import { NextRequest, NextResponse } from 'next/server';
import { AdvancedSalesAnalytics } from '@/lib/analytics/advancedSalesAnalytics';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'track-performance';
    const body = await request.json();

    switch (action) {
      case 'track-performance':
        const performance = AdvancedSalesAnalytics.trackPerformance(
          body.salesPersonId,
          body.performanceData
        );
        return NextResponse.json({
          success: true,
          data: performance,
          insights: {
            performanceLevel: performance.conversionRate > 60 ? 'Excellent' : 
                             performance.conversionRate > 40 ? 'Good' : 'Needs Improvement',
            revenueTarget: performance.revenue > 400000 ? 'Above Target' : 'Below Target',
            efficiency: performance.averageOrderValue > 15000 ? 'High Value Sales' : 'Standard Sales'
          }
        });

      case 'map-journey':
        const journey = AdvancedSalesAnalytics.mapCustomerJourney(
          body.customerId,
          body.touchpoints
        );
        return NextResponse.json({
          success: true,
          data: journey,
          analysis: {
            journeyLength: journey.touchpoints.length,
            primaryChannel: getMostFrequentChannel(journey.touchpoints),
            timeToConversion: calculateTimeToConversion(journey.touchpoints)
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Advanced Sales Analytics API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';

    switch (reportType) {
      case 'overview':
        const report = AdvancedSalesAnalytics.generateSalesReport();
        return NextResponse.json({
          success: true,
          data: report,
          insights: {
            averageOrderValue: Math.round(report.totalRevenue / report.totalBookings),
            topPerformer: report.topSalesStaff[0]?.name,
            bestTreatment: report.topTreatments[0]?.name,
            growthTrend: 'Positive based on recent months'
          }
        });

      case 'conversion-funnel':
        const funnel = AdvancedSalesAnalytics.analyzeConversionFunnel();
        return NextResponse.json({
          success: true,
          data: funnel,
          analysis: {
            overallConversion: funnel[funnel.length - 1]?.conversionRate,
            biggestDropOff: findBiggestDropOff(funnel),
            optimizationOpportunity: 'Focus on Interest to Consultation stage'
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate analytics report'
    }, { status: 500 });
  }
}

function getMostFrequentChannel(touchpoints: any[]): string {
  const channelCounts = touchpoints.reduce((acc, tp) => {
    acc[tp.channel] = (acc[tp.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(channelCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'unknown';
}

function calculateTimeToConversion(touchpoints: any[]): string {
  if (touchpoints.length < 2) return '0 days';
  
  const first = new Date(touchpoints[0].timestamp);
  const last = new Date(touchpoints[touchpoints.length - 1].timestamp);
  const daysDiff = Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  
  return `${daysDiff} days`;
}

function findBiggestDropOff(funnel: any[]): string {
  let maxDropOff = 0;
  let dropOffStage = '';
  
  for (let i = 1; i < funnel.length; i++) {
    const dropOff = funnel[i-1].conversionRate - funnel[i].conversionRate;
    if (dropOff > maxDropOff) {
      maxDropOff = dropOff;
      dropOffStage = `${funnel[i-1].stage} to ${funnel[i].stage}`;
    }
  }
  
  return dropOffStage;
}
