import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getSalesCoachAdvice, 
  handleObjection, 
  getUpsellRecommendations,
  calculateDealProbability,
  CustomerContext 
} from '@/lib/ai/salesCoach';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // TODO: Temporarily skip auth check for testing
    // const { data: { user } } = await supabase.auth.getUser();
    // 
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Use hardcoded user for testing (sales2.test@bntest.com)
    const user = { id: 'f2d3667d-7ca9-454e-b483-83dffb7e5981' };

    const body = await request.json();
    const { action, context, data } = body;

    // TODO: Use hardcoded clinic_id for testing
    const userData = { 
      clinic_id: 'd1e8ce74-3beb-4502-85c9-169fa0909647'
    };

    const clinicId = userData.clinic_id;

    switch (action) {
      case 'get_advice': {
        const advice = await getSalesCoachAdvice(
          context as CustomerContext,
          data.conversation || '',
          clinicId
        );
        return NextResponse.json({ success: true, advice });
      }

      case 'handle_objection': {
        const response = await handleObjection(
          data.objection,
          context as CustomerContext,
          clinicId
        );
        return NextResponse.json({ success: true, response });
      }

      case 'get_upsell': {
        const recommendations = await getUpsellRecommendations(
          context as CustomerContext,
          data.currentTreatments || [],
          clinicId
        );
        return NextResponse.json({ success: true, recommendations });
      }

      case 'calculate_probability': {
        const probability = calculateDealProbability(
          context as CustomerContext,
          data.conversationMetrics
        );
        return NextResponse.json({ success: true, probability });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sales Coach API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
