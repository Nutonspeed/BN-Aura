/**
 * Omise Webhook Handler
 * Receives payment status updates from Omise
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body;

    // Verify this is from Omise (check key header in production)
    // In production, set OMISE_WEBHOOK_KEY and verify against it
    
    console.log('[Omise Webhook] Event received:', event.key, event.data?.id);

    if (event.key === 'charge.complete') {
      const charge = event.data;
      const adminClient = createAdminClient();

      // Update payment_transactions record
      const { error } = await adminClient
        .from('payment_transactions')
        .update({
          status: charge.status === 'successful' ? 'completed' : 'failed',
          metadata: {
            omise_charge_id: charge.id,
            omise_status: charge.status,
            failure_code: charge.failure_code,
            failure_message: charge.failure_message,
            paid_at: charge.paid_at,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('metadata->>omise_charge_id', charge.id);

      if (error) {
        console.error('[Omise Webhook] Failed to update payment:', error);
      }

      // If payment successful, create notification for the staff
      if (charge.status === 'successful' && charge.metadata?.created_by) {
        await adminClient.from('notifications').insert({
          user_id: charge.metadata.created_by,
          clinic_id: charge.metadata.clinic_id,
          type: 'payment',
          title: 'Payment Received',
          message: `Payment of ฿${(charge.amount / 100).toLocaleString()} received successfully`,
          priority: 'medium',
          action_url: '/clinic/payments',
          metadata: { charge_id: charge.id },
        });
      }

      // If PromptPay payment successful, update POS transaction
      if (charge.status === 'successful' && charge.metadata?.pos_transaction_id) {
        await adminClient
          .from('pos_transactions')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', charge.metadata.pos_transaction_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Omise Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
