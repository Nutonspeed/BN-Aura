import { NextRequest, NextResponse } from 'next/server';
import { SkinTwinMatcher } from '@/lib/analysis/skinTwinMatcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const concern = searchParams.get('concern');

    if (concern) {
      const successRates = SkinTwinMatcher.getTreatmentSuccessRate(concern);
      return NextResponse.json({ success: true, data: successRates });
    }

    const result = SkinTwinMatcher.getSampleResult();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Skin twin matching error:', error);
    return NextResponse.json({ success: false, error: 'Matching failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { age, gender, skinType, concerns, metrics, skinScore } = body;

    if (!age || !concerns || concerns.length === 0) {
      return NextResponse.json({ 
        error: 'Age and at least one concern are required' 
      }, { status: 400 });
    }

    const profile = {
      age,
      gender: gender || 'female',
      skinType: skinType || 'combination',
      concerns,
      metrics: metrics || {
        spots: 35,
        wrinkles: 58,
        pores: 42,
        texture: 70,
        brightness: 55,
      },
      skinScore: skinScore || 72,
    };

    const result = SkinTwinMatcher.findTwins(profile, 5);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Skin twin POST error:', error);
    return NextResponse.json({ success: false, error: 'Matching failed' }, { status: 500 });
  }
}
