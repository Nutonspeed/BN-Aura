import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/analysis/ar-session
 * Save AR treatment simulation session (screenshot + selected treatments + projected scores)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      analysisId,
      customerId,
      clinicId,
      selectedTreatments,
      currentScores,
      projectedScores,
      intensity,
      screenshotBase64,
    } = body;

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    // Upload screenshot to Supabase Storage if provided
    let screenshotUrl: string | null = null;
    if (screenshotBase64) {
      try {
        const buffer = Buffer.from(screenshotBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const fileName = `ar-sessions/${clinicId}/${Date.now()}-${user.id.slice(0, 8)}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('analysis-images')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('analysis-images')
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.warn('Screenshot upload failed:', e);
      }
    }

    // Save AR session record
    const { data: session, error } = await supabase
      .from('ar_sessions')
      .insert({
        analysis_id: analysisId || null,
        customer_id: customerId || null,
        clinic_id: clinicId,
        staff_id: user.id,
        selected_treatments: selectedTreatments || [],
        current_scores: currentScores || {},
        projected_scores: projectedScores || {},
        intensity: intensity || 0.7,
        screenshot_url: screenshotUrl,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // If table doesn't exist, store in metadata of skin_analyses instead
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Fallback: append to analysis metadata
        if (analysisId) {
          const { data: existing } = await supabase
            .from('skin_analyses')
            .select('metadata')
            .eq('id', analysisId)
            .single();

          const metadata = existing?.metadata || {};
          const arSessions = metadata.ar_sessions || [];
          arSessions.push({
            id: `ar-${Date.now()}`,
            selectedTreatments,
            currentScores,
            projectedScores,
            intensity,
            screenshotUrl,
            createdAt: new Date().toISOString(),
            staffId: user.id,
          });

          await supabase
            .from('skin_analyses')
            .update({ metadata: { ...metadata, ar_sessions: arSessions } })
            .eq('id', analysisId);

          return NextResponse.json({
            success: true,
            data: {
              sessionId: arSessions[arSessions.length - 1].id,
              screenshotUrl,
              savedTo: 'analysis_metadata',
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: { screenshotUrl, savedTo: 'screenshot_only' },
        });
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        screenshotUrl,
        savedTo: 'ar_sessions',
      },
    });
  } catch (error: any) {
    console.error('AR Session save error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save AR session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis/ar-session
 * Retrieve AR sessions for a customer or analysis
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const customerId = searchParams.get('customerId');

    // Try ar_sessions table first
    try {
      let query = supabase.from('ar_sessions').select('*');

      if (analysisId) {
        query = query.eq('analysis_id', analysisId);
      } else if (customerId) {
        query = query.eq('customer_id', customerId);
      } else {
        return NextResponse.json({ error: 'analysisId or customerId required' }, { status: 400 });
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

      if (error) throw error;
      return NextResponse.json({ success: true, data: data || [] });
    } catch {
      // Fallback: read from analysis metadata
      if (analysisId) {
        const { data: analysis } = await supabase
          .from('skin_analyses')
          .select('metadata')
          .eq('id', analysisId)
          .single();

        const sessions = analysis?.metadata?.ar_sessions || [];
        return NextResponse.json({ success: true, data: sessions });
      }

      return NextResponse.json({ success: true, data: [] });
    }
  } catch (error: any) {
    console.error('AR Session get error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
