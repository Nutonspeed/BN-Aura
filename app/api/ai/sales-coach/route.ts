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

    // Get clinic_id from clinic_staff table
    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const clinicId = staffData?.clinic_id || '';
    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic not found for user' }, { status: 404 });
    }

    // If skinAnalysis data is provided in context, enrich the CustomerContext
    let enrichedContext = context as CustomerContext;
    if (data?.skinAnalysisId) {
      try {
        const { data: analysis } = await supabase
          .from('skin_analyses')
          .select('*')
          .eq('id', data.skinAnalysisId)
          .single();

        if (analysis) {
          enrichedContext = {
            ...enrichedContext,
            skinAnalysis: {
              skinType: analysis.skin_type || enrichedContext?.skinAnalysis?.skinType || 'unknown',
              concerns: analysis.concerns || enrichedContext?.skinAnalysis?.concerns || [],
              ageEstimate: analysis.skin_age || enrichedContext?.skinAnalysis?.ageEstimate || 0,
              urgencyScore: analysis.urgency_score || enrichedContext?.skinAnalysis?.urgencyScore || 50,
            },
          };
        }
      } catch (e) {
        // Skin analysis lookup failed, use provided context as-is
      }
    }

    switch (action) {
      case 'get_advice': {
        const advice = await getSalesCoachAdvice(
          enrichedContext,
          data.conversation || '',
          clinicId
        );
        return NextResponse.json({ success: true, advice });
      }

      case 'handle_objection': {
        const response = await handleObjection(
          data.objection,
          enrichedContext,
          clinicId
        );
        return NextResponse.json({ success: true, response });
      }

      case 'get_upsell': {
        const recommendations = await getUpsellRecommendations(
          enrichedContext,
          data.currentTreatments || [],
          clinicId
        );
        return NextResponse.json({ success: true, recommendations });
      }

      case 'calculate_probability': {
        const probability = calculateDealProbability(
          enrichedContext,
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
