/**
 * Skin Analysis Progress Timeline API
 * GET - Get customer's skin analysis history with score trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    const adminClient = createAdminClient();

    // Get staff clinic
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Build query
    let query = adminClient
      .from('skin_analyses')
      .select('id, customer_id, overall_score, skin_age, analysis_type, results, created_at')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: analyses, error } = await query;

    if (error) {
      console.error('[Progress] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    // Calculate trends
    const timeline = (analyses || []).map((a: any) => {
      const results = a.results || {};
      return {
        id: a.id,
        customerId: a.customer_id,
        date: a.created_at,
        overallScore: a.overall_score || results.overallScore || 0,
        skinAge: a.skin_age || results.skinAge || 0,
        type: a.analysis_type || 'comprehensive',
        metrics: {
          hydration: results.skinMetrics?.hydration || results.hydration || 0,
          elasticity: results.skinMetrics?.elasticity || results.elasticity || 0,
          texture: results.skinMetrics?.texture || results.texture || 0,
          pigmentation: results.skinMetrics?.pigmentation || results.pigmentation || 0,
          pores: results.skinMetrics?.pores || results.pores || 0,
          wrinkles: results.skinMetrics?.wrinkles || results.wrinkles || 0,
        },
      };
    });

    // Calculate improvement stats
    const stats = calculateStats(timeline);

    return NextResponse.json({
      success: true,
      data: {
        timeline,
        stats,
        totalAnalyses: timeline.length,
      },
    });
  } catch (error) {
    console.error('[Progress] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateStats(timeline: any[]) {
  if (timeline.length < 2) {
    return { trend: 'insufficient_data', scoreDelta: 0, skinAgeDelta: 0, period: null };
  }

  const latest = timeline[0];
  const oldest = timeline[timeline.length - 1];

  const scoreDelta = latest.overallScore - oldest.overallScore;
  const skinAgeDelta = latest.skinAge - oldest.skinAge;

  return {
    trend: scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'stable',
    scoreDelta,
    skinAgeDelta,
    latestScore: latest.overallScore,
    firstScore: oldest.overallScore,
    period: {
      from: oldest.date,
      to: latest.date,
      totalSessions: timeline.length,
    },
  };
}
