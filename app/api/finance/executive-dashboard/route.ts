import { NextRequest, NextResponse } from 'next/server';
import { ExecutiveFinanceDashboard } from '@/lib/finance/executiveFinanceDashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing clinicId parameter' 
      }, { status: 400 });
    }

    switch (action) {
      case 'overview':
        return getFinancialOverview(clinicId);
        
      case 'kpis':
        return getKPIs(clinicId);
        
      case 'cashflow':
        return getCashFlow(clinicId);
        
      case 'forecast':
        return getForecast(clinicId);
        
      case 'alerts':
        return getAlerts(clinicId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Executive dashboard API error:', error);
    return NextResponse.json(
      { error: 'Executive dashboard failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getFinancialOverview(clinicId: string) {
  try {
    const overview = await ExecutiveFinanceDashboard.getFinancialOverview(clinicId);
    
    // Calculate additional insights
    const insights = {
      financialHealth: overview.kpis.netProfitMargin > 20 ? 'Excellent' :
                      overview.kpis.netProfitMargin > 15 ? 'Good' :
                      overview.kpis.netProfitMargin > 10 ? 'Fair' : 'Poor',
      
      cashFlowStatus: overview.cashFlow[overview.cashFlow.length - 1]?.netFlow > 0 ? 'Positive' : 'Negative',
      
      growthTrend: overview.kpis.revenueGrowth > 5 ? 'Growing' :
                   overview.kpis.revenueGrowth > 0 ? 'Stable' : 'Declining',
      
      riskLevel: overview.alerts.filter(a => a.type === 'critical').length > 0 ? 'High' :
                 overview.alerts.filter(a => a.type === 'warning').length > 2 ? 'Medium' : 'Low'
    };
    
    return NextResponse.json({
      success: true,
      data: overview,
      insights,
      summary: {
        totalCashFlow: overview.cashFlow.reduce((sum, cf) => sum + cf.netFlow, 0),
        currentBalance: overview.cashFlow[overview.cashFlow.length - 1]?.balance || 0,
        projectedRevenue: overview.forecast.reduce((sum, rev) => sum + rev, 0),
        alertCount: overview.alerts.length,
        criticalAlerts: overview.alerts.filter(a => a.type === 'critical').length
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get financial overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getKPIs(clinicId: string) {
  try {
    const overview = await ExecutiveFinanceDashboard.getFinancialOverview(clinicId);
    const kpis = overview.kpis;
    
    // Industry benchmarks for comparison
    const benchmarks = {
      grossProfitMargin: 65.0,
      netProfitMargin: 18.0,
      currentRatio: 1.5,
      burnRate: 40000,
      revenueGrowth: 6.0
    };
    
    // Performance vs benchmarks
    const performance = {
      grossProfitMargin: kpis.grossProfitMargin > benchmarks.grossProfitMargin ? 'Above' : 'Below',
      netProfitMargin: kpis.netProfitMargin > benchmarks.netProfitMargin ? 'Above' : 'Below',
      currentRatio: kpis.currentRatio > benchmarks.currentRatio ? 'Above' : 'Below',
      burnRate: kpis.burnRate < benchmarks.burnRate ? 'Better' : 'Worse',
      revenueGrowth: kpis.revenueGrowth > benchmarks.revenueGrowth ? 'Above' : 'Below'
    };
    
    return NextResponse.json({
      success: true,
      data: {
        current: kpis,
        benchmarks,
        performance
      },
      recommendations: generateKPIRecommendations(kpis, benchmarks)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get KPIs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCashFlow(clinicId: string) {
  try {
    const overview = await ExecutiveFinanceDashboard.getFinancialOverview(clinicId);
    const cashFlow = overview.cashFlow;
    
    // Calculate trends
    const totalInflow = cashFlow.reduce((sum, cf) => sum + cf.cashIn, 0);
    const totalOutflow = cashFlow.reduce((sum, cf) => sum + cf.cashOut, 0);
    const netCashFlow = totalInflow - totalOutflow;
    
    // Calculate burn rate and runway
    const monthlyBurnRate = overview.kpis.burnRate;
    const currentBalance = cashFlow[cashFlow.length - 1]?.balance || 0;
    const runwayMonths = monthlyBurnRate > 0 ? Math.floor(currentBalance / monthlyBurnRate) : 999;
    
    return NextResponse.json({
      success: true,
      data: {
        cashFlow,
        analysis: {
          totalInflow,
          totalOutflow,
          netCashFlow,
          monthlyBurnRate,
          runwayMonths,
          cashFlowTrend: netCashFlow > 0 ? 'Positive' : 'Negative'
        }
      },
      projections: generateCashFlowProjections(cashFlow)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get cash flow data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getForecast(clinicId: string) {
  try {
    const overview = await ExecutiveFinanceDashboard.getFinancialOverview(clinicId);
    const forecast = overview.forecast;
    
    // Calculate forecast metrics
    const totalForecast = forecast.reduce((sum, rev) => sum + rev, 0);
    const averageGrowth = forecast.length > 1 
      ? ((forecast[forecast.length - 1] - forecast[0]) / forecast[0]) * 100 / (forecast.length - 1)
      : 0;
    
    // Generate scenarios
    const scenarios = {
      optimistic: forecast.map(rev => Math.round(rev * 1.15)),
      realistic: forecast,
      pessimistic: forecast.map(rev => Math.round(rev * 0.85))
    };
    
    return NextResponse.json({
      success: true,
      data: {
        forecast,
        scenarios,
        metrics: {
          totalForecast,
          averageMonthlyGrowth: averageGrowth.toFixed(2),
          confidence: 85 // Mock confidence level
        }
      },
      factors: [
        'Historical revenue trends',
        'Seasonal adjustments',
        'Market conditions',
        'New service launches',
        'Customer acquisition rate'
      ]
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get revenue forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getAlerts(clinicId: string) {
  try {
    const overview = await ExecutiveFinanceDashboard.getFinancialOverview(clinicId);
    const alerts = overview.alerts;
    
    const alertSummary = {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      highImpact: alerts.filter(a => a.impact === 'high').length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: alertSummary,
        priorityActions: alerts
          .filter(a => a.type === 'critical' || a.impact === 'high')
          .slice(0, 3)
      },
      recommendations: generateAlertRecommendations(alerts)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get financial alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateKPIRecommendations(kpis: any, benchmarks: any): string[] {
  const recommendations = [];
  
  if (kpis.netProfitMargin < benchmarks.netProfitMargin) {
    recommendations.push('Focus on increasing profit margins through cost optimization or premium pricing');
  }
  
  if (kpis.currentRatio < benchmarks.currentRatio) {
    recommendations.push('Improve liquidity by managing working capital more effectively');
  }
  
  if (kpis.revenueGrowth < benchmarks.revenueGrowth) {
    recommendations.push('Implement growth strategies to increase revenue');
  }
  
  if (kpis.burnRate > benchmarks.burnRate) {
    recommendations.push('Reduce monthly burn rate through expense optimization');
  }
  
  return recommendations;
}

function generateCashFlowProjections(cashFlow: any[]): any[] {
  const lastMonth = cashFlow[cashFlow.length - 1];
  const projections = [];
  
  for (let i = 1; i <= 6; i++) {
    const projection = {
      month: `Month +${i}`,
      projectedCashIn: Math.round(lastMonth.cashIn * (1 + 0.05)), // 5% growth
      projectedCashOut: Math.round(lastMonth.cashOut * (1 + 0.03)), // 3% increase
      projectedBalance: Math.round(lastMonth.balance + (lastMonth.netFlow * i))
    };
    projections.push(projection);
  }
  
  return projections;
}

function generateAlertRecommendations(alerts: any[]): string[] {
  const recommendations = [];
  
  if (alerts.some(a => a.message.includes('Cash flow'))) {
    recommendations.push('Review cash flow management and payment terms with customers');
  }
  
  if (alerts.some(a => a.message.includes('expenses'))) {
    recommendations.push('Conduct detailed expense analysis and identify cost reduction opportunities');
  }
  
  if (alerts.length > 3) {
    recommendations.push('Schedule regular financial review meetings to address multiple issues');
  }
  
  return recommendations;
}
