import { NextResponse } from 'next/server';
import { pricingEngine } from '@/lib/pricing/clinicPricingEngine';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Sales Commissions Tracking
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salesId = searchParams.get('salesId');
    const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'weekly' | 'daily';

    if (!salesId) {
      return NextResponse.json({ error: 'salesId is required' }, { status: 400 });
    }

    const summary = await pricingEngine.getSalesCommissionSummary(salesId, period);
    return successResponse({ summary });
    
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { salesId, customerId, treatmentName, amount, commissionRate } = body;

    if (!salesId || !customerId || !treatmentName || !amount || !commissionRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pricingEngine.recordCommission(
      salesId,
      customerId,
      treatmentName,
      amount,
      commissionRate
    );

    return successResponse({ message: 'Commission recorded successfully' });
    
  } catch (error) {
    return handleAPIError(error);
  }
}
