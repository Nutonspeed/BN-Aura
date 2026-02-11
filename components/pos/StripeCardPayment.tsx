'use client';

import React, { useState } from 'react';
// @ts-expect-error -- Stripe not installed yet
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface StripeCardPaymentProps {
  amount: number;
  transactionId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

function StripeCardPayment({ amount, transactionId, onSuccess, onError }: StripeCardPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setLoading(true);
    setCardError('');

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'thb',
          description: `POS Transaction ${transactionId}`,
          metadata: {
            transaction_id: transactionId,
            payment_type: 'card'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'POS Customer', // Could be enhanced to get customer name
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert back from satang
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          payment_method: 'CARD',
          stripe_payment_id: paymentIntent.id
        });
      } else {
        throw new Error(`Payment ${paymentIntent.status}`);
      }

    } catch (err: any) {
      console.error('Card payment error:', err);
      setCardError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 bg-secondary border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Card Details</span>
          </div>
          <div className="bg-white border border-border rounded-lg p-3">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {cardError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{cardError}</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className={cn(
          "w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3",
          "hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-premium"
        )}
      >
        {loading ? (
          <>
            <SpinnerGap className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Pay ฿{amount.toLocaleString()}
          </>
        )}
      </button>
    </form>
  );
}

export default StripeCardPayment;
