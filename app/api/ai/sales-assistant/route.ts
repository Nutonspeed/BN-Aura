import { NextRequest, NextResponse } from 'next/server';
import { SalesAssistantAI } from '@/lib/ai/salesAssistantAI';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'consultation';
    const body = await request.json();

    switch (action) {
      case 'consultation':
        const consultation = SalesAssistantAI.generateConsultation(body.customerId, body.skinAnalysis);
        return NextResponse.json({
          success: true,
          data: consultation,
          insights: {
            treatmentCount: consultation.recommendations.treatments.length,
            totalValue: consultation.recommendations.totalPrice,
            urgency: body.skinAnalysis?.severity || 'medium'
          }
        });

      case 'start-chat':
        const conversation = SalesAssistantAI.startConversation(body.customerId, body.message);
        return NextResponse.json({
          success: true,
          data: conversation,
          analysis: {
            leadQuality: conversation.leadQuality,
            nextAction: conversation.nextAction
          }
        });

      case 'product-recommendation':
        const recommendations = SalesAssistantAI.getProductRecommendations(body.skinType);
        return NextResponse.json({
          success: true,
          data: recommendations,
          summary: {
            count: recommendations.length,
            totalValue: recommendations.reduce((sum, r) => sum + r.price, 0)
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Sales Assistant API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        totalConsultations: 156,
        conversionRate: 68.5,
        aiUsageRate: 85,
        customerSatisfaction: 4.7
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get analytics'
    }, { status: 500 });
  }
}
