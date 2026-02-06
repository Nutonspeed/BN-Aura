import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'thb', customerId, description, metadata } = await request.json();

    if (!amount || amount < 20) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // In production, use Stripe SDK
    // const stripe = new Stripe(STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({ ... });

    // Mock response for development
    const mockPaymentIntent = {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
      amount,
      currency,
      status: 'requires_payment_method',
    };

    console.log('[Stripe] Created payment intent:', mockPaymentIntent.id);

    return NextResponse.json({
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
    });
  } catch (error) {
    console.error('[Stripe] Error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
