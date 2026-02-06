import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency = 'thb', customerId, description, metadata } = await request.json();

    if (!amount || amount < 20) {
      return NextResponse.json({ error: 'Invalid amount (min 20)' }, { status: 400 });
    }

    // Use real Stripe if key is configured (dynamic import to avoid build error when stripe is not installed)
    if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith('sk_')) {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to satang
        currency,
        metadata: { ...metadata, customerId, userId: user.id },
        description: description || 'BN-Aura Payment',
      });

      console.log('[Stripe] Created real payment intent:', paymentIntent.id);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        mode: 'live',
      });
    }

    // Fallback mock for development (no Stripe key)
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
      amount,
      currency,
      status: 'requires_payment_method',
    };

    console.log('[Stripe] Mock payment intent:', mockPaymentIntent.id);

    return NextResponse.json({
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
      mode: 'mock',
    });
  } catch (error) {
    console.error('[Stripe] Error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
