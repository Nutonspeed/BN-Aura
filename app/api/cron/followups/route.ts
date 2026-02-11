/**
 * Cron Job: Follow-up Sequence Triggers
 * Runs every 2 hours — checks and triggers follow-up sequence steps
 * Vercel Cron: /api/cron/followups
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const now = new Date();
  const results = { triggered: 0, skipped: 0, errors: 0 };

  try {
    // Get active follow-up sequences with their steps
    const { data: sequences } = await adminClient
      .from('followup_sequences')
      .select('id, clinic_id, trigger_type, trigger_conditions, steps:followup_sequence_steps(*)')
      .eq('is_active', true);

    if (!sequences || sequences.length === 0) {
      return NextResponse.json({ success: true, message: 'No active sequences', ...results });
    }

    // Process post-treatment follow-ups
    for (const seq of sequences) {
      if (seq.trigger_type !== 'post_treatment') continue;

      const steps = (seq.steps as any[]) || [];
      if (steps.length === 0) continue;

      for (const step of steps) {
        if (!step.is_active) continue;

        const delayMs = ((step.delay_days || 0) * 86400000) + ((step.delay_hours || 0) * 3600000);
        const cutoffTime = new Date(now.getTime() - delayMs);
        const cutoffStart = new Date(cutoffTime.getTime() - 2 * 3600000); // 2-hour window

        // Find completed treatments in the window
        const { data: journeys } = await adminClient
          .from('customer_treatment_journeys')
          .select('id, customer_id, completed_at')
          .eq('clinic_id', seq.clinic_id)
          .eq('journey_status', 'completed')
          .gte('completed_at', cutoffStart.toISOString())
          .lt('completed_at', cutoffTime.toISOString());

        for (const journey of journeys || []) {
          // Check if already sent
          const { data: existing } = await adminClient
            .from('notifications')
            .select('id')
            .eq('recipient_id', journey.customer_id)
            .eq('type', `followup_${seq.id}_step_${step.step_order}`)
            .maybeSingle();

          if (existing) { results.skipped++; continue; }

          try {
            await adminClient.from('notifications').insert({
              type: `followup_${seq.id}_step_${step.step_order}`,
              recipient_id: journey.customer_id,
              channel: step.channel || 'sms',
              title: `Follow-up: ${seq.trigger_type}`,
              message: step.custom_content || 'ขอบคุณที่ใช้บริการ ท่านรู้สึกอย่างไรบ้างคะ?',
              metadata: { sequence_id: seq.id, step_order: step.step_order, journey_id: journey.id },
              status: 'queued',
            });
            results.triggered++;
          } catch { results.errors++; }
        }
      }
    }

    console.log(`[Cron Followups] triggered: ${results.triggered}, skipped: ${results.skipped}, errors: ${results.errors}`);
    return NextResponse.json({ success: true, ...results, timestamp: now.toISOString() });
  } catch (error) {
    console.error('[Cron Followups] Error:', error);
    return NextResponse.json({ error: 'Followup cron failed' }, { status: 500 });
  }
}
