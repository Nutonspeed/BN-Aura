import { NextResponse } from 'next/server';
import { pricingEngine } from '@/lib/pricing/clinicPricingEngine';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle exchange rate requests
    if (action === 'exchange-rate') {
      const from = searchParams.get('from') || 'USD';
      const to = searchParams.get('to') || 'THB';
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, { next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          const rate = data.rates?.[to];
          if (rate) return NextResponse.json({ success: true, rate, from, to, timestamp: new Date().toISOString() });
        }
      } catch { /* fallback below */ }
      const fallbackRates: Record<string, number> = { 'USD_THB': 35.5, 'THB_USD': 0.0282 };
      return NextResponse.json({ success: true, rate: fallbackRates[`${from}_${to}`] || 35.5, from, to, fallback: true });
    }

    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    const pricing = await pricingEngine.getClinicTreatmentPricing(clinicId);
    return NextResponse.json({ success: true, data: { treatments: pricing } });
    
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicId, treatmentName, basePrice, salesCommissionRate } = body;

    if (!clinicId || !treatmentName || !basePrice) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    await pricingEngine.setTreatmentPricing(
      clinicId,
      treatmentName,
      basePrice,
      salesCommissionRate || 10
    );

    return successResponse({ message: 'Pricing updated successfully' });
    
  } catch (error) {
    return handleAPIError(error);
  }
}
