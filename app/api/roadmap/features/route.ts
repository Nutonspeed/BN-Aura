import { NextRequest, NextResponse } from 'next/server';
import { FeatureRoadmapSystem } from '@/lib/roadmap/featureRoadmapSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'roadmap';

    switch (reportType) {
      case 'roadmap':
        const roadmap = FeatureRoadmapSystem.getCurrentRoadmap();
        return NextResponse.json({
          success: true,
          data: roadmap,
          summary: {
            quarters: roadmap.length,
            totalFeatures: roadmap.reduce((sum, q) => sum + q.features.length, 0)
          }
        });

      case 'requests':
        const requests = FeatureRoadmapSystem.getFeatureRequests();
        return NextResponse.json({ success: true, data: requests });

      case 'velocity':
        const velocity = FeatureRoadmapSystem.getDevelopmentVelocity();
        return NextResponse.json({ success: true, data: velocity });

      case 'executive':
        const executive = FeatureRoadmapSystem.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
