import { NextRequest, NextResponse } from 'next/server';
import { ExecutiveAnalytics } from '@/lib/analytics/executiveAnalytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const format = searchParams.get('format') || 'json';

    switch (action) {
      case 'dashboard':
        return getExecutiveDashboard();
        
      case 'kpis':
        return getExecutiveKPIs();
        
      case 'ranking':
        return getClinicRanking();
        
      case 'export':
        return exportExecutiveReport(format as 'json' | 'csv');
        
      case 'regional':
        return getRegionalAnalysis();
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Executive Analytics API error:', error);
    return NextResponse.json(
      { error: 'Executive analytics failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getExecutiveDashboard() {
  const dashboard = await ExecutiveAnalytics.generateExecutiveDashboard();
  
  return NextResponse.json({
    success: true,
    data: dashboard,
    insights: generateExecutiveInsights(dashboard),
    generatedAt: new Date().toISOString(),
    executiveSummary: generateExecutiveSummary(dashboard)
  });
}

async function getExecutiveKPIs() {
  const dashboard = await ExecutiveAnalytics.generateExecutiveDashboard();
  
  return NextResponse.json({
    success: true,
    data: dashboard.kpis,
    benchmarks: {
      industryAverage: {
        systemUtilization: 75,
        customerSatisfaction: 85,
        growthRate: 20
      },
      performanceStatus: {
        utilization: dashboard.kpis.systemUtilization > 75 ? 'Above Average' : 'Below Average',
        satisfaction: dashboard.kpis.customerSatisfaction > 85 ? 'Excellent' : 'Good',
        growth: dashboard.kpis.growthRate > 20 ? 'High Growth' : 'Stable Growth'
      }
    },
    trends: {
      quarter: 'Q1 2026',
      comparison: 'vs Q4 2025',
      changes: {
        revenue: '+15.2%',
        customers: '+12.8%',
        efficiency: '+8.5%'
      }
    }
  });
}

async function getClinicRanking() {
  const ranking = await ExecutiveAnalytics.getClinicRanking();
  
  return NextResponse.json({
    success: true,
    data: ranking,
    analysis: {
      topPerformer: ranking[0]?.clinicName || 'N/A',
      averageScore: Math.round(ranking.reduce((sum, c) => sum + c.performanceScore, 0) / ranking.length),
      improvementOpportunity: ranking[ranking.length - 1]?.clinicName || 'N/A',
      regionalLeader: getBestRegion(ranking)
    },
    recommendations: generateRankingRecommendations(ranking)
  });
}

async function exportExecutiveReport(format: 'json' | 'csv') {
  const report = await ExecutiveAnalytics.exportExecutiveReport(format);
  
  return NextResponse.json({
    success: true,
    data: report,
    metadata: {
      format,
      clinics: Array.isArray(report.data) ? report.data.length : 
               (report.data as any).clinicPerformance?.length || 0,
      exportTime: report.exportTime,
      version: '1.0.0'
    }
  });
}

async function getRegionalAnalysis() {
  const dashboard = await ExecutiveAnalytics.generateExecutiveDashboard();
  
  return NextResponse.json({
    success: true,
    data: dashboard.regionalAnalysis,
    summary: {
      totalRegions: dashboard.regionalAnalysis.length,
      topRegion: dashboard.regionalAnalysis.reduce((top, region) => 
        region.revenue > top.revenue ? region : top
      ),
      growthLeader: dashboard.regionalAnalysis.reduce((top, region) => 
        region.growthRate > top.growthRate ? region : top
      ),
      marketOpportunity: dashboard.regionalAnalysis
        .filter(r => r.marketPenetration < 20)
        .map(r => r.region)
    },
    insights: generateRegionalInsights(dashboard.regionalAnalysis)
  });
}

function generateExecutiveInsights(dashboard: any) {
  const insights = [];
  
  // Revenue insights
  if (dashboard.kpis.growthRate > 25) {
    insights.push({
      type: 'positive',
      category: 'growth',
      message: `Outstanding growth rate of ${dashboard.kpis.growthRate}% - well above industry average`,
      impact: 'High',
      recommendation: 'Scale successful strategies to underperforming regions'
    });
  }
  
  // Efficiency insights  
  if (dashboard.kpis.systemUtilization > 85) {
    insights.push({
      type: 'warning',
      category: 'capacity',
      message: `System utilization at ${dashboard.kpis.systemUtilization}% - approaching capacity limits`,
      impact: 'Medium',
      recommendation: 'Consider quota expansion for high-demand clinics'
    });
  }
  
  // Cost optimization
  if (dashboard.kpis.costOptimization > 10000) {
    insights.push({
      type: 'positive',
      category: 'cost',
      message: `AI optimization saving ฿${dashboard.kpis.costOptimization.toLocaleString()}/month`,
      impact: 'High',
      recommendation: 'Expand AI optimization to all clinics'
    });
  }
  
  return insights;
}

function generateExecutiveSummary(dashboard: any) {
  const totalRevenue = dashboard.kpis.totalRevenue;
  const topClinic = dashboard.clinicPerformance.reduce((top: any, clinic: any) => 
    clinic.revenueMetrics.monthlyRevenue > top.revenueMetrics.monthlyRevenue ? clinic : top
  );
  
  return {
    headline: `${dashboard.kpis.totalClinics} clinics generating ฿${totalRevenue.toLocaleString()}/month`,
    keyMetrics: {
      revenue: `฿${totalRevenue.toLocaleString()}`,
      customers: dashboard.kpis.totalCustomers.toLocaleString(),
      growth: `${dashboard.kpis.growthRate}%`,
      satisfaction: `${dashboard.kpis.customerSatisfaction}%`
    },
    highlights: [
      `Top performer: ${topClinic.clinicName} (฿${topClinic.revenueMetrics.monthlyRevenue.toLocaleString()})`,
      `System efficiency: ${dashboard.kpis.systemEfficiency}%`,
      `AI cost savings: ฿${dashboard.kpis.costOptimization.toLocaleString()}/month`
    ],
    priorities: dashboard.alerts.riskMitigation.length > 0 ? dashboard.alerts.riskMitigation : 
               ['Maintain current growth trajectory', 'Expand successful strategies']
  };
}

function getBestRegion(ranking: any[]) {
  const regionalScores: { [region: string]: number[] } = {};
  
  ranking.forEach(clinic => {
    if (!regionalScores[clinic.region]) {
      regionalScores[clinic.region] = [];
    }
    regionalScores[clinic.region].push(clinic.performanceScore);
  });
  
  const regionalAverages = Object.entries(regionalScores).map(([region, scores]) => ({
    region,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
  }));
  
  return regionalAverages.reduce((top, region) => 
    region.averageScore > top.averageScore ? region : top
  ).region;
}

function generateRankingRecommendations(ranking: any[]) {
  const recommendations = [];
  
  // Top performer insights
  const topPerformer = ranking[0];
  if (topPerformer) {
    recommendations.push({
      type: 'success_pattern',
      message: `Replicate ${topPerformer.clinicName}'s strategies (${topPerformer.performanceScore} score)`,
      priority: 'High'
    });
  }
  
  // Bottom performer improvement
  const bottomPerformer = ranking[ranking.length - 1];
  if (bottomPerformer && topPerformer && bottomPerformer.performanceScore < topPerformer.performanceScore * 0.7) {
    recommendations.push({
      type: 'improvement_needed',
      message: `${bottomPerformer.clinicName} needs support - 30% below top performer`,
      priority: 'High'
    });
  }
  
  // Regional opportunities
  const regions = [...new Set(ranking.map(c => c.region))];
  if (regions.length > 1) {
    recommendations.push({
      type: 'expansion',
      message: `Consider expansion in ${regions.length} active regions`,
      priority: 'Medium'
    });
  }
  
  return recommendations;
}

function generateRegionalInsights(regionalData: any[]) {
  const insights = [];
  
  const highGrowthRegions = regionalData.filter(r => r.growthRate > 25);
  if (highGrowthRegions.length > 0) {
    insights.push({
      type: 'growth_opportunity',
      regions: highGrowthRegions.map(r => r.region),
      message: 'High-growth regions identified for expansion focus'
    });
  }
  
  const lowPenetrationRegions = regionalData.filter(r => r.marketPenetration < 15);
  if (lowPenetrationRegions.length > 0) {
    insights.push({
      type: 'market_opportunity',
      regions: lowPenetrationRegions.map(r => r.region),
      message: 'Low market penetration - expansion opportunity'
    });
  }
  
  return insights;
}
