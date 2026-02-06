import { NextRequest, NextResponse } from 'next/server';
import { BurnRateAnalytics } from '@/lib/analytics/burnRateAnalytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'forecast';

    switch (action) {
      case 'forecast':
        return getForecast();
        
      case 'critical':
        return getCriticalClinics();
        
      case 'chart-data':
        return getChartData();
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Burn Rate Analytics API error:', error);
    return NextResponse.json(
      { error: 'Burn rate analytics failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getForecast() {
  const forecast = await BurnRateAnalytics.generateSystemForecast();
  
  return NextResponse.json({
    success: true,
    data: forecast,
    generatedAt: new Date().toISOString(),
    insights: generateInsights(forecast)
  });
}

async function getCriticalClinics() {
  const criticalClinics = await BurnRateAnalytics.getCriticalClinics();
  
  return NextResponse.json({
    success: true,
    data: criticalClinics,
    totalCritical: criticalClinics.length,
    urgentActions: generateUrgentActions(criticalClinics)
  });
}

async function getChartData() {
  const chartData = await BurnRateAnalytics.exportChartData();
  
  return NextResponse.json({
    success: true,
    data: chartData,
    chartTypes: ['burnRate', 'utilization', 'riskDistribution', 'timeline']
  });
}

function generateInsights(forecast: any) {
  const insights = [];
  
  if (forecast.averageBurnRate > 5.0) {
    insights.push({
      type: 'warning',
      message: `ระบบมี burn rate สูงกว่าปกติ (${forecast.averageBurnRate}/วัน)`
    });
  }
  
  if (forecast.clinicsAtRisk > 0) {
    insights.push({
      type: 'alert',
      message: `มี ${forecast.clinicsAtRisk} คลินิกที่มีความเสี่ยงสูง`
    });
  }
  
  if (forecast.projectedBudgetNeeds > 50000) {
    insights.push({
      type: 'budget',
      message: `งบประมาณเพิ่มเติมที่คาดว่าจำเป็น: ฿${forecast.projectedBudgetNeeds.toLocaleString()}`
    });
  }
  
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      message: 'ระบบทำงานในเกณฑ์ปกติ - ไม่มีความเสี่ยงสูง'
    });
  }
  
  return insights;
}

function generateUrgentActions(criticalClinics: any[]) {
  const actions: Array<{
    priority: string;
    clinic: string;
    action: string;
    estimatedCost: number;
  }> = [];
  
  criticalClinics.forEach(clinic => {
    if (clinic.daysUntilDepletion !== null && clinic.daysUntilDepletion <= 3) {
      actions.push({
        priority: 'urgent',
        clinic: clinic.clinicName,
        action: `ต้องเติม quota ทันที - เหลือเพียง ${clinic.daysUntilDepletion} วัน`,
        estimatedCost: Math.round((clinic.monthlyQuota - clinic.currentUsage) * 1.5 * 60)
      });
    } else if (clinic.utilizationRate >= 95) {
      actions.push({
        priority: 'high',
        clinic: clinic.clinicName,
        action: `ใช้ quota แล้ว ${clinic.utilizationRate}% - เตรียมแผนเติม quota`,
        estimatedCost: Math.round(clinic.monthlyQuota * 0.5 * 60)
      });
    }
  });
  
  return actions;
}
