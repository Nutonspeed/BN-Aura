import { NextRequest, NextResponse } from 'next/server';
import { generateTreatmentRecommendations } from '@/lib/ai/geminiEnhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skinType, age, concerns, previousTreatments } = body;

    if (!skinType || !age || !concerns) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const recommendations = await generateTreatmentRecommendations({
      skinType,
      age,
      concerns,
      previousTreatments,
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI Recommendations] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
