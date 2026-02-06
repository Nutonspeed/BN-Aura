import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTracker } from '@/lib/monitoring/performanceTracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minutes = parseInt(searchParams.get('minutes') || '60');
    
    const summary = PerformanceTracker.getSummary(minutes);
    
    return NextResponse.json({
      success: true,
      data: summary,
      period: `${minutes} minutes`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get metrics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    switch (type) {
      case 'api':
        PerformanceTracker.trackAPI(data);
        break;
      case 'metric':
        PerformanceTracker.track(data.name, data.value, data.tags);
        break;
      case 'webvital':
        PerformanceTracker.trackWebVitals(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Performance tracking error:', error);
    return NextResponse.json({ success: false, error: 'Failed to track' }, { status: 500 });
  }
}
