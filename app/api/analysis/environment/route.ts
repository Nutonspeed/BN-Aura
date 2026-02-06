import { NextRequest, NextResponse } from 'next/server';
import { EnvironmentAdvisor } from '@/lib/analysis/environmentAdvisor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'Bangkok';
    const skinType = searchParams.get('skinType') || 'combination';
    const concerns = searchParams.get('concerns')?.split(',') || [];

    const result = EnvironmentAdvisor.getDailyAdvice(location, skinType, concerns);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Environment advisor error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, skinType, concerns } = body;

    const result = EnvironmentAdvisor.getDailyAdvice(
      location || 'Bangkok',
      skinType || 'combination',
      concerns || []
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Environment advisor POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
