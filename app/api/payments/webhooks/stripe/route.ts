import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook configuration missing');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' as any });
  const supabase = await createClient();

  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig!, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute, supabase);
        break;

      case 'charge.dispute.closed':
        await handleChargeDisputeClosed(event.data.object as Stripe.Dispute, supabase);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  // Update payment transaction status
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      metadata: {
        stripe_payment_id: paymentIntent.latest_charge,
        payment_confirmed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->>payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Failed to update payment transaction:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  // Update payment transaction status
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      metadata: {
        stripe_failure_code: paymentIntent.last_payment_error?.code,
        stripe_failure_message: paymentIntent.last_payment_error?.message,
        payment_failed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->>payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Failed to update payment transaction:', error);
  }

  // Send failure notification
  await createReconciliationNotification(
    supabase,
    'payment_failed',
    `Payment failed for PaymentIntent ${paymentIntent.id}`,
    'critical',
    { paymentIntentId: paymentIntent.id, error: paymentIntent.last_payment_error }
  );
}

/**
 * Handle charge dispute (chargeback)
 */
async function handleChargeDispute(dispute: Stripe.Dispute, supabase: any) {
  console.log(`Charge dispute created: ${dispute.id}`);

  // Find and update the payment transaction
  const { data: payment, error: findError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('metadata->>stripe_payment_id', dispute.charge)
    .single();

  if (findError || !payment) {
    console.error('Payment not found for dispute:', dispute.id);
    return;
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'disputed',
      metadata: {
        ...payment.metadata,
        stripe_dispute_id: dispute.id,
        dispute_reason: dispute.reason,
        dispute_amount: dispute.amount,
        dispute_created_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('Failed to update payment for dispute:', updateError);
  }

  // Create reconciliation notification
  await createReconciliationNotification(
    supabase,
    'chargeback',
    `Chargeback filed for payment ${payment.id}`,
    'critical',
    {
      paymentId: payment.id,
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason
    }
  );
}

/**
 * Handle dispute closure
 */
async function handleChargeDisputeClosed(dispute: Stripe.Dispute, supabase: any) {
  console.log(`Charge dispute closed: ${dispute.id}, status: ${dispute.status}`);

  const { error } = await supabase
    .from('payment_transactions')
    .update({
      metadata: {
        dispute_status: dispute.status,
        dispute_closed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->>stripe_dispute_id', dispute.id);

  if (error) {
    console.error('Failed to update dispute closure:', error);
  }

  // Notify based on dispute outcome
  const notificationType = dispute.status === 'won' ? 'dispute_won' : 'dispute_lost';
  const title = dispute.status === 'won' ? 'Dispute Won' : 'Dispute Lost';

  await createReconciliationNotification(
    supabase,
    notificationType,
    title,
    dispute.status === 'won' ? 'medium' : 'critical',
    { disputeId: dispute.id, status: dispute.status }
  );
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge, supabase: any) {
  console.log(`Charge refunded: ${charge.id}`);

  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: 'refunded',
      refund_amount: charge.amount_refunded / 100,
      metadata: {
        stripe_refund_id: charge.refunds?.data[0]?.id,
        refund_processed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->>stripe_payment_id', charge.id);

  if (error) {
    console.error('Failed to update refunded payment:', error);
  }
}

/**
 * Handle failed subscription invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  console.log(`Invoice payment failed: ${invoice.id}`);

  // Find clinic by customer ID if available
  if (invoice.customer) {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('metadata->stripe_customer_id', invoice.customer)
      .single();

    if (clinic) {
      await createReconciliationNotification(
        supabase,
        'subscription_payment_failed',
        'Subscription payment failed',
        'high',
        {
          clinicId: clinic.id,
          invoiceId: invoice.id,
          amount: invoice.amount_due / 100
        }
      );
    }
  }
}

/**
 * Create reconciliation notification
 */
async function createReconciliationNotification(
  supabase: any,
  type: string,
  title: string,
  priority: 'low' | 'medium' | 'high' | 'critical',
  data: any
) {
  try {
    // Find clinic from payment data if available
    let clinicId = data.clinicId;

    if (!clinicId && data.paymentId) {
      const { data: payment } = await supabase
        .from('payment_transactions')
        .select('clinic_id')
        .eq('id', data.paymentId)
        .single();

      clinicId = payment?.clinic_id;
    }

    if (!clinicId) {
      console.warn('Cannot create notification: no clinic ID found');
      return;
    }

    await supabase
      .from('notifications')
      .insert({
        clinic_id: clinicId,
        type: `reconciliation_${type}`,
        title,
        message: `Payment reconciliation event: ${title}`,
        priority,
        channels: ['in_app', 'email'],
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: data
      });
  } catch (error) {
    console.error('Failed to create reconciliation notification:', error);
  }
}
