import { NextRequest, NextResponse } from 'next/server';
import { MobileAppFoundation } from '@/lib/mobile/mobileAppFoundation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'features';

    switch (reportType) {
      case 'features':
        const features = MobileAppFoundation.getFeatureRoadmap();
        const mvpFeatures = features.filter(f => f.priority === 'mvp');
        return NextResponse.json({
          success: true,
          data: features,
          summary: { total: features.length, mvp: mvpFeatures.length }
        });

      case 'architecture':
        const architecture = MobileAppFoundation.getArchitecture();
        return NextResponse.json({ success: true, data: architecture });

      case 'metrics':
        const metrics = MobileAppFoundation.getProjectedMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'timeline':
        const timeline = MobileAppFoundation.getDevelopmentTimeline();
        return NextResponse.json({ success: true, data: timeline });

      case 'executive':
        const executive = MobileAppFoundation.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
