import { NextRequest, NextResponse } from 'next/server';
import { AdvancedAnalyticsDashboard } from '@/lib/analytics/advancedAnalyticsDashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';

    switch (reportType) {
      case 'overview':
        const overview = AdvancedAnalyticsDashboard.getAnalyticsOverview();
        return NextResponse.json({
          success: true,
          data: overview,
          summary: {
            bookings: overview.totalBookings.toLocaleString(),
            revenue: `THB ${overview.totalRevenue.toLocaleString()}`,
            customers: overview.activeCustomers.toLocaleString()
          }
        });

      case 'predictive':
        const predictive = AdvancedAnalyticsDashboard.getPredictiveInsights();
        return NextResponse.json({ success: true, data: predictive });

      case 'customers':
        const customers = AdvancedAnalyticsDashboard.getCustomerInsights();
        return NextResponse.json({ success: true, data: customers });

      case 'ai':
        const ai = AdvancedAnalyticsDashboard.getAIAnalytics();
        return NextResponse.json({ success: true, data: ai });

      case 'executive':
        const execOverview = AdvancedAnalyticsDashboard.getAnalyticsOverview();
        const execPredictive = AdvancedAnalyticsDashboard.getPredictiveInsights();
        const execAI = AdvancedAnalyticsDashboard.getAIAnalytics();
        return NextResponse.json({
          success: true,
          data: {
            headline: 'Platform Analytics: Strong Performance',
            totalRevenue: `THB ${execOverview.totalRevenue.toLocaleString()}`,
            totalBookings: execOverview.totalBookings.toLocaleString(),
            activeCustomers: execOverview.activeCustomers.toLocaleString(),
            topTreatment: execOverview.topTreatments[0].treatmentName,
            nextMonthForecast: `THB ${execPredictive.nextMonthRevenue.toLocaleString()}`,
            aiAccuracy: `${execAI.accuracy}%`,
            aiContribution: execAI.impactMetrics.revenueContribution
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
