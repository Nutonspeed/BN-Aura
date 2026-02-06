import { NextRequest, NextResponse } from 'next/server';
import { AITimeTravelEngine } from '@/lib/analysis/aiTimeTravelEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const age = parseInt(searchParams.get('age') || '35');
    const score = parseInt(searchParams.get('score') || '72');

    const result = AITimeTravelEngine.getSampleResult(age, score);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Time travel analysis error:', error);
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { age, skinScore, skinType } = body;

    if (!age) {
      return NextResponse.json({ error: 'Age is required' }, { status: 400 });
    }

    const result = AITimeTravelEngine.predictAging(
      age,
      skinScore || 72,
      skinType || 'combination'
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Time travel POST error:', error);
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}
