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
    const { salesId, customerId, treatmentName, amount, commissionRate, clinicId } = body;

    if (!salesId || !customerId || !treatmentName || !amount || !commissionRate || !clinicId) {
      return NextResponse.json({ 
        error: 'Missing required fields: salesId, customerId, treatmentName, amount, commissionRate, clinicId' 
      }, { status: 400 });
    }

    // Validate numeric values
    if (typeof amount !== 'number' || typeof commissionRate !== 'number') {
      return NextResponse.json({ 
        error: 'Amount and commissionRate must be valid numbers' 
      }, { status: 400 });
    }

    if (amount <= 0 || commissionRate < 0 || commissionRate > 100) {
      return NextResponse.json({ 
        error: 'Invalid values: amount must be positive, commissionRate must be between 0-100' 
      }, { status: 400 });
    }

    const commissionId = await pricingEngine.recordCommission(
      salesId,
      customerId,
      treatmentName,
      amount,
      commissionRate,
      clinicId
    );

    return successResponse({ 
      message: 'Commission recorded successfully',
      commissionId,
      calculatedCommission: (amount * commissionRate) / 100
    });
    
  } catch (error) {
    return handleAPIError(error);
  }
}
