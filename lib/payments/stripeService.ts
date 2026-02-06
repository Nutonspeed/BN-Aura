/**
 * BN-Aura Stripe Payment Integration
 */

const STRIPE_API = 'https://api.stripe.com/v1';

export interface PaymentIntent {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year';
  features: string[];
}

// BN-Aura subscription plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_starter',
    amount: 2990,
    interval: 'month',
    features: ['50 AI scans/month', '1 staff account', 'Basic reports'],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceId: 'price_professional',
    amount: 9990,
    interval: 'month',
    features: ['200 AI scans/month', '5 staff accounts', 'Advanced reports', 'API access'],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceId: 'price_premium',
    amount: 19990,
    interval: 'month',
    features: ['500 AI scans/month', '15 staff accounts', 'Custom branding', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: 'price_enterprise',
    amount: 39990,
    interval: 'month',
    features: ['Unlimited scans', 'Unlimited staff', 'White-label', 'Dedicated support', 'Custom integrations'],
  },
];

// Create payment intent
export async function createPaymentIntent(
  payment: PaymentIntent
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[Stripe] Payment intent error:', error);
    return null;
  }
}

// Create subscription
export async function createSubscription(
  clinicId: string,
  planId: string,
  paymentMethodId: string
): Promise<{ subscriptionId: string; status: string } | null> {
  try {
    const response = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId, planId, paymentMethodId }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[Stripe] Subscription error:', error);
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/payments/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });
    return response.ok;
  } catch (error) {
    console.error('[Stripe] Cancel error:', error);
    return false;
  }
}

// Get invoice history
export async function getInvoices(clinicId: string): Promise<unknown[]> {
  try {
    const response = await fetch(`/api/payments/invoices?clinicId=${clinicId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.invoices || [];
  } catch (error) {
    console.error('[Stripe] Invoices error:', error);
    return [];
  }
}

// Format Thai Baht
export function formatTHB(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default {
  subscriptionPlans,
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  getInvoices,
  formatTHB,
};
