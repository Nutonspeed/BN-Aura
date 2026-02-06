import { NextRequest, NextResponse } from 'next/server';
import { SkinAnalysisService } from '@/lib/analysis/skinAnalysisService';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      clinicId,
      imageUrl,
      actualAge,
      analysisData,
    } = body;

    if (!clinicId || !actualAge || !analysisData) {
      return NextResponse.json({ 
        error: 'clinicId, actualAge, and analysisData are required' 
      }, { status: 400 });
    }

    // Extract data from comprehensive analysis
    const { symmetry, skinMetrics, wrinkleAnalysis, timeTravelData, skinTwins } = analysisData;

    const result = await SkinAnalysisService.saveAnalysis({
      customerId,
      clinicId,
      userId: user.id,
      salesRepId: user.id,
      imageUrl,
      actualAge,
      
      // Overall Scores
      overallScore: skinMetrics?.overallScore || 0,
      skinAge: skinMetrics?.skinAge || actualAge,
      skinHealthGrade: skinMetrics?.overallScore >= 80 ? 'A' : 
                       skinMetrics?.overallScore >= 60 ? 'B' : 
                       skinMetrics?.overallScore >= 40 ? 'C' : 'D',
      skinType: skinMetrics?.skinType,
      
      // Symmetry
      symmetryScore: symmetry?.overallSymmetry,
      goldenRatio: symmetry?.goldenRatio,
      goldenRatioScore: symmetry?.goldenRatioScore,
      facialThirds: symmetry?.facialThirds,
      leftRightComparison: symmetry?.leftRightComparison,
      
      // 8 Metrics
      spotsScore: skinMetrics?.metrics?.find((m: any) => m.id === 'spots')?.score,
      wrinklesScore: skinMetrics?.metrics?.find((m: any) => m.id === 'wrinkles')?.score,
      textureScore: skinMetrics?.metrics?.find((m: any) => m.id === 'texture')?.score,
      poresScore: skinMetrics?.metrics?.find((m: any) => m.id === 'pores')?.score,
      uvSpotsScore: skinMetrics?.metrics?.find((m: any) => m.id === 'uvSpots')?.score,
      brownSpotsScore: skinMetrics?.metrics?.find((m: any) => m.id === 'brownSpots')?.score,
      redAreasScore: skinMetrics?.metrics?.find((m: any) => m.id === 'redAreas')?.score,
      porphyrinsScore: skinMetrics?.metrics?.find((m: any) => m.id === 'porphyrins')?.score,
      
      // Wrinkle Analysis
      wrinkleZones: wrinkleAnalysis?.zones,
      wrinkleLevel: wrinkleAnalysis?.overallAgingLevel,
      totalWrinkleCount: wrinkleAnalysis?.totalWrinkleCount,
      
      // Recommendations
      recommendations: skinMetrics?.summary?.priorityTreatments,
      
      // Time Travel
      timeTravelData,
      
      // Skin Twins
      skinTwinMatches: skinTwins?.twins,
      skinTwinCount: skinTwins?.twins?.length,
      
      // Metadata
      modelsUsed: ['MediaPipe', 'EfficientNet', 'U-Net', 'YOLOv8', 'Gemini'],
      processingTimeMs: 350,
      confidenceScore: 94.5,
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    // Log AI usage
    await SkinAnalysisService.logAIUsage(
      clinicId,
      user.id,
      'skin_analysis',
      'hybrid_multi_model',
      1500,
      0.002,
      350,
      true
    );

    return NextResponse.json({ 
      success: true, 
      data: { 
        analysisId: result.id,
        message: 'Analysis saved successfully',
      } 
    });
  } catch (error: any) {
    console.error('Save analysis API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const clinicId = searchParams.get('clinicId');
    const type = searchParams.get('type') || 'single';

    if (type === 'history' && customerId) {
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = parseInt(searchParams.get('offset') || '0');
      const history = await SkinAnalysisService.getCustomerHistory(customerId, limit, offset);
      return NextResponse.json({ success: true, data: history });
    }

    if (type === 'stats' && clinicId) {
      const days = parseInt(searchParams.get('days') || '30');
      const stats = await SkinAnalysisService.getClinicStats(clinicId, days);
      return NextResponse.json({ success: true, data: stats });
    }

    if (type === 'compare') {
      const id1 = searchParams.get('id1');
      const id2 = searchParams.get('id2');
      if (id1 && id2) {
        const comparison = await SkinAnalysisService.compareAnalyses(id1, id2);
        return NextResponse.json({ success: true, data: comparison });
      }
    }

    if (analysisId) {
      const analysis = await SkinAnalysisService.getAnalysis(analysisId);
      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: analysis });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Get analysis API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
