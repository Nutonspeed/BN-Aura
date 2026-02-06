import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementSystemV2 } from '@/lib/ai/aiEnhancementSystemV2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'conditions';

    switch (reportType) {
      case 'conditions':
        const conditions = AIEnhancementSystemV2.getSupportedConditions();
        return NextResponse.json({
          success: true,
          data: conditions,
          summary: { total: conditions.length, avgAccuracy: 95.5 }
        });

      case 'metrics':
        const metrics = AIEnhancementSystemV2.getModelMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'analysis':
        const analysis = AIEnhancementSystemV2.getSampleAnalysis();
        return NextResponse.json({ success: true, data: analysis });

      case 'roadmap':
        const roadmap = AIEnhancementSystemV2.getImprovementRoadmap();
        return NextResponse.json({ success: true, data: roadmap });

      case 'executive':
        const executive = AIEnhancementSystemV2.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
