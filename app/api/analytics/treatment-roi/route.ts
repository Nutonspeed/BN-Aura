import { NextRequest, NextResponse } from 'next/server';
import { TreatmentROIAnalyzer } from '@/lib/analytics/treatmentROIAnalyzer';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      treatmentIds,
      clinicId,
      timeframe = 12
    } = body;

    // Validate required fields
    if (!treatmentIds || !Array.isArray(treatmentIds) || !clinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: treatmentIds, clinicId' 
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

    // Initialize analyzer
    const analyzer = new TreatmentROIAnalyzer();

    // Get ROI analyses
    const analyses = await analyzer.analyzeTreatmentROI(treatmentIds, clinicId, timeframe);

    // Calculate summary metrics
    const summary = {
      totalTreatments: analyses.length,
      averageROI: Math.round(
        analyses.reduce((sum, a) => sum + a.roi, 0) / analyses.length
      ),
      averageProfitMargin: Math.round(
        analyses.reduce((sum, a) => sum + a.profitMargin, 0) / analyses.length
      ),
      topROI: analyses[0]?.roi || 0,
      totalProjectedProfit: analyses.reduce((sum, a) => sum + a.projections.month12, 0),
      riskAssessment: {
        low: analyses.filter(a => 
          (a.riskFactors.marketRisk + a.riskFactors.operationalRisk + 
           a.riskFactors.financialRisk + a.riskFactors.competitiveRisk) / 4 < 30
        ).length,
        medium: analyses.filter(a => {
          const avgRisk = (a.riskFactors.marketRisk + a.riskFactors.operationalRisk + 
                          a.riskFactors.financialRisk + a.riskFactors.competitiveRisk) / 4;
          return avgRisk >= 30 && avgRisk < 60;
        }).length,
        high: analyses.filter(a => 
          (a.riskFactors.marketRisk + a.riskFactors.operationalRisk + 
           a.riskFactors.financialRisk + a.riskFactors.competitiveRisk) / 4 >= 60
        ).length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        analyses,
        summary,
        timeframe,
        timestamp: new Date().toISOString(),
        processingTime: analyses[0]?.processingTime || 0
      }
    });

  } catch (error) {
    console.error('[Treatment ROI Analysis] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate ROI analysis',
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

    if (!clinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: clinicId' 
        },
        { status: 400 }
      );
    }

    // Get all treatments for the clinic
    const supabase = await createClient();
    const { data: treatments } = await supabase
      .from('treatments')
      .select('id, names, category, price_min, price_max')
      .eq('clinic_id', clinicId);

    if (!treatments) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No treatments found for this clinic' 
        },
        { status: 404 }
      );
    }

    // Get ROI analyses for all treatments
    const treatmentIds = treatments.map(t => t.id);
    const analyzer = new TreatmentROIAnalyzer();
    const analyses = await analyzer.analyzeTreatmentROI(treatmentIds, clinicId, timeframe);

    // Add treatment details to analyses
    const analysesWithDetails = analyses.map(analysis => {
      const treatment = treatments.find(t => t.id === analysis.treatmentId);
      return {
        ...analysis,
        treatmentDetails: {
          name: treatment?.names?.en || treatment?.names?.th || 'Unknown',
          category: treatment?.category || 'unknown',
          priceRange: {
            min: treatment?.price_min || 0,
            max: treatment?.price_max || 0
          }
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        clinic: {
          id: clinicId,
          totalTreatments: treatments.length
        },
        analyses: analysesWithDetails,
        timeframe,
        summary: {
          totalTreatments: analyses.length,
          averageROI: Math.round(
            analyses.reduce((sum, a) => sum + a.roi, 0) / analyses.length
          ),
          averageProfitMargin: Math.round(
            analyses.reduce((sum, a) => sum + a.profitMargin, 0) / analyses.length
          ),
          totalProjectedProfit: analyses.reduce((sum, a) => sum + a.projections.month12, 0),
          topPerformers: analyses.slice(0, 3).map(a => ({
            treatmentName: a.treatmentName,
            roi: a.roi,
            profitMargin: a.profitMargin
          }))
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Treatment ROI Analysis GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get ROI analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
