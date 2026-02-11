/**
 * POST /api/payments/create-omise-charge
 * Create an Omise charge for Thai payment methods (PromptPay, Credit Card, TrueMoney)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { omiseGateway } from '@/lib/payments/omiseGateway';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staffData) {
      return NextResponse.json({ error: 'Not associated with a clinic' }, { status: 403 });
    }

    const body = await request.json();
    const { amount, method, token, posTransactionId, customerId, description } = body;

    if (!amount || amount < 20) {
      return NextResponse.json({ error: 'Minimum amount is ฿20' }, { status: 400 });
    }

    if (!method || !['credit_card', 'promptpay', 'truemoney'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Check if Omise keys are configured
    if (!process.env.OMISE_SECRET_KEY) {
      // Mock mode for development
      const mockCharge = {
        id: `chrg_mock_${Date.now()}`,
        status: method === 'credit_card' ? 'successful' : 'pending',
        amount,
        currency: 'thb',
        authorizeUri: method === 'promptpay' 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/th/clinic/payments/mock-qr?amount=${amount}`
          : undefined,
        source: method === 'promptpay' ? {
          type: 'promptpay',
          scannable_code: {
            image: { download_uri: '/api/payments/mock-qr' }
          }
        } : undefined,
        createdAt: new Date().toISOString(),
      };

      // Record in payment_transactions
      await supabase.from('payment_transactions').insert({
        clinic_id: staffData.clinic_id,
        transaction_type: 'ONLINE_PAYMENT',
        amount,
        currency: 'THB',
        payment_method: method === 'credit_card' ? 'CARD' : 'PROMPTPAY',
        status: mockCharge.status === 'successful' ? 'completed' : 'pending',
        payment_date: new Date().toISOString(),
        metadata: {
          omise_charge_id: mockCharge.id,
          pos_transaction_id: posTransactionId,
          customer_id: customerId,
          mode: 'mock',
        },
        created_by: user.id,
        updated_by: user.id,
      });

      return NextResponse.json({ charge: mockCharge, mode: 'mock' });
    }

    // Real Omise charge
    let charge;
    const metadata = {
      clinic_id: staffData.clinic_id,
      created_by: user.id,
      pos_transaction_id: posTransactionId,
      customer_id: customerId,
    };

    if (method === 'credit_card') {
      if (!token) {
        return NextResponse.json({ error: 'Card token is required' }, { status: 400 });
      }
      charge = await omiseGateway.createCardCharge(token, amount, metadata);
    } else if (method === 'promptpay') {
      charge = await omiseGateway.createPromptPayCharge(amount, metadata);
    } else {
      // TrueMoney or other sources
      const source = await omiseGateway.createSource({ type: method, amount });
      charge = await omiseGateway.createCharge({
        amount,
        source: source.id,
        metadata,
        returnUri: `${process.env.NEXT_PUBLIC_APP_URL}/th/clinic/payments/complete`,
      });
    }

    // Record in payment_transactions
    await supabase.from('payment_transactions').insert({
      clinic_id: staffData.clinic_id,
      transaction_type: 'ONLINE_PAYMENT',
      amount,
      currency: 'THB',
      payment_method: method === 'credit_card' ? 'CARD' : 'PROMPTPAY',
      status: charge.status === 'successful' ? 'completed' : 'pending',
      payment_date: new Date().toISOString(),
      metadata: {
        omise_charge_id: charge.id,
        pos_transaction_id: posTransactionId,
        customer_id: customerId,
        description,
      },
      created_by: user.id,
      updated_by: user.id,
    });

    return NextResponse.json({ charge, mode: 'live' });
  } catch (error: any) {
    console.error('[Omise] Error creating charge:', error);
    return NextResponse.json(
      { error: error.message || 'Payment failed' },
      { status: 500 }
    );
  }
}
