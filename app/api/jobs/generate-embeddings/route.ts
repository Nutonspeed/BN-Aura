import { NextResponse } from 'next/server';
import { generateAllEmbeddings } from '@/lib/jobs/generateEmbeddings';
import { createClient } from '@/lib/supabase/server';

/**
 * Cron Job: Generate Embeddings for Search
 * Recommended Schedule: Hourly or Daily depending on volume
 */
export async function POST(request: Request) {
  try {
    // Verify authentication (simple secret check for cron security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      // Allow if running in dev mode without secret for testing, or check admin session
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get clinic ID from request body if manual trigger, or iterate all active clinics
    const body = await request.json().catch(() => ({}));
    const { clinicId } = body;

    if (clinicId) {
        await generateAllEmbeddings(clinicId);
        return NextResponse.json({ success: true, message: `Embeddings generated for clinic ${clinicId}` });
    }

    // If no clinic ID, iterate all active clinics (Cron mode)
    const supabase = await createClient();
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id')
      .eq('is_active', true);

    if (clinics) {
        let processed = 0;
        for (const clinic of clinics) {
            try {
                await generateAllEmbeddings(clinic.id);
                processed++;
            } catch (err) {
                console.error(`Error generating embeddings for clinic ${clinic.id}:`, err);
            }
        }
        return NextResponse.json({ 
            success: true, 
            message: `Batch processed ${processed} clinics`,
            timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true, processed: 0 });

  } catch (error) {
    console.error('Generate embeddings job failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
