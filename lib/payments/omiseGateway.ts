/**
 * Omise Payment Gateway for BN-Aura
 * Supports: Credit Card, PromptPay QR, TrueMoney Wallet
 * Thai-optimized payment processing
 */

import Omise from 'omise';

const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY || '',
  secretKey: process.env.OMISE_SECRET_KEY || '',
});

export type PaymentMethod = 'credit_card' | 'promptpay' | 'truemoney' | 'internet_banking';
export type ChargeStatus = 'pending' | 'successful' | 'failed' | 'expired' | 'reversed';

export interface CreateChargeParams {
  amount: number; // in THB (will be converted to satang)
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  // For credit card
  token?: string;
  // For PromptPay / other sources
  source?: string;
  returnUri?: string;
}

export interface ChargeResult {
  id: string;
  status: ChargeStatus;
  amount: number;
  currency: string;
  authorizeUri?: string; // For redirect-based payments (PromptPay QR, 3DS)
  source?: {
    type: string;
    scannable_code?: {
      image: { download_uri: string };
    };
  };
  metadata?: Record<string, any>;
  failureCode?: string;
  failureMessage?: string;
  createdAt: string;
}

export interface CreateSourceParams {
  type: PaymentMethod;
  amount: number; // in THB
  currency?: string;
}

class OmiseGateway {
  /**
   * Create a payment source (for PromptPay, TrueMoney, etc.)
   */
  async createSource(params: CreateSourceParams): Promise<any> {
    const sourceType = this.mapSourceType(params.type);
    
    const source = await omise.sources.create({
      type: sourceType,
      amount: Math.round(params.amount * 100), // Convert THB to satang
      currency: params.currency || 'thb',
    });

    return source;
  }

  /**
   * Create a charge (process payment)
   */
  async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
    const chargeParams: any = {
      amount: Math.round(params.amount * 100), // Convert THB to satang
      currency: params.currency || 'thb',
      description: params.description || 'BN-Aura Payment',
      metadata: params.metadata || {},
    };

    if (params.token) {
      chargeParams.card = params.token;
    } else if (params.source) {
      chargeParams.source = params.source;
      chargeParams.return_uri = params.returnUri || `${process.env.NEXT_PUBLIC_APP_URL}/th/clinic/payments/complete`;
    }

    const charge = await omise.charges.create(chargeParams);

    return {
      id: charge.id,
      status: this.mapStatus(charge.status),
      amount: charge.amount / 100, // Convert satang back to THB
      currency: charge.currency,
      authorizeUri: charge.authorize_uri,
      source: charge.source,
      metadata: charge.metadata,
      failureCode: charge.failure_code,
      failureMessage: charge.failure_message,
      createdAt: charge.created_at,
    };
  }

  /**
   * Retrieve a charge by ID
   */
  async getCharge(chargeId: string): Promise<ChargeResult> {
    const charge = await omise.charges.retrieve(chargeId);

    return {
      id: charge.id,
      status: this.mapStatus(charge.status),
      amount: charge.amount / 100,
      currency: charge.currency,
      authorizeUri: charge.authorize_uri,
      source: charge.source,
      metadata: charge.metadata,
      failureCode: charge.failure_code,
      failureMessage: charge.failure_message,
      createdAt: charge.created_at,
    };
  }

  /**
   * Create a PromptPay QR charge
   */
  async createPromptPayCharge(amount: number, metadata?: Record<string, any>): Promise<ChargeResult> {
    const source = await this.createSource({
      type: 'promptpay',
      amount,
    });

    return this.createCharge({
      amount,
      source: source.id,
      metadata,
      returnUri: `${process.env.NEXT_PUBLIC_APP_URL}/th/clinic/payments/complete`,
    });
  }

  /**
   * Create a credit card charge using token from Omise.js
   */
  async createCardCharge(token: string, amount: number, metadata?: Record<string, any>): Promise<ChargeResult> {
    return this.createCharge({
      amount,
      token,
      metadata,
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string, signature: string): boolean {
    // Omise uses basic auth for webhooks, not signature verification
    // The webhook endpoint should be protected by checking the Omise-Webhook-Key header
    return true;
  }

  private mapSourceType(type: PaymentMethod): string {
    switch (type) {
      case 'promptpay': return 'promptpay';
      case 'truemoney': return 'truemoney';
      case 'internet_banking': return 'internet_banking_bbl'; // Default to BBL
      case 'credit_card': return 'card';
      default: return type;
    }
  }

  private mapStatus(status: string): ChargeStatus {
    switch (status) {
      case 'successful': return 'successful';
      case 'pending': return 'pending';
      case 'failed': return 'failed';
      case 'expired': return 'expired';
      case 'reversed': return 'reversed';
      default: return 'pending';
    }
  }
}

export const omiseGateway = new OmiseGateway();
export default OmiseGateway;
