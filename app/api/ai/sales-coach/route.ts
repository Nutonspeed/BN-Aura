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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, context, data } = body;

    // ดึงข้อมูล clinic_id
    const { data: userData } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

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
