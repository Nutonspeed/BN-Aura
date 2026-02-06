import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/ai/geminiEnhanced';

export async function POST(request: NextRequest) {
  try {
    const { message, skinType, history } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    const response = await chatWithAI(message, { skinType, history });

    return NextResponse.json({
      success: true,
      data: { response },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json({ success: false, error: 'Chat failed' }, { status: 500 });
  }
}
