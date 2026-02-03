import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { ChurnPredictor } from '@/lib/ml/churnPrediction';
import { automationEngine } from '@/lib/automation/smartTriggers';

/**
 * Cron Job: Check Churn Risk for Customers
 * Recommended Schedule: Daily or Weekly
 */
export async function POST(request: Request) {
  try {
    // Verify authentication (simple secret check for cron security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      // Allow if running in dev mode without secret for testing
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createClient();
    const churnPredictor = new ChurnPredictor();

    // 1. Get all active clinics
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id')
      .eq('is_active', true);

    if (!clinics) return NextResponse.json({ success: true, processed: 0 });

    let processedCount = 0;

    // 2. Iterate clinics
    for (const clinic of clinics) {
      // Get customers who haven't been checked recently (e.g., last 7 days)
      // For this MVP, we just take a batch of active customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('clinic_id', clinic.id)
        .eq('status', 'active')
        .limit(50); // Process in batches

      if (customers) {
        for (const customer of customers) {
          try {
            // Predict Churn Risk
            const result = await churnPredictor.predictChurnRisk(customer.id);
            
            // Trigger Automation (checks rules and fires actions if needed)
            await automationEngine.checkChurnTriggers(customer.id, result.score, clinic.id);
            
            // Optionally update customer record with churn score
            // await supabase.from('customers').update({ churn_score: result.score }).eq('id', customer.id);
            
            processedCount++;
          } catch (err) {
            console.error(`Failed to process churn for customer ${customer.id}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Churn check job failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
