import { NextRequest, NextResponse } from 'next/server';
import { TrendAnalysisSystem } from '@/lib/analytics/trendAnalysisSystem';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clinicId,
      timeframe = 12,
      analysisType = 'comprehensive' // 'skin-conditions', 'treatment-demand', 'comprehensive'
    } = body;

    // Validate required fields
    if (!clinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: clinicId' 
        },
        { status: 400 }
      );
    }

    // Validate timeframe
    if (timeframe < 1 || timeframe > 36) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Timeframe must be between 1 and 36 months' 
        },
        { status: 400 }
      );
    }

    // Initialize trend analysis system
    const trendAnalyzer = new TrendAnalysisSystem();

    let analysisData;

    switch (analysisType) {
      case 'skin-conditions':
        analysisData = await trendAnalyzer.analyzeSkinConditionTrends(clinicId, timeframe);
        break;
      
      case 'treatment-demand':
        analysisData = await trendAnalyzer.analyzeTreatmentDemandTrends(clinicId, timeframe);
        break;
      
      case 'comprehensive':
      default:
        analysisData = await trendAnalyzer.generateMarketTrendInsights(clinicId, timeframe);
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisType,
        timeframe,
        clinicId,
        analysis: analysisData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Trend Analysis] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate trend analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const timeframe = parseInt(searchParams.get('timeframe') || '12');
    const analysisType = searchParams.get('analysisType') || 'comprehensive';

    if (!clinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: clinicId' 
        },
        { status: 400 }
      );
    }

    // Initialize trend analysis system
    const trendAnalyzer = new TrendAnalysisSystem();

    let analysisData;

    switch (analysisType) {
      case 'skin-conditions':
        analysisData = await trendAnalyzer.analyzeSkinConditionTrends(clinicId, timeframe);
        break;
      
      case 'treatment-demand':
        analysisData = await trendAnalyzer.analyzeTreatmentDemandTrends(clinicId, timeframe);
        break;
      
      case 'comprehensive':
      default:
        analysisData = await trendAnalyzer.generateMarketTrendInsights(clinicId, timeframe);
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        clinicId,
        timeframe,
        analysisType,
        analysis: analysisData,
        summary: generateSummary(analysisData, analysisType),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Trend Analysis GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get trend analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateSummary(analysisData: any, analysisType: string) {
  switch (analysisType) {
    case 'skin-conditions':
      return {
        totalConditions: analysisData.length,
        topConditions: analysisData.slice(0, 3).map((c: any) => ({
          condition: c.condition,
          category: c.category,
          trend: c.predictions.nextMonth.trend
        }))
      };
    
    case 'treatment-demand':
      return {
        totalTreatments: analysisData.length,
        averageGrowth: Math.round(
          analysisData.reduce((sum: number, t: any) => sum + t.demand.trend.strength, 0) / analysisData.length
        ),
        topPerformers: analysisData.slice(0, 3).map((t: any) => ({
          treatment: t.treatmentName,
          demand: t.demand.current,
          growth: t.demand.trend.strength
        }))
      };
    
    case 'comprehensive':
    default:
      return {
        marketSize: analysisData.overallMarket.size,
        marketGrowth: analysisData.overallMarket.growth.trend,
        emergingTreatments: analysisData.emergingTreatments.length,
        decliningTreatments: analysisData.decliningTreatments.length,
        seasonalPatterns: analysisData.seasonalPatterns.length,
        anomalies: analysisData.anomalies.length
      };
  }
}
