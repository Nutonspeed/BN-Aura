import { NextRequest, NextResponse } from 'next/server';
import { PilotCaseStudies } from '@/lib/marketing/pilotCaseStudies';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'all';
    const caseId = searchParams.get('caseId');

    switch (reportType) {
      case 'all':
        const cases = PilotCaseStudies.generateCaseStudies();
        return NextResponse.json({
          success: true,
          data: cases,
          count: cases.length
        });

      case 'published':
        PilotCaseStudies.generateCaseStudies();
        const published = PilotCaseStudies.getPublishedCaseStudies();
        return NextResponse.json({
          success: true,
          data: published,
          count: published.length
        });

      case 'detail':
        PilotCaseStudies.generateCaseStudies();
        const detail = PilotCaseStudies.getCaseStudy(caseId || 'case_elite_bangkok');
        return NextResponse.json({
          success: true,
          data: detail
        });

      case 'summary':
        PilotCaseStudies.generateCaseStudies();
        const summary = PilotCaseStudies.getMarketingSummary();
        return NextResponse.json({
          success: true,
          data: summary
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
