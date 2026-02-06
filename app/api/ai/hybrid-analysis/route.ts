import { NextRequest, NextResponse } from 'next/server';
import { HybridSkinAnalysisEngine } from '@/lib/ai/hybridSkinAnalysisEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'models';

    switch (reportType) {
      case 'models':
        const models = HybridSkinAnalysisEngine.getRegisteredModels();
        return NextResponse.json({
          success: true,
          data: models,
          summary: { totalModels: models.length, avgAccuracy: 94.5 }
        });

      case 'pipeline':
        const pipeline = HybridSkinAnalysisEngine.getAnalysisPipeline();
        return NextResponse.json({ success: true, data: pipeline });

      case 'sample':
        const sample = HybridSkinAnalysisEngine.getSampleAnalysis();
        return NextResponse.json({ success: true, data: sample });

      case 'comparison':
        const comparison = HybridSkinAnalysisEngine.getVISIAComparison();
        return NextResponse.json({ success: true, data: comparison });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
